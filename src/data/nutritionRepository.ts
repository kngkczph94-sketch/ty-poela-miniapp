import { ensureFreshSession, supabase } from '../lib/supabase';
import type { PlanProduct } from '../types/recipe';

type NutritionEstimateResponse = {
  products?: Array<{
    id: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>;
};

export async function estimatePlanProducts(products: PlanProduct[]): Promise<PlanProduct[]> {
  const session = await ensureFreshSession();

  const { data, error } = await supabase.functions.invoke<NutritionEstimateResponse>('nutrition-estimate', {
    body: {
      products: products.map(({ id, name, amount, unit }) => ({ id, name, amount, unit })),
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  if (!data?.products || data.products.length !== products.length) {
    throw new Error('Сервис вернул неполный расчёт КБЖУ.');
  }

  const estimates = new Map(data.products.map((product) => [product.id, product]));
  return products.map((product) => {
    const estimate = estimates.get(product.id);
    if (!estimate) throw new Error(`Не удалось рассчитать КБЖУ для «${product.name}».`);
    return { ...product, ...estimate };
  });
}
