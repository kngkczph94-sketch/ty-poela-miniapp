type FoodPhotoVariant = 'oatmeal' | 'omelet' | 'syrniki' | 'toast' | 'bowl' | 'fish' | 'pasta' | 'soup' | 'shrimp' | 'salad' | 'snack' | 'ration' | 'hero';

type FoodPhotoPlaceholderProps = {
  variant?: FoodPhotoVariant;
  className?: string;
  imageUrl?: string;
  alt?: string;
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

export function FoodPhotoPlaceholder({ className = '', imageUrl, alt = 'Фото блюда' }: FoodPhotoPlaceholderProps) {
  if (imageUrl) {
    return (
      <img
        alt={alt}
        className={`block h-full w-full rounded-3xl object-cover ${className}`}
        src={imageUrl}
      />
    );
  }

  return (
    <div aria-label="Фото блюда скоро добавим" className={`relative isolate flex items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A0C08] via-[#14170F] to-[#8FD14C]/55 shadow-inner ${className}`} role="img">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(255,255,255,0.9),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,253,248,0.42),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.3),transparent_48%)]" />
      <div className="absolute left-5 top-5 h-12 w-28 rounded-full bg-[#14170F]/30 blur-xl" />
      <div className="absolute bottom-4 right-5 h-16 w-16 rounded-full border border-white/30 bg-[#14170F]/20" />
      <div className="relative flex flex-col items-center rounded-[1.5rem] border border-white/45 bg-[#14170F]/50 px-5 py-4 text-center text-[#F4F7EE] shadow-lg shadow-[#A9B39C]/10 backdrop-blur-sm">
        <svg aria-hidden="true" className="mb-3 h-9 w-9 text-[#5C8A1E]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <rect height="28" rx="7" stroke="currentColor" strokeWidth="3" width="34" x="7" y="10" />
          <path d="M13 31L20 24L25 29L29 25L35 31" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <circle cx="31" cy="19" fill="currentColor" r="3" />
        </svg>
        <span className="text-sm font-black">Фото блюда</span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#A9B39C]">скоро добавим</span>
      </div>
    </div>
  );
}
