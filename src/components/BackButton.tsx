type BackButtonProps = {
  onClick: () => void;
};

/** Shared in-app back control. Keep its appearance aligned across every screen. */
export function BackButton({ onClick }: BackButtonProps) {
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
