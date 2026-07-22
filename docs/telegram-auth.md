# Авторизация Telegram Mini App

## Схема

1. Frontend получает только `Telegram.WebApp.initData` и отправляет его в Edge Function `telegram-auth`.
2. Функция проверяет HMAC-подпись по алгоритму Telegram, срок `auth_date` (не более пяти минут) и Telegram user ID. `initDataUnsafe` не используется.
3. Сервер находит либо создаёт подтверждённого Auth-пользователя с email `telegram_<id>@auth.ty-poela.local`.
4. Профиль `public.users` обновляется через `upsert` по уникальному `telegram_user_id`.
5. Frontend получает одноразовый `token_hash` и передаёт его в `supabase.auth.verifyOtp`. Service role key и токен бота не покидают функцию.

## Настройка Edge Function

Добавьте secrets в staging, не записывая значения в репозиторий:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=... ALLOWED_ORIGINS=https://miniapp.example.com
```

Edge Functions также предоставляют `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY`. `ALLOWED_ORIGINS` — точный список origins через запятую, например `https://one.example,https://two.example`. Origin локального Vite (`http://localhost:5173`) нужно добавить явно. Запросы без `Origin` и origins вне списка отклоняются.

## Frontend variables

Скопируйте `.env.example` в `.env.local` и заполните только публичные значения:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_AUTH_PREVIEW=false
```

Не добавляйте `TELEGRAM_BOT_TOKEN`, service role или `sb_secret_...` в переменные `VITE_*`.

## Локальный preview

`VITE_AUTH_PREVIEW=true npm run dev` показывает приложение вне Telegram только в Vite DEV mode. Preview не вызывает Edge Function, не подделывает `initData` и не создаёт Supabase session. Production build игнорирует preview-флаг.

## Deploy (выполнить вручную)

После настройки staging и проверки проекта:

```bash
supabase login
supabase link --project-ref <staging-project-ref>
supabase functions deploy telegram-auth --no-verify-jwt
```

В рамках разработки эти команды не запускаются. Существующие migrations повторно применять не нужно. `--no-verify-jwt` необходим для первого обмена Telegram init data, когда Supabase session ещё отсутствует.

## Ручной staging test

1. Откройте Mini App из разрешённого Telegram-бота и убедитесь, что появляется загрузка, затем основное приложение.
2. В Supabase Auth найдите технический email с Telegram ID тестового пользователя.
3. В `public.users` проверьте тот же `telegram_user_id`, заполненный `auth_user_id` и допустимые Telegram-имя/username.
4. Закройте Mini App, удалите локальную session (либо выйдите), затем откройте его снова тем же Telegram-пользователем.
5. Проверьте, что в Auth и `public.users` осталась ровно одна запись этого пользователя, а `auth_user_id` не изменился.
6. Отдельно проверьте отказ для origin вне allowlist и для init data старше пяти минут; секреты и полные пользовательские данные не должны появляться в логах.

Для подсчёта профилей (подставьте только тестовый ID в SQL Editor staging):

```sql
select count(*) from public.users where telegram_user_id = <telegram-id>;
```

Ожидаемый результат после обоих входов: `1`.
