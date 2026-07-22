interface TelegramBackButton {
  show(): void;
  hide(): void;
  onClick(callback: () => void): void;
  offClick(callback: () => void): void;
}

interface TelegramWebApp {
  initData: string;
  ready(): void;
  BackButton?: TelegramBackButton;
}

interface Window {
  Telegram?: { WebApp?: TelegramWebApp };
}
