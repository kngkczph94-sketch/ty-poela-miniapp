type BackButtonProps = {
  onClick: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      BackButton?: unknown;
    };
  };
};

const hasTelegramNativeBackButton = () =>
  typeof window !== 'undefined' && Boolean((window as TelegramWindow).Telegram?.WebApp?.BackButton);

/** Shared in-app back control. Telegram gets its own native top-bar back button. */
export function BackButton({ onClick }: BackButtonProps) {
  if (hasTelegramNativeBackButton()) {
    return null;
  }

  return (
    <button
      aria-label="Вернуться назад"
      className="mb-4 self-start rounded-2xl bg-[#FFFDF8] px-4 py-3 text-sm font-black text-[#37410F] shadow-sm shadow-[#F3E2BF]/70 transition hover:bg-[#F3E2BF]"
      onClick={onClick}
      type="button"
    >
      ← Назад
    </button>
  );
}
