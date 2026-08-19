import { createClient } from "npm:@supabase/supabase-js@2";

type ProductInput = { id: string; name: string; amount: number; unit: string };
type FailureDetails = Record<
  string,
  string | number | boolean | null | undefined
>;
type JwtPayload = { sub?: unknown; role?: unknown };

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const DAILY_LIMIT = Number(
  Deno.env.get("AI_DAILY_LIMIT_NUTRITION_ESTIMATE") ?? "40",
);
const admin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null;

async function checkDailyLimit(userId: string, endpoint: string, limit: number) {
  if (!admin) return { allowed: true as const };
  const { data, error } = await admin.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_endpoint: endpoint,
  });
  if (error) return { allowed: false as const, code: "RATE_LIMIT_UNAVAILABLE" as const };
  return (data ?? 0) > limit
    ? { allowed: false as const, code: "DAILY_LIMIT_EXCEEDED" as const }
    : { allowed: true as const };
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object"
      ? (parsed as JwtPayload)
      : null;
  } catch {
    return null;
  }
};

const corsHeaders = (origin: string) => ({
  "access-control-allow-origin": origin,
  "access-control-allow-headers":
    "authorization, apikey, content-type, x-client-info",
  "access-control-allow-methods": "POST, OPTIONS",
  vary: "Origin",
});

const json = (origin: string, status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "content-type": "application/json" },
  });

const errorJson = (
  origin: string,
  status: number,
  code: string,
  message: string,
  requestId: string,
) => json(origin, status, { error: message, code, requestId });

const logFailure = (
  code: string,
  requestId: string,
  details: FailureDetails = {},
) => {
  console.error(
    JSON.stringify({
      event: "nutrition-estimate-failed",
      code,
      requestId,
      ...details,
    }),
  );
};

const allowedOrigins = () =>
  new Set(
    (Deno.env.get("ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );

const isProduct = (value: unknown): value is ProductInput => {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<ProductInput>;
  return (
    typeof product.id === "string" &&
    product.id.length <= 100 &&
    typeof product.name === "string" &&
    product.name.trim().length > 0 &&
    product.name.trim().length <= 120 &&
    typeof product.amount === "number" &&
    Number.isFinite(product.amount) &&
    product.amount > 0 &&
    product.amount <= 10000 &&
    typeof product.unit === "string" &&
    product.unit.trim().length > 0 &&
    product.unit.trim().length <= 24
  );
};

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get("origin") ?? "";
  if (!origin || !allowedOrigins().has(origin)) {
    logFailure("ORIGIN_NOT_ALLOWED", requestId);
    return new Response(
      JSON.stringify({
        error: "Origin is not allowed",
        code: "ORIGIN_NOT_ALLOWED",
        requestId,
      }),
      {
        status: 403,
        headers: { "content-type": "application/json", vary: "Origin" },
      },
    );
  }
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") {
    logFailure("METHOD_NOT_ALLOWED", requestId, { method: request.method });
    return errorJson(
      origin,
      405,
      "METHOD_NOT_ALLOWED",
      "Method not allowed",
      requestId,
    );
  }

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const authorization = request.headers.get("authorization");
    if (!openAiKey) {
      logFailure("SERVICE_NOT_CONFIGURED", requestId, {
        hasOpenAiKey: false,
      });
      return errorJson(
        origin,
        500,
        "SERVICE_NOT_CONFIGURED",
        "Nutrition service is not configured",
        requestId,
      );
    }
    if (!authorization) {
      logFailure("AUTHORIZATION_MISSING", requestId);
      return errorJson(
        origin,
        401,
        "AUTHORIZATION_MISSING",
        "Authentication is required",
        requestId,
      );
    }

    const accessToken = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!accessToken) {
      logFailure("AUTHORIZATION_MISSING", requestId);
      return errorJson(
        origin,
        401,
        "AUTHORIZATION_MISSING",
        "Authentication is required",
        requestId,
      );
    }

    // Supabase Edge Gateway verifies this JWT before the function runs.
    // Keep JWT verification enabled when deploying nutrition-estimate.
    const claims = decodeJwtPayload(accessToken);
    if (
      !claims ||
      typeof claims.sub !== "string" ||
      claims.sub.length === 0 ||
      claims.role !== "authenticated"
    ) {
      logFailure("AUTHORIZATION_FAILED", requestId);
      return errorJson(
        origin,
        401,
        "AUTHORIZATION_FAILED",
        "Authentication is required",
        requestId,
      );
    }

    const usage = await checkDailyLimit(claims.sub, "nutrition-estimate", DAILY_LIMIT);
    if (!usage.allowed) {
      logFailure(usage.code, requestId);
      return errorJson(
        origin,
        usage.code === "DAILY_LIMIT_EXCEEDED" ? 429 : 503,
        usage.code,
        usage.code === "DAILY_LIMIT_EXCEEDED"
          ? "Daily AI usage limit reached"
          : "Rate limiting is temporarily unavailable",
        requestId,
      );
    }

    const body = await request.json();
    if (
      !Array.isArray(body?.products) ||
      body.products.length < 1 ||
      body.products.length > 20 ||
      !body.products.every(isProduct)
    ) {
      logFailure("INVALID_PRODUCTS", requestId);
      return errorJson(
        origin,
        400,
        "INVALID_PRODUCTS",
        "Provide 1–20 valid products",
        requestId,
      );
    }
    const products = (body.products as ProductInput[]).map((product) => ({
      ...product,
      name: product.name.trim(),
      unit: product.unit.trim(),
    }));

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${openAiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        store: false,
        input: [
          {
            role: "developer",
            content:
              "Ты рассчитываешь ориентировочные КБЖУ продуктов. Для каждого продукта рассчитай калории, белки, жиры и углеводы именно для указанного количества и единицы. Используй типичные справочные значения для готового к употреблению продукта. Не меняй id и не объединяй продукты. Округляй ккал до целого, БЖУ до 0.1 г. Все значения должны быть неотрицательными.",
          },
          { role: "user", content: JSON.stringify(products) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "nutrition_estimate",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["products"],
              properties: {
                products: {
                  type: "array",
                  minItems: products.length,
                  maxItems: products.length,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["id", "calories", "protein", "fat", "carbs"],
                    properties: {
                      id: { type: "string" },
                      calories: { type: "number", minimum: 0 },
                      protein: { type: "number", minimum: 0 },
                      fat: { type: "number", minimum: 0 },
                      carbs: { type: "number", minimum: 0 },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      let providerCode: string | null = null;
      let providerType: string | null = null;
      try {
        const providerBody = (await response.json()) as {
          error?: { code?: unknown; type?: unknown };
        };
        providerCode =
          typeof providerBody.error?.code === "string"
            ? providerBody.error.code
            : null;
        providerType =
          typeof providerBody.error?.type === "string"
            ? providerBody.error.type
            : null;
      } catch {
        // The response body can be empty or non-JSON. Status is still enough for diagnostics.
      }
      logFailure("OPENAI_REQUEST_FAILED", requestId, {
        providerStatus: response.status,
        providerCode,
        providerType,
      });
      return errorJson(
        origin,
        502,
        "OPENAI_REQUEST_FAILED",
        "Nutrition calculation is temporarily unavailable",
        requestId,
      );
    }
    const result = await response.json();
    const outputText = result.output
      ?.flatMap(
        (item: { content?: Array<{ type?: string; text?: string }> }) =>
          item.content ?? [],
      )
      .find(
        (item: { type?: string; text?: string }) => item.type === "output_text",
      )?.text;
    if (typeof outputText !== "string") throw new Error("MISSING_OUTPUT");

    const parsed = JSON.parse(outputText);
    if (
      !Array.isArray(parsed?.products) ||
      parsed.products.length !== products.length
    )
      throw new Error("INVALID_OUTPUT");
    const expectedIds = new Set(products.map((product) => product.id));
    if (
      !parsed.products.every(
        (product: Record<string, unknown>) =>
          typeof product.id === "string" &&
          expectedIds.has(product.id) &&
          ["calories", "protein", "fat", "carbs"].every(
            (key) =>
              typeof product[key] === "number" &&
              Number.isFinite(product[key]) &&
              Number(product[key]) >= 0,
          ),
      )
    )
      throw new Error("INVALID_OUTPUT");

    return json(origin, 200, parsed);
  } catch (error) {
    const reason =
      error instanceof SyntaxError
        ? "INVALID_JSON"
        : error instanceof Error &&
            ["MISSING_OUTPUT", "INVALID_OUTPUT"].includes(error.message)
          ? error.message
          : "UNKNOWN";
    logFailure("UNEXPECTED_FAILURE", requestId, { reason });
    return errorJson(
      origin,
      500,
      "UNEXPECTED_FAILURE",
      "Nutrition calculation failed",
      requestId,
    );
  }
});
