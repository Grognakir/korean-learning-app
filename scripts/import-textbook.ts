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

const REFERENCE_DIR = join(process.cwd(), "content/reference");
const LESSON_DIR = join(REFERENCE_DIR, "inha_book_content/1급_lesson_01");
const LESSON_DIR_2 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_01");

const PLAN = { slug: "inha", title: "인하대학교" };
const TEXTBOOK = { slug: "inha-1", level: 1, title: "새인하한국어1" };
const TEXTBOOK_2 = { slug: "inha-2", level: 2, title: "새인하한국어2" };

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

async function importLesson(textbookId: string, lessonPath: string) {
  const lesson: LessonFile = JSON.parse(readFileSync(lessonPath, "utf-8"));

  console.log(
    `Импорт "${lesson.title}" (урок ${lesson.lesson_number}): ${lesson.pages.length} страниц`,
  );

  const { error: lessonError } = await supabase.from("lessons").upsert(
    {
      textbook_id: textbookId,
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
        textbook_id: textbookId,
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

  const { data: textbook2, error: textbook2Error } = await supabase
    .from("textbooks")
    .upsert({ ...TEXTBOOK_2, plan_id: plan.id }, { onConflict: "slug" })
    .select()
    .single();
  if (textbook2Error) throw textbook2Error;

  await importLesson(textbook.id, join(LESSON_DIR, "lesson-01.json"));
  await importLesson(textbook2.id, join(LESSON_DIR_2, "lesson-01.json"));

  // Ассеты: только то, что реально используется этим уроком, не всё
  // содержимое справочных папок разом.
  await uploadAsset(
    join(LESSON_DIR, "img/illustration_0_handshake.png"),
    "inha_book_1/illustration_0_handshake.png",
    "image/png",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/1급_주교재/101.mp3"),
    "inha_book_1/audio/101.mp3",
    "audio/mpeg",
  );

  // Флаги для таблицы "나라 이름" (준비하기 1) — уменьшенные копии
  // (макс. сторона 200px) в img/flags/, оригиналы в исходном
  // разрешении, загруженные пользователем, лежат рядом как *_flag.png.
  for (const code of FLAG_CODES) {
    await uploadAsset(
      join(LESSON_DIR, `img/flags/${code}.png`),
      `inha_book_1/flags/${code}.png`,
      "image/png",
    );
  }

  // Иллюстрации галереи приветственных фраз (준비하기 1) — уменьшенные
  // копии (макс. сторона 600px) в img/.
  for (const code of GREETING_GALLERY_CODES) {
    await uploadAsset(
      join(LESSON_DIR, `img/${code}.png`),
      `inha_book_1/lesson_1/${code}.png`,
      "image/png",
    );
  }

  // 2급 1과: иллюстрации к обоим диалогам (сгенерированный пиксель-арт,
  // не фото) и аудио к ним.
  await uploadAsset(
    join(LESSON_DIR_2, "img/illustration_1_handshake.png"),
    "inha_book_2/illustration_1_handshake.png",
    "image/png",
  );
  await uploadAsset(
    join(LESSON_DIR_2, "img/illustration_2_classroom_intro.png"),
    "inha_book_2/illustration_2_classroom_intro.png",
    "image/png",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/201.mp3"),
    "inha_book_2/audio/201.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/202.mp3"),
    "inha_book_2/audio/202.mp3",
    "audio/mpeg",
  );

  console.log("Готово.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
