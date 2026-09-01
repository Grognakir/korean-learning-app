import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Отдельный клиент, не lib/supabase/admin.ts — тот файл помечен
// "server-only" и рассчитан на выполнение внутри Next.js (react-server
// условие резолва пакета), а не в самостоятельном tsx-скрипте.
process.loadEnvFile(join(process.cwd(), ".env.local"));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const CONTENT_DIR = join(process.cwd(), "docs/reference/inha_book_1_content");
const REFERENCE_DIR = join(process.cwd(), "docs/reference");

const PLAN = { slug: "inha", title: "인하대학교" };
const TEXTBOOK = { slug: "inha-1", level: 1, title: "새인하한국어1" };

// Порядок соответствует table-country-names.columns в lesson-01.json.
const FLAG_CODES = [
  "kr", "cn", "jp", "mn", "vn", "kh", "ph", "ru",
  "kz", "kg", "ke", "sa", "gb", "fr", "us", "ca",
];

// Порядок соответствует phrase-gallery-greetings.items в lesson-01.json.
const GREETING_GALLERY_CODES = [
  "greeting-1", "greeting-2", "greeting-3",
  "greeting-4", "greeting-5", "greeting-6",
];

type LessonPage = {
  page_number: number | null;
  page_role: string;
  source_photo: string;
  blocks: unknown[];
};

type LessonFile = {
  lesson_number: number;
  title: string;
  pages: LessonPage[];
};

async function uploadAsset(
  localPath: string,
  storagePath: string,
  contentType: string,
) {
  const data = readFileSync(localPath);
  const { error } = await supabase.storage
    .from("textbook-assets")
    .upload(storagePath, data, { contentType, upsert: true });
  if (error) throw error;
  console.log(`  storage: ${storagePath}`);
}

async function main() {
  const { data: plan, error: planError } = await supabase
    .from("learning_plans")
    .upsert(PLAN, { onConflict: "slug" })
    .select()
    .single();
  if (planError) throw planError;

  const { data: textbook, error: textbookError } = await supabase
    .from("textbooks")
    .upsert({ ...TEXTBOOK, plan_id: plan.id }, { onConflict: "slug" })
    .select()
    .single();
  if (textbookError) throw textbookError;

  const lessonPath = join(CONTENT_DIR, "lesson-01.json");
  const lesson: LessonFile = JSON.parse(readFileSync(lessonPath, "utf-8"));

  console.log(
    `Импорт "${lesson.title}" (урок ${lesson.lesson_number}): ${lesson.pages.length} страниц`,
  );

  const { error: lessonError } = await supabase.from("lessons").upsert(
    {
      textbook_id: textbook.id,
      lesson_number: lesson.lesson_number,
      title: lesson.title,
    },
    { onConflict: "textbook_id,lesson_number" },
  );
  if (lessonError) throw lessonError;

  for (let pageIndex = 0; pageIndex < lesson.pages.length; pageIndex++) {
    const page = lesson.pages[pageIndex];
    const { error } = await supabase.from("textbook_pages").upsert(
      {
        textbook_id: textbook.id,
        page_index: pageIndex,
        page_number: page.page_number,
        lesson_number: lesson.lesson_number,
        content: {
          page_role: page.page_role,
          source_photo: page.source_photo,
          blocks: page.blocks,
        },
      },
      { onConflict: "textbook_id,page_index" },
    );
    if (error) throw error;
  }
  console.log(`  textbook_pages: ${lesson.pages.length} строк`);

  // Ассеты: только то, что реально используется этим уроком, не всё
  // содержимое справочных папок разом.
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_1_book/image/illustration_0_handshake.png"),
    "inha_book_1/illustration_0_handshake.png",
    "image/png",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_1_audio/101.mp3"),
    "inha_book_1/audio/101.mp3",
    "audio/mpeg",
  );

  // Флаги для таблицы "나라 이름" (준비하기 1) — уменьшенные копии
  // (макс. сторона 200px) в image/flags/, оригиналы в исходном
  // разрешении, загруженные пользователем, лежат рядом как *_flag.png.
  for (const code of FLAG_CODES) {
    await uploadAsset(
      join(REFERENCE_DIR, `inha_book_1_book/image/flags/${code}.png`),
      `inha_book_1/flags/${code}.png`,
      "image/png",
    );
  }

  // Иллюстрации галереи приветственных фраз (준비하기 1) — уменьшенные
  // копии (макс. сторона 600px) в image/lesson_1_web/, оригиналы в
  // исходном разрешении, загруженные пользователем, лежат рядом в
  // image/lesson_1/ (корейские имена файлов, только для справки).
  for (const code of GREETING_GALLERY_CODES) {
    await uploadAsset(
      join(REFERENCE_DIR, `inha_book_1_book/image/lesson_1_web/${code}.png`),
      `inha_book_1/lesson_1/${code}.png`,
      "image/png",
    );
  }

  console.log("Готово.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
