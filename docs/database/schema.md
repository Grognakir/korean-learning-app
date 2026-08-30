# Схема базы данных

Справочник по всем таблицам приложения и связям между ними. Источник истины — миграции в `supabase/migrations/`; этот файл описывает их состояние на момент написания, при расхождении верить миграциям.

Таблицы сгруппированы по разделам приложения:
- **Auth** — `profiles` (стандартная `auth.users` от Supabase не описывается здесь).
- **Обучение** — `learning_plans`, `textbooks`, `textbook_pages`, `lessons`.
- **Словарь** — `words`, `categories`, `word_categories`, `translations`, `word_examples`, `word_notes`, `word_forms`, `phrases`.

## Общие принципы

- Все таблицы — `public` схема, PK — `uuid` с `default gen_random_uuid()` (кроме `profiles`, где PK = `auth.users.id`).
- RLS включён на каждой таблице. Помимо RLS-политик везде добавлены явные `GRANT` для `anon`/`authenticated`/`service_role` — начиная с используемой версии Supabase CLI, одних RLS-политик недостаточно для доступа через Data API (`auto_expose_new_tables` выключен по умолчанию).
- Импортируемый (не пользовательский) контент везде пишется через `service_role`-скрипты (`scripts/import-*.ts`) с идемпотентным upsert по natural key — либо явному `external_id`, либо составному unique-индексу.

---

## Auth

### `profiles`

| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | = `auth.users.id`, `on delete cascade` |
| `username` | `text not null` | |
| `font_latin` | `text` | пользовательская настройка шрифта |
| `font_kr` | `text` | пользовательская настройка шрифта |
| `created_at` | `timestamptz` | |

Создаётся автоматически триггером `on_auth_user_created` (`handle_new_user()`, `security definer`) при регистрации — прямого `INSERT` с клиента нет. RLS: `SELECT`/`UPDATE` только своей строки (`auth.uid() = id`).

---

## Обучение

### `learning_plans`
| Поле | Тип |
|---|---|
| `id` | `uuid PK` |
| `slug` | `text not null unique` |
| `title` | `text not null` |
| `created_at` | `timestamptz` |

### `textbooks`
| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `plan_id` | `uuid → learning_plans.id, cascade` | |
| `slug` | `text not null unique` | |
| `level` | `int not null` | |
| `title` | `text not null` | |
| `created_at` | | |

### `textbook_pages`
| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `textbook_id` | `uuid → textbooks.id, cascade` | |
| `page_index` | `int not null` | сквозной 0-based порядок страниц — идемпотентный ключ импорта (`unique (textbook_id, page_index)`) |
| `page_number` | `int, nullable` | номер страницы в физической книге; `NULL` у оглавления/титула |
| `lesson_number` | `int, nullable` | |
| `content` | `jsonb not null` | `{page_role, source_photo, blocks: [...]}` — блоки контента урока |
| `created_at` | | |

### `lessons`
| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `textbook_id` | `uuid → textbooks.id, cascade` | |
| `lesson_number` | `int not null` | |
| `title` | `text not null` | например «인사와 소개» |
| `created_at` | | `unique (textbook_id, lesson_number)` |

Медиа (иллюстрации/аудио) — не в БД, а в приватном Storage-бакете `textbook-assets` (`public: false`), раздаётся подписанными URL через `src/lib/supabase/admin.ts` после проверки сессии.

**RLS** (все 4 таблицы): `SELECT` только `authenticated` (в отличие от словаря, раздел «Обучение» не открыт гостю). `INSERT`/`UPDATE` — только `service_role` (импорт-скрипт `scripts/import-textbook.ts`), у обычных пользователей нет политик на запись вовсе.

---

## Словарь

### `words` — ядро, одна строка = одно слово
| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `owner_user_id` | `uuid → auth.users, nullable` | `NULL` = глобальное (импортированное) слово, иначе — приватное слово пользователя |
| `external_id` | `text unique, nullable` | ключ идемпотентного импорта (`word-{kr}[-n]`); у слов, добавленных через UI, `NULL` |
| `headword` | `text not null` | заголовочная форма на корейском |
| `reading` | `text` | транслитерация |
| `part_of_speech` | `text` | тег части речи (`noun`/`verb`/`adjective`/...) |
| `level_tag` | `text` | зарезервировано под уровень сложности, пока не заполняется |
| `created_at`, `updated_at` | `timestamptz` | |

### `categories` — общий справочник тем/групп
| Поле | Тип |
|---|---|
| `id` | `uuid PK` |
| `name` | `text not null unique` |
| `created_at` | |

### `word_categories` — M2M `words` ↔ `categories`
| Поле | Тип |
|---|---|
| `word_id` | `uuid → words.id, cascade` |
| `category_id` | `uuid → categories.id, cascade` |
| `PRIMARY KEY (word_id, category_id)` | |

### `translations` — 1-ко-многим, переводы слова
| Поле | Тип |
|---|---|
| `id` | `uuid PK` |
| `word_id` | `uuid → words.id, cascade` |
| `external_id` | `text unique, nullable` |
| `text` | `text not null` |
| `created_at` | |

### `word_examples` — 1-ко-многим, примеры употребления
| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `word_id` | `uuid → words.id, cascade` | |
| `external_id` | `text unique, nullable` | |
| `kr` | `text not null` | пример на корейском |
| `ru` | `text not null` | перевод примера |
| `created_at` | | |

### `word_notes` — 1-ко-многим, свободные примечания
| Поле | Тип |
|---|---|
| `id` | `uuid PK` |
| `word_id` | `uuid → words.id, cascade` |
| `external_id` | `text unique, nullable` |
| `text` | `text not null` |
| `created_at` | |

### `word_forms` — гибкая таблица: формы словоизменения **и** связи (антоним/синоним) в одной структуре
| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `word_id` | `uuid → words.id, cascade` | |
| `external_id` | `text unique, nullable` | |
| `label` | `text, nullable` | `"вежливая (해요체)"` и т.п. для форм; `"антоним"`/`"синоним"` для связей — различаются только этим полем |
| `value` | `text not null` | для форм — сама форма (`"걸어요"`); для связей — целевое слово + перевод в скобках (`"켜다 (включать)"`), обычный текст, без FK на `words` |
| `created_at` | | |

### `phrases` — заготовка впрок, без контента и UI на данный момент
| Поле | Тип |
|---|---|
| `id` | `uuid PK` |
| `owner_user_id` | `uuid → auth.users, nullable` |
| `external_id` | `text unique, nullable` |
| `phrase_kr` | `text not null` |
| `translation` | `text not null` |
| `usage_note` | `text` |
| `created_at` | |

Все дочерние таблицы слова ссылаются только на `words.id` с `ON DELETE CASCADE` — удаление слова удаляет весь связанный контент. Связь антонима/синонима в `word_forms` — не FK, а текст (нет кликабельного перехода к связанному слову).

**RLS**:
- `words`: `SELECT` — `anon`+`authenticated`, видно `owner_user_id IS NULL OR owner_user_id = auth.uid()` (единственный раздел, открытый гостю). `INSERT`/`UPDATE` — `authenticated`, только в свои строки.
- `categories`: `SELECT` открыт всем; `INSERT` — любой `authenticated` (может завести новую категорию); `UPDATE`/`DELETE` — политик нет.
- `word_categories`/`translations`/`word_examples`/`word_notes`/`word_forms`: своего `owner_user_id` нет — видимость и `INSERT` выведены через `EXISTS`-проверку родительского `words` (видно, если слово глобальное или своё; писать можно только в дочерние строки своего слова).
- `phrases`: только `SELECT`, той же формы, что `words`; политик на запись нет ни у кого — появятся вместе с реальным импортом фраз.

---

## ER-диаграмма (полная)

```mermaid
erDiagram
    USERS ||--o{ PROFILES : "1:1"
    USERS ||--o{ WORDS : "owns (nullable)"
    USERS ||--o{ PHRASES : "owns (nullable)"

    LEARNING_PLANS ||--o{ TEXTBOOKS : has
    TEXTBOOKS ||--o{ TEXTBOOK_PAGES : has
    TEXTBOOKS ||--o{ LESSONS : has

    WORDS ||--o{ WORD_CATEGORIES : has
    CATEGORIES ||--o{ WORD_CATEGORIES : has
    WORDS ||--o{ TRANSLATIONS : has
    WORDS ||--o{ WORD_EXAMPLES : has
    WORDS ||--o{ WORD_NOTES : has
    WORDS ||--o{ WORD_FORMS : has

    PROFILES {
        uuid id PK_FK
        text username
    }

    LEARNING_PLANS {
        uuid id PK
        text slug UK
        text title
    }

    TEXTBOOKS {
        uuid id PK
        uuid plan_id FK
        text slug UK
        int level
        text title
    }

    TEXTBOOK_PAGES {
        uuid id PK
        uuid textbook_id FK
        int page_index
        int page_number
        int lesson_number
        jsonb content
    }

    LESSONS {
        uuid id PK
        uuid textbook_id FK
        int lesson_number
        text title
    }

    WORDS {
        uuid id PK
        uuid owner_user_id FK
        text external_id UK
        text headword
        text reading
        text part_of_speech
        text level_tag
    }

    CATEGORIES {
        uuid id PK
        text name UK
    }

    WORD_CATEGORIES {
        uuid word_id PK_FK
        uuid category_id PK_FK
    }

    TRANSLATIONS {
        uuid id PK
        uuid word_id FK
        text external_id UK
        text text
    }

    WORD_EXAMPLES {
        uuid id PK
        uuid word_id FK
        text external_id UK
        text kr
        text ru
    }

    WORD_NOTES {
        uuid id PK
        uuid word_id FK
        text external_id UK
        text text
    }

    WORD_FORMS {
        uuid id PK
        uuid word_id FK
        text external_id UK
        text label
        text value
    }

    PHRASES {
        uuid id PK
        uuid owner_user_id FK
        text external_id UK
        text phrase_kr
        text translation
        text usage_note
    }
```

У `learning_plans`/`textbooks`/`textbook_pages`/`lessons` нет прямой связи с пользователем — доступ к ним регулируется не через FK на `auth.users`, а через RLS-политику «виден любому `authenticated`».

Медиа-хранилище (Storage bucket `textbook-assets`) на диаграмме не показано — это не таблица `public`-схемы, а приватный bucket, связанный с уроками только по пути файла (`storage_path` внутри `textbook_pages.content` JSON), без FK.
