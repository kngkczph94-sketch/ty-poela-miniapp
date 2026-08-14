# Ты поела — Telegram Mini App

Мобильное приложение для Telegram Mini App про питание: готовые рационы, рецепты, план питания, корзина продуктов, прогресс и AI-инструменты для подбора/оценки блюд.

## Стек

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase: Auth, Postgres, Storage, Edge Functions
- GitHub Pages для frontend deploy

## Что уже есть

- Главная, рационы, рецепты, план питания и корзина.
- Расчет БЖУ, прогресс, награды и шеринг приложения.
- Telegram Mini App auth через Supabase Edge Function `telegram-auth`.
- Сохранение плана питания и прогресса в Supabase для авторизованного пользователя.
- AI-подбор рецепта, генерация изображения рецепта и оценка КБЖУ по фото через Supabase Edge Functions.
- Ручные GitHub Actions workflow для staging Edge Functions и импорта контента в Supabase.

## Что еще не production-ready

- Подписка/оплата пока mock: Telegram Stars или другая реальная оплата не подключены.
- Edge Functions и Supabase migrations нужно деплоить/применять вручную через staging workflow или Supabase CLI.
- README не заменяет ручную проверку Mini App внутри Telegram: обычный браузер может показать экран входа через Telegram.

## Локальный запуск

```bash
npm install
npm run dev
```

Для локального просмотра вне Telegram используйте dev-only preview:

```bash
VITE_AUTH_PREVIEW=true npm run dev
```

Публичные переменные фронтенда задаются в `.env.local` по примеру `.env.example`:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_AUTH_PREVIEW=false
```

Не добавляйте `TELEGRAM_BOT_TOKEN`, service-role key или `sb_secret_...` в переменные `VITE_*`.

## Сборка

```bash
npm run build
```

## Staging operations

Edge Functions деплоятся вручную workflow `Deploy staging Edge Functions` с подтверждением `DEPLOY-STAGING-FUNCTIONS`.

Контент импортируется вручную workflow `Import staging content to Supabase` с подтверждением `IMPORT-STAGING`.

Перед пользовательской проверкой в Telegram убедитесь, что свежий `main` задеплоен на GitHub Pages, Edge Functions обновлены, а нужные Supabase migrations применены к staging/production.
