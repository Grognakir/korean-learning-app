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
const LESSON_DIR_2_2 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_02");

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

// page_index — сквозной порядок страниц В ПРЕДЕЛАХ ВСЕГО УЧЕБНИКА (см.
// комментарий у unique(textbook_id, page_index) в миграции), не в
// пределах одного урока. Раньше на каждый textbook_id приходился только
// один импортированный урок, поэтому "начать с 0" совпадало со сквозным
// индексом; со вторым уроком того же учебника это стало ломать первый —
// upsert по (textbook_id, page_index) тихо перезаписывал чужие страницы.
// startIndex — с какого сквозного индекса продолжать; возвращает индекс
// сразу после последней страницы этого урока, чтобы следующий importLesson
// мог просто передать его дальше.
async function importLesson(
  textbookId: string,
  lessonPath: string,
  startIndex: number,
): Promise<number> {
  const lesson: LessonFile = JSON.parse(readFileSync(lessonPath, "utf-8"));

  console.log(
    `Импорт "${lesson.title}" (урок ${lesson.lesson_number}): ${lesson.pages.length} страниц, page_index ${startIndex}..${startIndex + lesson.pages.length - 1}`,
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

  for (let i = 0; i < lesson.pages.length; i++) {
    const page = lesson.pages[i];
    const { error } = await supabase.from("textbook_pages").upsert(
      {
        textbook_id: textbookId,
        page_index: startIndex + i,
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
  return startIndex + lesson.pages.length;
}

async function main() {
  if (process.argv.includes("--generated-images-only")) {
    const generatedImages = [
      {
        localPath: join(LESSON_DIR, "img/illustration_0_handshake.png"),
        storagePath: "inha_book_1/illustration_0_handshake.png",
      },
      ...GREETING_GALLERY_CODES.map((code) => ({
        localPath: join(LESSON_DIR, `img/${code}.png`),
        storagePath: `inha_book_1/lesson_1/${code}.png`,
      })),
      {
        localPath: join(LESSON_DIR_2, "img/illustration_2_classroom_intro.png"),
        storagePath: "inha_book_2/illustration_2_classroom_intro.png",
      },
      ...[
        "illustration_1_student_questions.png",
        "illustration_2_house_search.png",
        "illustration_3_doenjang_jjigae.png",
        "illustration_4_student_housing.png",
      ].map((filename) => ({
        localPath: join(LESSON_DIR_2_2, `img/${filename}`),
        storagePath: `inha_book_2/lesson_2/${filename}`,
      })),
    ];

    for (const image of generatedImages) {
      await uploadAsset(image.localPath, image.storagePath, "image/png");
    }
    console.log("Готово.");
    return;
  }

  if (process.argv.includes("--asset=inha-2-lesson-1-prep-2")) {
    await uploadAsset(
      join(LESSON_DIR_2, "img/illustration_2_classroom_intro.png"),
      "inha_book_2/illustration_2_classroom_intro.png",
      "image/png",
    );
    console.log("Готово.");
    return;
  }

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

  await importLesson(textbook.id, join(LESSON_DIR, "lesson-01.json"), 0);
  const textbook2NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2, "lesson-01.json"),
    0,
  );
  await importLesson(
    textbook2.id,
    join(LESSON_DIR_2_2, "lesson-02.json"),
    textbook2NextIndex,
  );

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
  // 2급 1과: аудио к 듣고 말하기 (203) и 발음 (204).
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/203.mp3"),
    "inha_book_2/audio/203.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/204.mp3"),
    "inha_book_2/audio/204.mp3",
    "audio/mpeg",
  );

  // 2급 2과: иллюстрации к разделам, в которых они есть в учебнике,
  // и аудио к обоим диалогам 준비하기.
  const lesson2Illustrations = [
    "illustration_1_student_questions.png",
    "illustration_2_house_search.png",
    "illustration_3_doenjang_jjigae.png",
    "illustration_4_student_housing.png",
  ];

  for (const filename of lesson2Illustrations) {
    await uploadAsset(
      join(LESSON_DIR_2_2, `img/${filename}`),
      `inha_book_2/lesson_2/${filename}`,
      "image/png",
    );
  }

  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/205.mp3"),
    "inha_book_2/audio/205.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/206.mp3"),
    "inha_book_2/audio/206.mp3",
    "audio/mpeg",
  );
  // 2급 2과: аудио к 듣고 말하기 (207) и 발음 (208).
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/207.mp3"),
    "inha_book_2/audio/207.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/208.mp3"),
    "inha_book_2/audio/208.mp3",
    "audio/mpeg",
  );

  console.log("Готово.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
