type FoodPhotoVariant = 'oatmeal' | 'omelet' | 'syrniki' | 'toast' | 'bowl' | 'fish' | 'pasta' | 'soup' | 'shrimp' | 'salad' | 'snack' | 'ration' | 'hero';

type FoodPhotoPlaceholderProps = {
  variant?: FoodPhotoVariant;
  className?: string;
};

type FoodPhotoRecipe = {
  plate: string;
  table: string;
  base: string;
  ingredients: string[];
  garnish: string;
};

const foodByVariant: Record<FoodPhotoVariant, FoodPhotoRecipe> = {
  oatmeal: { plate: 'bg-[#F8F0DD]', table: 'from-[#F7E7C9] via-[#EACD9B] to-[#C79B66]', base: 'bg-[#FFF9EB]', ingredients: ['bg-[#2F4F7F]', 'bg-[#C85B54]', 'bg-[#D99663]', 'bg-[#8B5E34]', 'bg-[#F7D77A]'], garnish: 'bg-[#F2B35D]' },
  omelet: { plate: 'bg-[#EEE5D0]', table: 'from-[#F9E9C8] via-[#ECD6AE] to-[#D7B27D]', base: 'bg-[#F7D66A]', ingredients: ['bg-[#D95F45]', 'bg-[#5F7D37]', 'bg-[#FFF4D7]', 'bg-[#B85B3A]', 'bg-[#7B8E43]'], garnish: 'bg-[#5F7D37]' },
  syrniki: { plate: 'bg-[#F4E8D1]', table: 'from-[#F8E7CE] via-[#E5C493] to-[#C79962]', base: 'bg-[#D89A54]', ingredients: ['bg-[#F6D18A]', 'bg-[#2F4F7F]', 'bg-[#C85B54]', 'bg-[#FFF7E7]', 'bg-[#815D3B]'], garnish: 'bg-[#C85B54]' },
  toast: { plate: 'bg-[#EFE6D2]', table: 'from-[#F9EAD2] via-[#EED4A8] to-[#C99D69]', base: 'bg-[#B9854E]', ingredients: ['bg-[#6E7E1F]', 'bg-[#F6F0D8]', 'bg-[#F0B85A]', 'bg-[#B54F3F]', 'bg-[#32420E]'], garnish: 'bg-[#6E7E1F]' },
  bowl: { plate: 'bg-[#F5EAD6]', table: 'from-[#F8ECD7] via-[#DFC596] to-[#B98B58]', base: 'bg-[#F7F2E5]', ingredients: ['bg-[#C57643]', 'bg-[#6E7E1F]', 'bg-[#E6B64A]', 'bg-[#8F4E42]', 'bg-[#D8E2B2]'], garnish: 'bg-[#6E7E1F]' },
  fish: { plate: 'bg-[#EFE5D0]', table: 'from-[#F7E6C8] via-[#E5C69A] to-[#C49663]', base: 'bg-[#F8F0DE]', ingredients: ['bg-[#E8D3A0]', 'bg-[#7A8A3A]', 'bg-[#E2A66C]', 'bg-[#DAD7C5]', 'bg-[#AD7B54]'], garnish: 'bg-[#9FB45E]' },
  pasta: { plate: 'bg-[#F1E4CD]', table: 'from-[#F8E7C9] via-[#E7C99C] to-[#CFA16B]', base: 'bg-[#E4B460]', ingredients: ['bg-[#C94F3A]', 'bg-[#6E7E1F]', 'bg-[#F8E6A8]', 'bg-[#8E5C3E]', 'bg-[#F2D18A]'], garnish: 'bg-[#6E7E1F]' },
  soup: { plate: 'bg-[#EFE4CE]', table: 'from-[#F8E9D0] via-[#E7C99C] to-[#C79A66]', base: 'bg-[#C7783E]', ingredients: ['bg-[#E6C56F]', 'bg-[#6E7E1F]', 'bg-[#D95F45]', 'bg-[#F8EDD5]', 'bg-[#8B5E34]'], garnish: 'bg-[#8AA044]' },
  shrimp: { plate: 'bg-[#F4E6D0]', table: 'from-[#F7E6CA] via-[#E4C394] to-[#BD8F5D]', base: 'bg-[#F7F1DF]', ingredients: ['bg-[#D9855D]', 'bg-[#6E7E1F]', 'bg-[#D84F3E]', 'bg-[#F1D480]', 'bg-[#9F6549]'], garnish: 'bg-[#6E7E1F]' },
  salad: { plate: 'bg-[#EFE5D0]', table: 'from-[#F9E9CF] via-[#E5C59A] to-[#BD9162]', base: 'bg-[#EAF1D4]', ingredients: ['bg-[#6E7E1F]', 'bg-[#D84F3E]', 'bg-[#F2CF58]', 'bg-[#F8F0D8]', 'bg-[#51372F]'], garnish: 'bg-[#87A34B]' },
  snack: { plate: 'bg-[#F4E8D4]', table: 'from-[#F8E8CF] via-[#E9C99A] to-[#C29562]', base: 'bg-[#FFF8E8]', ingredients: ['bg-[#C85B54]', 'bg-[#2F4F7F]', 'bg-[#D69B45]', 'bg-[#8B5E34]', 'bg-[#F7D77A]'], garnish: 'bg-[#C85B54]' },
  ration: { plate: 'bg-[#EFE4CE]', table: 'from-[#F9EAD3] via-[#E4C69A] to-[#BD9160]', base: 'bg-[#F7F0DE]', ingredients: ['bg-[#D87954]', 'bg-[#6E7E1F]', 'bg-[#F2CF58]', 'bg-[#F6F0D8]', 'bg-[#7B4A3E]'], garnish: 'bg-[#6E7E1F]' },
  hero: { plate: 'bg-[#EFE3CB]', table: 'from-[#F8ECD8] via-[#E1C59B] to-[#B68A5C]', base: 'bg-[#EAF1D4]', ingredients: ['bg-[#6E7E1F]', 'bg-[#D84F3E]', 'bg-[#F2CF58]', 'bg-[#F8F0D8]', 'bg-[#51372F]'], garnish: 'bg-[#87A34B]' },
};

export function getRecipeFoodVariant(recipeId: string): FoodPhotoVariant {
  if (recipeId.includes('breakfast-1')) return 'oatmeal';
  if (recipeId.includes('breakfast-2')) return 'omelet';
  if (recipeId.includes('breakfast-3')) return 'syrniki';
  if (recipeId.includes('breakfast-4')) return 'toast';
  if (recipeId.includes('lunch-2') || recipeId.includes('breakfast-5')) return 'bowl';
  if (recipeId.includes('lunch-3') || recipeId.includes('dinner-3')) return 'fish';
  if (recipeId.includes('lunch-4')) return 'pasta';
  if (recipeId.includes('lunch-5') || recipeId.includes('dinner-5')) return 'soup';
  if (recipeId.includes('dinner-1')) return 'shrimp';
  if (recipeId.includes('snack')) return 'snack';
  return 'salad';
}

export function FoodPhotoPlaceholder({ variant = 'ration', className = '' }: FoodPhotoPlaceholderProps) {
  const food = foodByVariant[variant];

  return (
    <div aria-hidden="true" className={`relative isolate overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${food.table} shadow-inner ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.85),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.28),transparent_42%)]" />
      <div className="absolute left-4 top-4 h-10 w-20 rounded-full bg-white/30 blur-md" />
      <div className="absolute right-3 top-3 h-16 w-16 rounded-full border border-white/25 bg-[#FFFDF8]/20" />
      <div className="absolute bottom-4 left-6 right-6 h-7 rounded-full bg-[#4B321F]/20 blur-lg" />
      <div className={`absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full ${food.plate} shadow-2xl shadow-[#4B321F]/20 ring-8 ring-white/35`}>
        <div className={`absolute inset-5 rounded-full ${food.base} shadow-inner`} />
        {food.ingredients.map((color, index) => (
          <span
            className={`absolute h-5 w-8 rounded-full ${color} shadow-sm ring-1 ring-white/35`}
            key={`${color}-${index}`}
            style={{ left: `${28 + (index % 3) * 22}%`, top: `${25 + Math.floor(index / 3) * 28}%`, transform: `rotate(${index % 2 ? '-' : ''}${18 + index * 9}deg)` }}
          />
        ))}
        <span className={`absolute left-[43%] top-[35%] h-8 w-8 rounded-full ${food.garnish} shadow-sm ring-2 ring-white/50`} />
      </div>
    </div>
  );
}
