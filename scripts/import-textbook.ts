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
const LESSON_DIR_1_2 = join(REFERENCE_DIR, "inha_book_content/1급_lesson_02");
const LESSON_DIR_1_3 = join(REFERENCE_DIR, "inha_book_content/1급_lesson_03");
const LESSON_DIR_1_4 = join(REFERENCE_DIR, "inha_book_content/1급_lesson_04");
const LESSON_DIR_1_5 = join(REFERENCE_DIR, "inha_book_content/1급_lesson_05");
const LESSON_DIR_1_6 = join(REFERENCE_DIR, "inha_book_content/1급_lesson_06");
const LESSON_DIR_2 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_01");
const LESSON_DIR_2_2 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_02");
const LESSON_DIR_2_3 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_03");
const LESSON_DIR_2_4 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_04");
const LESSON_DIR_2_5 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_05");
const LESSON_DIR_2_6 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_06");
const LESSON_DIR_2_7 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_07");
const LESSON_DIR_2_8 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_08");
const LESSON_DIR_2_9 = join(REFERENCE_DIR, "inha_book_content/2급_lesson_09");

const LATE_LESSONS_2: Record<number, { path: string; audio: number[]; images: string[] }> = {
  7: {
    path: join(LESSON_DIR_2_7, "lesson-07.json"),
    audio: [225, 226, 227, 228],
    images: [
      "illustration_1_online_shopping.png",
      "illustration_2_shoe_exchange.png",
      "illustration_3_parcel_delivery.png",
      "illustration_4_dining_table_review.png",
      "illustration_5_korean_days.png",
    ],
  },
  8: {
    path: join(LESSON_DIR_2_8, "lesson-08.json"),
    audio: [229, 230, 231, 232],
    images: [
      "illustration_1_leisure_taekwondo.png",
      "illustration_2_taekwondo_club.png",
      "illustration_3_samulnori_club.png",
      "illustration_4_kpop_dance_club_v2.png",
      "illustration_5_weekend_hiking.png",
    ],
  },
  9: {
    path: join(LESSON_DIR_2_9, "lesson-09.json"),
    audio: [233, 234, 235, 236],
    images: [
      "illustration_1_dental_appointment.png",
      "illustration_2_allergy_clinic.png",
      "illustration_3_pharmacy.png",
      "illustration_4_healthy_habits.png",
      "illustration_5_donguibogam.png",
    ],
  },
};

// 1급 (새인하한국어1): урок N → путь к JSON и аудиотреки (101…164 идут по 4 на урок).
const LEVEL1_LESSONS: Record<number, { path: string; audio: number[]; images: string[] }> = {
  1: { path: join(LESSON_DIR, "lesson-01.json"), audio: [101, 102, 103, 104], images: [] },
  2: {
    path: join(LESSON_DIR_1_2, "lesson-02.json"),
    audio: [105, 106, 107, 108],
    images: ["illustration_1_house_map.png"],
  },
  3: { path: join(LESSON_DIR_1_3, "lesson-03.json"), audio: [109, 110, 111, 112], images: [] },
  4: { path: join(LESSON_DIR_1_4, "lesson-04.json"), audio: [113, 114, 115, 116], images: [] },
  5: { path: join(LESSON_DIR_1_5, "lesson-05.json"), audio: [117, 118, 119, 120], images: [] },
  6: { path: join(LESSON_DIR_1_6, "lesson-06.json"), audio: [121, 122, 123, 124], images: [] },
};

async function uploadLevel1Images(lessonNumber: number) {
  for (const filename of LEVEL1_LESSONS[lessonNumber].images) {
    await uploadAsset(
      join(LEVEL1_LESSONS[lessonNumber].path, "..", `img/${filename}`),
      `inha_book_1/lesson_${lessonNumber}/${filename}`,
      "image/png",
    );
  }
}

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

const LESSON_3_ILLUSTRATIONS = [
  "illustration_1_historical_drama.png",
  "illustration_2_university_counseling_v2.png",
  "illustration_3_future_careers.png",
  "illustration_4_racing_dream.png",
  "illustration_5_university_volunteering.png",
];

const LESSON_4_ILLUSTRATIONS = [
  "illustration_1_dusty_weather.png",
  "illustration_2_weather_forecast.png",
  "illustration_3_typhoon_wind.png",
  "illustration_4_four_seasons.png",
  "illustration_5_rainy_day_food.png",
];

const LESSON_5_ILLUSTRATIONS = [
  "illustration_1_surprise_birthday.png",
  "illustration_2_visit_etiquette.png",
  "illustration_3_housewarming_gifts.png",
  "illustration_4_alumni_invitation.png",
  "illustration_5_korean_celebrations.png",
];

const LESSON_6_ILLUSTRATIONS = [
  "illustration_1_bibimbap_recipe.png",
  "illustration_2_food_delivery.png",
  "illustration_3_birthday_food.png",
  "illustration_4_samgyetang.png",
  "illustration_5_holiday_food.png",
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

async function uploadLesson2Audio(tracks: number[]) {
  for (const track of tracks) {
    await uploadAsset(
      join(REFERENCE_DIR, `inha_book_audio/2급_주교재/${track}.mp3`),
      `inha_book_2/audio/${track}.mp3`,
      "audio/mpeg",
    );
  }
}

async function uploadLevel1Audio(tracks: number[]) {
  for (const track of tracks) {
    await uploadAsset(
      join(REFERENCE_DIR, `inha_book_audio/1급_주교재/${track}.mp3`),
      `inha_book_1/audio/${track}.mp3`,
      "audio/mpeg",
    );
  }
}

async function main() {
  for (const lessonNumber of Object.keys(LEVEL1_LESSONS).map(Number)) {
    if (!process.argv.includes(`--k1-lesson-${lessonNumber}-only`)) continue;

    const { data: textbook1, error: textbookError } = await supabase
      .from("textbooks")
      .select("id")
      .eq("slug", TEXTBOOK.slug)
      .single();
    if (textbookError) throw textbookError;

    // page_index сквозной: считаем страницы всех предыдущих уроков 1급.
    let startIndex = 0;
    for (let n = 1; n < lessonNumber; n++) {
      const previous: LessonFile = JSON.parse(readFileSync(LEVEL1_LESSONS[n].path, "utf-8"));
      startIndex += previous.pages.length;
    }
    await importLesson(textbook1.id, LEVEL1_LESSONS[lessonNumber].path, startIndex);
    await uploadLevel1Audio(LEVEL1_LESSONS[lessonNumber].audio);
    await uploadLevel1Images(lessonNumber);
    console.log("Готово.");
    return;
  }

  for (const lessonNumber of [7, 8, 9]) {
    if (!process.argv.includes(`--lesson-${lessonNumber}-only`)) continue;

    const { data: textbook2, error: textbookError } = await supabase
      .from("textbooks")
      .select("id")
      .eq("slug", TEXTBOOK_2.slug)
      .single();
    if (textbookError) throw textbookError;

    // page_index сквозной: считаем страницы всех предыдущих уроков 2급.
    const previous: LessonFile[] = [
      LESSON_DIR_2, LESSON_DIR_2_2, LESSON_DIR_2_3, LESSON_DIR_2_4,
      LESSON_DIR_2_5, LESSON_DIR_2_6,
    ].map((dir, index) =>
      JSON.parse(readFileSync(join(dir, `lesson-0${index + 1}.json`), "utf-8")),
    );
    for (let n = 7; n < lessonNumber; n++) {
      previous.push(JSON.parse(readFileSync(LATE_LESSONS_2[n].path, "utf-8")));
    }
    const startIndex = previous.reduce((total, lesson) => total + lesson.pages.length, 0);

    await importLesson(textbook2.id, LATE_LESSONS_2[lessonNumber].path, startIndex);
    for (const filename of LATE_LESSONS_2[lessonNumber].images) {
      await uploadAsset(
        join(LATE_LESSONS_2[lessonNumber].path, "..", `img/${filename}`),
        `inha_book_2/lesson_${lessonNumber}/${filename}`,
        "image/png",
      );
    }
    await uploadLesson2Audio(LATE_LESSONS_2[lessonNumber].audio);
    console.log("Готово.");
    return;
  }
  if (process.argv.includes("--lesson-6-only")) {
    const { data: textbook2, error: textbookError } = await supabase
      .from("textbooks")
      .select("id")
      .eq("slug", TEXTBOOK_2.slug)
      .single();
    if (textbookError) throw textbookError;

    const lesson1: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2, "lesson-01.json"), "utf-8"),
    );
    const lesson2: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_2, "lesson-02.json"), "utf-8"),
    );
    const lesson3: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_3, "lesson-03.json"), "utf-8"),
    );
    const lesson4: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_4, "lesson-04.json"), "utf-8"),
    );
    const lesson5: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_5, "lesson-05.json"), "utf-8"),
    );
    const lesson6StartIndex =
      lesson1.pages.length +
      lesson2.pages.length +
      lesson3.pages.length +
      lesson4.pages.length +
      lesson5.pages.length;

    await importLesson(
      textbook2.id,
      join(LESSON_DIR_2_6, "lesson-06.json"),
      lesson6StartIndex,
    );
    for (const filename of LESSON_6_ILLUSTRATIONS) {
      await uploadAsset(
        join(LESSON_DIR_2_6, `img/${filename}`),
        `inha_book_2/lesson_6/${filename}`,
        "image/png",
      );
    }
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/221.mp3"),
      "inha_book_2/audio/221.mp3",
      "audio/mpeg",
    );
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/222.mp3"),
      "inha_book_2/audio/222.mp3",
      "audio/mpeg",
    );
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/223.mp3"),
      "inha_book_2/audio/223.mp3",
      "audio/mpeg",
    );
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/224.mp3"),
      "inha_book_2/audio/224.mp3",
      "audio/mpeg",
    );
    console.log("Готово.");
    return;
  }

  if (process.argv.includes("--lesson-5-only")) {
    const { data: textbook2, error: textbookError } = await supabase
      .from("textbooks")
      .select("id")
      .eq("slug", TEXTBOOK_2.slug)
      .single();
    if (textbookError) throw textbookError;

    const lesson1: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2, "lesson-01.json"), "utf-8"),
    );
    const lesson2: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_2, "lesson-02.json"), "utf-8"),
    );
    const lesson3: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_3, "lesson-03.json"), "utf-8"),
    );
    const lesson4: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_4, "lesson-04.json"), "utf-8"),
    );
    const lesson5StartIndex =
      lesson1.pages.length +
      lesson2.pages.length +
      lesson3.pages.length +
      lesson4.pages.length;

    await importLesson(
      textbook2.id,
      join(LESSON_DIR_2_5, "lesson-05.json"),
      lesson5StartIndex,
    );
    for (const filename of LESSON_5_ILLUSTRATIONS) {
      await uploadAsset(
        join(LESSON_DIR_2_5, `img/${filename}`),
        `inha_book_2/lesson_5/${filename}`,
        "image/png",
      );
    }
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/217.mp3"),
      "inha_book_2/audio/217.mp3",
      "audio/mpeg",
    );
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/218.mp3"),
      "inha_book_2/audio/218.mp3",
      "audio/mpeg",
    );
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/219.mp3"),
      "inha_book_2/audio/219.mp3",
      "audio/mpeg",
    );
    await uploadAsset(
      join(REFERENCE_DIR, "inha_book_audio/2급_주교재/220.mp3"),
      "inha_book_2/audio/220.mp3",
      "audio/mpeg",
    );
    console.log("Готово.");
    return;
  }

  if (process.argv.includes("--lesson-4-only")) {
    const { data: textbook2, error: textbookError } = await supabase
      .from("textbooks")
      .select("id")
      .eq("slug", TEXTBOOK_2.slug)
      .single();
    if (textbookError) throw textbookError;

    const lesson1: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2, "lesson-01.json"), "utf-8"),
    );
    const lesson2: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_2, "lesson-02.json"), "utf-8"),
    );
    const lesson3: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_3, "lesson-03.json"), "utf-8"),
    );
    const lesson4StartIndex =
      lesson1.pages.length + lesson2.pages.length + lesson3.pages.length;

    await importLesson(
      textbook2.id,
      join(LESSON_DIR_2_4, "lesson-04.json"),
      lesson4StartIndex,
    );
    for (const filename of LESSON_4_ILLUSTRATIONS) {
      await uploadAsset(
        join(LESSON_DIR_2_4, `img/${filename}`),
        `inha_book_2/lesson_4/${filename}`,
        "image/png",
      );
    }
    console.log("Готово.");
    return;
  }

  if (process.argv.includes("--lesson-3-only")) {
    const { data: textbook2, error: textbookError } = await supabase
      .from("textbooks")
      .select("id")
      .eq("slug", TEXTBOOK_2.slug)
      .single();
    if (textbookError) throw textbookError;

    const lesson1: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2, "lesson-01.json"), "utf-8"),
    );
    const lesson2: LessonFile = JSON.parse(
      readFileSync(join(LESSON_DIR_2_2, "lesson-02.json"), "utf-8"),
    );
    const lesson3StartIndex = lesson1.pages.length + lesson2.pages.length;

    await importLesson(
      textbook2.id,
      join(LESSON_DIR_2_3, "lesson-03.json"),
      lesson3StartIndex,
    );
    for (const filename of LESSON_3_ILLUSTRATIONS) {
      await uploadAsset(
        join(LESSON_DIR_2_3, `img/${filename}`),
        `inha_book_2/lesson_3/${filename}`,
        "image/png",
      );
    }
    console.log("Готово.");
    return;
  }

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
      ...LESSON_3_ILLUSTRATIONS.map((filename) => ({
        localPath: join(LESSON_DIR_2_3, `img/${filename}`),
        storagePath: `inha_book_2/lesson_3/${filename}`,
      })),
      ...LESSON_4_ILLUSTRATIONS.map((filename) => ({
        localPath: join(LESSON_DIR_2_4, `img/${filename}`),
        storagePath: `inha_book_2/lesson_4/${filename}`,
      })),
      ...LESSON_5_ILLUSTRATIONS.map((filename) => ({
        localPath: join(LESSON_DIR_2_5, `img/${filename}`),
        storagePath: `inha_book_2/lesson_5/${filename}`,
      })),
      ...LESSON_6_ILLUSTRATIONS.map((filename) => ({
        localPath: join(LESSON_DIR_2_6, `img/${filename}`),
        storagePath: `inha_book_2/lesson_6/${filename}`,
      })),
      ...Object.entries(LATE_LESSONS_2).flatMap(([lessonNumber, lesson]) =>
        lesson.images.map((filename) => ({
          localPath: join(lesson.path, "..", `img/${filename}`),
          storagePath: `inha_book_2/lesson_${lessonNumber}/${filename}`,
        })),
      ),
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

  let textbook1NextIndex = 0;
  for (const lessonNumber of Object.keys(LEVEL1_LESSONS).map(Number)) {
    textbook1NextIndex = await importLesson(
      textbook.id,
      LEVEL1_LESSONS[lessonNumber].path,
      textbook1NextIndex,
    );
  }
  const textbook2Lesson1NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2, "lesson-01.json"),
    0,
  );
  const textbook2Lesson2NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2_2, "lesson-02.json"),
    textbook2Lesson1NextIndex,
  );
  const textbook2Lesson3NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2_3, "lesson-03.json"),
    textbook2Lesson2NextIndex,
  );
  const textbook2Lesson4NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2_4, "lesson-04.json"),
    textbook2Lesson3NextIndex,
  );
  const textbook2Lesson5NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2_5, "lesson-05.json"),
    textbook2Lesson4NextIndex,
  );
  const textbook2Lesson6NextIndex = await importLesson(
    textbook2.id,
    join(LESSON_DIR_2_6, "lesson-06.json"),
    textbook2Lesson5NextIndex,
  );
  const textbook2Lesson7NextIndex = await importLesson(
    textbook2.id,
    LATE_LESSONS_2[7].path,
    textbook2Lesson6NextIndex,
  );
  const textbook2Lesson8NextIndex = await importLesson(
    textbook2.id,
    LATE_LESSONS_2[8].path,
    textbook2Lesson7NextIndex,
  );
  await importLesson(textbook2.id, LATE_LESSONS_2[9].path, textbook2Lesson8NextIndex);

  // Ассеты: только то, что реально используется этим уроком, не всё
  // содержимое справочных папок разом.
  await uploadAsset(
    join(LESSON_DIR, "img/illustration_0_handshake.png"),
    "inha_book_1/illustration_0_handshake.png",
    "image/png",
  );
  await uploadLevel1Audio(Object.values(LEVEL1_LESSONS).flatMap((lesson) => lesson.audio));
  for (const lessonNumber of Object.keys(LEVEL1_LESSONS).map(Number)) {
    await uploadLevel1Images(lessonNumber);
  }

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

  // 2급 3과: иллюстрации к разделам из учебника и аудио к обоим диалогам
  // 준비하기 (209, 210), 듣고 말하기 (211) и 발음 (212).
  for (const filename of LESSON_3_ILLUSTRATIONS) {
    await uploadAsset(
      join(LESSON_DIR_2_3, `img/${filename}`),
      `inha_book_2/lesson_3/${filename}`,
      "image/png",
    );
  }

  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/209.mp3"),
    "inha_book_2/audio/209.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/210.mp3"),
    "inha_book_2/audio/210.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/211.mp3"),
    "inha_book_2/audio/211.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/212.mp3"),
    "inha_book_2/audio/212.mp3",
    "audio/mpeg",
  );

  // 2급 4과: иллюстрации к разделам и аудио к обоим диалогам 준비하기
  // (213, 214), 듣고 말하기 (215) и 발음 (216).
  for (const filename of LESSON_4_ILLUSTRATIONS) {
    await uploadAsset(
      join(LESSON_DIR_2_4, `img/${filename}`),
      `inha_book_2/lesson_4/${filename}`,
      "image/png",
    );
  }

  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/213.mp3"),
    "inha_book_2/audio/213.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/214.mp3"),
    "inha_book_2/audio/214.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/215.mp3"),
    "inha_book_2/audio/215.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/216.mp3"),
    "inha_book_2/audio/216.mp3",
    "audio/mpeg",
  );

  // 2급 5과: иллюстрации к разделам и аудио к обоим диалогам 준비하기
  // (217, 218), 듣고 말하기 (219) и 발음 (220).
  for (const filename of LESSON_5_ILLUSTRATIONS) {
    await uploadAsset(
      join(LESSON_DIR_2_5, `img/${filename}`),
      `inha_book_2/lesson_5/${filename}`,
      "image/png",
    );
  }

  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/217.mp3"),
    "inha_book_2/audio/217.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/218.mp3"),
    "inha_book_2/audio/218.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/219.mp3"),
    "inha_book_2/audio/219.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/220.mp3"),
    "inha_book_2/audio/220.mp3",
    "audio/mpeg",
  );

  // 2급 6과: иллюстрации к разделам и аудио к обоим диалогам 준비하기
  // (221, 222), 듣고 말하기 (223) и 발음 (224).
  for (const filename of LESSON_6_ILLUSTRATIONS) {
    await uploadAsset(
      join(LESSON_DIR_2_6, `img/${filename}`),
      `inha_book_2/lesson_6/${filename}`,
      "image/png",
    );
  }

  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/221.mp3"),
    "inha_book_2/audio/221.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/222.mp3"),
    "inha_book_2/audio/222.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/223.mp3"),
    "inha_book_2/audio/223.mp3",
    "audio/mpeg",
  );
  await uploadAsset(
    join(REFERENCE_DIR, "inha_book_audio/2급_주교재/224.mp3"),
    "inha_book_2/audio/224.mp3",
    "audio/mpeg",
  );

  for (const [lessonNumber, lesson] of Object.entries(LATE_LESSONS_2)) {
    for (const filename of lesson.images) {
      await uploadAsset(
        join(lesson.path, "..", `img/${filename}`),
        `inha_book_2/lesson_${lessonNumber}/${filename}`,
        "image/png",
      );
    }
  }
  await uploadLesson2Audio([
    ...LATE_LESSONS_2[7].audio,
    ...LATE_LESSONS_2[8].audio,
    ...LATE_LESSONS_2[9].audio,
  ]);

  console.log("Готово.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
