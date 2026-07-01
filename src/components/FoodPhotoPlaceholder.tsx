type FoodPhotoVariant = 'oatmeal' | 'omelet' | 'syrniki' | 'toast' | 'bowl' | 'fish' | 'pasta' | 'soup' | 'shrimp' | 'salad' | 'snack' | 'ration' | 'hero';

type FoodPhotoPlaceholderProps = {
  variant?: FoodPhotoVariant;
  className?: string;
};

const foodByVariant: Record<FoodPhotoVariant, { emoji: string; garnish: string; accent: string }> = {
  oatmeal: { emoji: '🥣', garnish: '🫐', accent: 'bg-[#D99663]/45' },
  omelet: { emoji: '🍳', garnish: '🌿', accent: 'bg-[#F3E2BF]/80' },
  syrniki: { emoji: '🥞', garnish: '🍓', accent: 'bg-[#D99663]/35' },
  toast: { emoji: '🥑', garnish: '🍳', accent: 'bg-[#6E7E1F]/25' },
  bowl: { emoji: '🍲', garnish: '🥕', accent: 'bg-[#D99663]/35' },
  fish: { emoji: '🐟', garnish: '🥔', accent: 'bg-[#F3E2BF]/80' },
  pasta: { emoji: '🍝', garnish: '🍅', accent: 'bg-[#D99663]/40' },
  soup: { emoji: '🥘', garnish: '🌿', accent: 'bg-[#6E7E1F]/20' },
  shrimp: { emoji: '🍤', garnish: '🥗', accent: 'bg-[#D99663]/35' },
  salad: { emoji: '🥗', garnish: '🥒', accent: 'bg-[#6E7E1F]/25' },
  snack: { emoji: '🍓', garnish: '🥜', accent: 'bg-[#D99663]/30' },
  ration: { emoji: '🍽️', garnish: '🥗', accent: 'bg-[#F3E2BF]/80' },
  hero: { emoji: '🥗', garnish: '🍓', accent: 'bg-[#D99663]/35' },
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
    <div
      aria-hidden="true"
      className={`relative isolate overflow-hidden rounded-[1.5rem] border border-white/45 bg-gradient-to-br from-[#FFFDF8] via-[#F3E2BF] to-[#D99663]/55 shadow-inner ${className}`}
    >
      <div className={`absolute -right-6 -top-8 h-24 w-24 rounded-full ${food.accent} blur-sm`} />
      <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-[#6E7E1F]/20 blur-sm" />
      <div className="absolute inset-x-4 bottom-3 h-8 rounded-full bg-[#8B725F]/15 blur-md" />
      <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#FFFDF8]/75 text-lg shadow-sm backdrop-blur">
        {food.garnish}
      </div>
      <div className="absolute right-3 top-3 h-3 w-12 rounded-full bg-white/45" />
      <div className="flex h-full min-h-[7.5rem] items-center justify-center p-5">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FFFDF8]/80 text-5xl shadow-lg shadow-[#8B725F]/10 backdrop-blur">
          {food.emoji}
        </div>
      </div>
    </div>
  );
}
