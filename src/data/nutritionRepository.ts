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

type PhotoNutritionEstimateResponse = {
  products?: PlanProduct[];
  notice?: string;
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

export async function estimateMealPhoto(imageDataUrl: string): Promise<{ products: PlanProduct[]; notice: string }> {
  const session = await ensureFreshSession();

  const { data, error } = await supabase.functions.invoke<PhotoNutritionEstimateResponse>('nutrition-photo-estimate', {
    body: { imageDataUrl },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (error) throw error;
  if (!data?.products?.length) {
    throw new Error('Сервис не распознал продукты на фотографии.');
  }

  return {
    products: data.products,
    notice: data.notice ?? 'Распознавание по фото приблизительное. Проверьте состав, вес и КБЖУ перед сохранением.',
  };
}
