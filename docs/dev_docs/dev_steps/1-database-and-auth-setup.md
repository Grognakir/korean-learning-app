# Шаг 1: база приложения, БД и авторизация

Статус: план, к реализации. Соответствует пп. 1–4 из «Roadmap шагов реализации» в `0-mvp.md`.

> **Примечание по факту реализации:** ниже по документу защищённый экран описан как отдельный роут `app/dashboard/page.tsx` с редиректом `/` → `/dashboard` для авторизованных. По факту `/dashboard` как отдельный роут упразднён: содержимое дэшборда (см. `design/0-dashboard-home.md`) перенесено прямо в `app/page.tsx` — корневой роут сам решает, что рендерить (лендинг для гостя или дэшборд для авторизованного), без промежуточного редиректа. `signIn`/`signOut`/`/confirm` ведут на `/`, `PROTECTED_PREFIXES` в `lib/supabase/middleware.ts` — пустой массив (защищённых роутов, кроме самого `/`, пока нет). Код-сниппеты ниже сохранены как есть — описывают намерение шага 1, а не текущую структуру файлов.

## Что входит в этот шаг

- Инициализация Next.js-проекта (TypeScript, App Router, pnpm).
- Подключение Supabase: **только локально** через CLI (`supabase init` + `supabase start`) — вся разработка и все миграции этого шага идут против локальной БД.
- Таблица `profiles` с RLS и авто-созданием строки при регистрации.
- Auth-флоу: регистрация (email + пароль + username), подтверждение email, логин, логаут, middleware защиты приватных роутов.

## Вне скоупа этого шага

- **Облачный проект Supabase.** Сознательно не создаём его сейчас. Пока схема (`profiles` и всё, что добавится в следующих шагах — `review_events`, `progress`, `textbook_pages`) не устоялась, каждая правка означала бы либо ручное редактирование схемы в облаке с последующим ручным вычитыванием обратно в файлы миграций, либо новую миграцию на каждую мелкую итерацию — то и другое лишняя работа на материале, который ещё меняется. Локально миграции можно свободно переписывать и накатывать с нуля (`supabase db reset`) сколько угодно раз без последствий — в облаке так не сделать, там история миграций необратима. Облачный проект создаётся и линкуется одним шагом (`supabase link` + `supabase db push`) позже — на этапе деплоя, когда схема первой версии приложения стабилизируется (см. `1-cicd-and-testing.md`, где уже описан ручной `supabase db push` перед мержем PR со сменой схемы — он относится к этому будущему моменту, не к текущему шагу).
- `review_events` / `progress` и вся SRS-логика — Roadmap п.5, отдельный шаг (`2-flashcards-and-progress.md`, будет добавлен позже).
- Офлайн outbox (ADR-0001) — Roadmap п.6.
- Переключение шрифтов (`2-design-system.md`), PWA-обвязка, тесты/CI, деплой — последующие шаги.
- `textbook_pages`/справочник (ADR-0002, `3-dictionary-and-learning.md`) — отдельная, более поздняя часть скоупа.

## 1. Инициализация проекта

```bash
pnpm create next-app@latest korean-learning-app \
  --typescript --eslint --app --src-dir \
  --import-alias "@/*" --no-tailwind
cd korean-learning-app
pnpm add @supabase/supabase-js @supabase/ssr zod
```

`--no-tailwind` — дизайн строится на CSS Modules + токенах (`styles/tokens.css`), см. `2-design-system.md`, Tailwind не входит в стек.

Supabase CLI — глобально или через `pnpm dlx`, без добавления в зависимости проекта:

```bash
pnpm dlx supabase --version   # проверить, что CLI доступен
```

## 2. Структура файлов после этого шага

Соответствует общей структуре из `0-mvp.md`, с деталями, которые появляются именно на этом шаге:

```
src/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
      confirm/route.ts        # обработчик колбэка подтверждения email
    dashboard/page.tsx         # заглушка защищённой страницы — подтвердить, что middleware работает
    layout.tsx
    page.tsx                   # публичная главная / редирект на /login или /dashboard
  features/
    auth/
      actions.ts                # server actions: signUp, signIn, signOut
      schemas.ts                 # zod-схемы регистрации/логина
      components/
        LoginForm.tsx
        RegisterForm.tsx
  lib/
    supabase/
      client.ts                 # browser-клиент
      server.ts                 # server-клиент (cookies из next/headers)
      middleware.ts              # updateSession — обновление cookie на каждый запрос
  proxy.ts                       # корневой файл-конвенция Next.js 16 (бывший middleware.ts, см. примечание ниже), вызывает lib/supabase/middleware
  styles/
    globals.css
supabase/
  config.toml
  migrations/
    <timestamp>_profiles.sql     # имя файла — формат Supabase CLI (timestamp + описание), не наша конвенция файлов
.env.local                       # не коммитится
.env.local.example                # коммитится, с плейсхолдерами
```

## 3. Зависимости, добавляемые на этом шаге

| Пакет | Назначение |
|---|---|
| `@supabase/supabase-js` | базовый клиент Supabase |
| `@supabase/ssr` | клиенты с сессией в httpOnly cookie (browser/server), см. `0-mvp.md` про ограничение — клиентский JS не имеет токена |
| `zod` | валидация форм регистрации/логина на клиенте и сервере |

## 4. Supabase: только локально на этом шаге

Облачный проект не создаётся — см. «Вне скоупа этого шага» про причину. Вся разработка и все миграции идут против локального стека:

```bash
pnpm dlx supabase init
pnpm dlx supabase start
```

Требует Docker. `supabase start` поднимает Postgres + Auth + Storage локально и выводит в терминал локальные `API URL`, `anon key`, `service_role key` — их брать для `.env.local` (раздел 5). Ту же команду использует и Playwright в CI (`1-cicd-and-testing.md`) — окружение для тестов и для разработки одно и то же, без рассинхрона.

Если порты по умолчанию (`54321`–`54329`) заняты другим локальным Supabase-проектом — сдвинуть все порты в `supabase/config.toml` на произвольный офсет (например, `+10`), это не влияет на остальную конфигурацию.

`supabase init` генерирует `config.toml` с `[auth.email] enable_confirmations = false` — это дефолт CLI ради удобства локальной разработки, но он расходится с продуктовым решением из `0-mvp.md` («обязательное подтверждение email перед первым входом»). Проставить `enable_confirmations = true`, иначе локальное поведение не будет соответствовать проду, а сценарий подтверждения email из раздела 12 не протестируется. Локально письма подтверждения не уходят по-настоящему — их видно в Mailpit (`supabase status` печатает `MAILPIT_URL`, обычно порт `+3` от API-порта).

Схему можно свободно переписывать и пересобирать с нуля:

```bash
pnpm dlx supabase db reset   # удаляет локальную БД и заново накатывает все миграции
```

Когда (в одном из следующих шагов, не в этом) появится нужда в облачном проекте — тогда одним разом: создать проект на `supabase.com`, `supabase link --project-ref <project-ref>`, `supabase db push` — вся накопленная к тому моменту история миграций уедет в облако разом, а не по кусочку на каждую локальную итерацию.

## 5. Переменные окружения

`.env.local` (не коммитится, добавить в `.gitignore` сразу). На этом шаге — только значения из вывода `supabase start`, никаких облачных:

| Переменная | Значение | Где используется |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | локальный API URL из `supabase start` (обычно `http://127.0.0.1:54321`) | browser + server клиенты |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | локальный anon key из вывода `supabase start` | browser + server клиенты |
| `SUPABASE_SERVICE_ROLE_KEY` | локальный service role key из вывода `supabase start` | только серверные скрипты с явным обходом RLS (скрипты импорта контента, `3-dictionary-and-learning.md`) — в auth-флоу этого шага не используется |

Когда появится облачный проект (см. раздел 4) — это те же три переменные, но со значениями из дашборда Supabase, и уже отдельно для окружения деплоя (Vercel env vars), не через `.env.local`.

`.env.local.example` — тот же список с пустыми/плейсхолдерными значениями, коммитится.

## 6. Миграция: `profiles`

`supabase/migrations/<timestamp>_profiles.sql`:

```sql
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  font_latin text,
  font_kr text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT-политики для обычных пользователей нет намеренно: строка profiles
-- создаётся только триггером ниже (security definer), не прямой вставкой с клиента.

-- В текущей версии Supabase CLI новые таблицы не открываются в Data API
-- автоматически (auto_expose_new_tables больше не включён по умолчанию,
-- см. комментарий в supabase/config.toml, [api]) — одних RLS-политик
-- недостаточно, без явного GRANT запрос от authenticated молча возвращает
-- пустой результат, как будто RLS блокирует всё. Правило для всех таблиц
-- со своими RLS-политиками, не только profiles: GRANT нужен и в
-- следующих шагах (review_events, progress, textbook_pages).
grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

Пояснение по `username`: значение приходит из `raw_user_meta_data`, которое заполняется при регистрации через `options.data.username` в вызове `supabase.auth.signUp()` (см. раздел 9). Если поле не передано (не должно происходить при обычной регистрации через форму, но подстраховка на случай прямого вызова API) — используется часть email до `@`.

Применить миграцию локально:

```bash
pnpm dlx supabase db reset   # применяет все миграции с нуля на локальной БД
```

И на облачный проект при готовности (или через `supabase db push` — решение по миграциям в CI см. `1-cicd-and-testing.md`, там миграции сознательно оставлены ручным шагом).

## 7. Supabase-клиенты

`src/lib/supabase/client.ts` — для клиентских компонентов:

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

`src/lib/supabase/server.ts` — для server components / server actions / route handlers:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // вызов из server component (не route handler/server action) —
            // запись cookie недоступна, сессию продлевает middleware
          }
        },
      },
    }
  )
}
```

`src/lib/supabase/middleware.ts` — обновление cookie сессии на каждый запрос (стандартный паттерн `@supabase/ssr`):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p))
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response
}
```

`src/proxy.ts` (корневой):

> **Примечание по факту реализации:** в Next.js 16 файл-конвенция `middleware.ts` устарела и переименована в `proxy.ts` (экспортируемая функция — `proxy`, не `middleware`); `next build` явно предупреждает об этом и предлагает codemod. Внутренний модуль `lib/supabase/middleware.ts` переименовывать не нужно — конвенция касается только корневого файла.

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## 8. Валидация: `features/auth/schemas.ts`

```ts
import { z } from 'zod'

export const registerSchema = z.object({
  username: z.string().min(2, 'Минимум 2 символа').max(32),
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Минимум 8 символов'),
})

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
```

Клиентская валидация (в формах, для мгновенной обратной связи) — этими же схемами через `zodResolver`, если используется `react-hook-form`, либо ручной вызов `.safeParse()` перед отправкой. Серверная — обязательный повторный `.safeParse()` в начале каждого server action, клиенту не доверяем (см. `0-mvp.md`, раздел «Безопасность», п.5).

## 9. Server actions: `features/auth/actions.ts`

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { registerSchema, loginSchema } from './schemas'

export async function signUp(formData: FormData) {
  const parsed = registerSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { username: parsed.data.username } },
  })
  if (error) return { error: error.message }

  return { success: true } // экран "проверьте почту для подтверждения"
}

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: error.message }

  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

## 10. Подтверждение email: `app/(auth)/confirm/route.ts`

Supabase Auth по умолчанию отправляет письмо со ссылкой на редирект с кодом; роут обменивает код на сессию:

```ts
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
```

URL этого роута (`<origin>/confirm`) прописывается в настройках Supabase Auth проекта (Redirect URLs) — иначе письмо со ссылкой подтверждения будет вести в никуда.

## 11. Страницы

- `app/(auth)/register/page.tsx` — форма (username, email, password) → `signUp`. При `{success: true}` — не редирект, а экран «письмо отправлено, подтвердите email».
- `app/(auth)/login/page.tsx` — форма (email, password) → `signIn`.
- `app/dashboard/page.tsx` — заглушка: серверный компонент, читает `supabase.auth.getUser()` и строку `profiles`, выводит `Привет, {username}` + кнопка логаута (форма на `signOut`). Существует на этом шаге только чтобы подтвердить, что middleware реально защищает роут и профиль реально создаётся триггером — контент дэшборда наполняется в следующих шагах.

## 12. Критерии готовности

```gherkin
Given пользователь на /register, заполнил username/email/пароль корректными данными
When отправляет форму
Then видит экран "подтвердите email", в auth.users появляется пользователь, в profiles — строка с его username

Given пользователь перешёл по ссылке подтверждения из письма
When ссылка обработана роутом /confirm
Then он авторизован и видит /dashboard со своим username

Given неавторизованный пользователь
When открывает /dashboard напрямую по URL
Then его редиректит на /login, а не показывает страницу с ошибкой доступа к данным

Given авторизованный пользователь на /dashboard
When нажимает "выйти"
Then сессия завершается, следующий заход на /dashboard снова редиректит на /login

Given два разных пользователя зарегистрированы
When пользователь А делает прямой запрос к profiles пользователя Б (не через UI, вручную к Supabase)
Then получает пустой результат — RLS блокирует чтение чужой строки
```

## 13. Ручная проверка перед тем, как считать шаг закрытым

- `pnpm dlx supabase db reset` проходит без ошибок, `profiles` создаётся с RLS.
- Регистрация нового пользователя → строка в `profiles` появляется автоматически (проверить в Studio локального Supabase, `pnpm dlx supabase status` даёт URL Studio).
- Прямой SQL-запрос к `profiles` от имени `anon`/чужого `authenticated`-пользователя (через Studio SQL editor с `set role`) не возвращает чужие строки.
- `/dashboard` недоступен без сессии, доступен после логина.
- `.env.local` в `.gitignore`, `service_role` key нигде не встречается в клиентском бандле (проверить `pnpm build` + grep по `.next/static`).
