import { BRIGHT, type ColorId, type PatternId } from "./colors";
import type { Slot } from "./items";

export type TargetId = "me" | "player" | "jia" | "friend" | "brother" | "mom" | "dad" | "grandma";

export type Target = {
  id: TargetId;
  ru: string;
  /** Тема фразы-итога: «저는», «아빠는»… */
  topic: string;
  /** Кому дарят: «할머니께». */
  dative?: string;
  male: boolean;
  elder: boolean;
  avatar: string;
};

export const TARGETS: Record<TargetId, Target> = {
  me: {
    id: "me",
    ru: "Я",
    topic: "저는",
    male: false,
    elder: false,
    avatar: "/images/lesson-sticker/jia-call/idle.png",
  },
  /** Игрок диалоговой игры (парень). */
  player: {
    id: "player",
    ru: "Я",
    topic: "저는",
    male: true,
    elder: false,
    avatar: "/images/dialogue/jia/idle.webp",
  },
  /** 지아 из диалоговой игры: игрок покупает одежду для неё. */
  jia: {
    id: "jia",
    ru: "지아",
    topic: "지아는",
    male: false,
    elder: false,
    avatar: "/images/lesson-sticker/jia-call/idle.png",
  },
  friend: {
    id: "friend",
    ru: "Друг",
    topic: "친구는",
    male: true,
    elder: false,
    avatar: "/images/clothing-game/prod/avatars/friend.png",
  },
  brother: {
    id: "brother",
    ru: "Младший брат",
    topic: "남동생은",
    male: true,
    elder: false,
    avatar: "/images/clothing-game/prod/avatars/brother.png",
  },
  mom: {
    id: "mom",
    ru: "Мама",
    topic: "엄마는",
    dative: "엄마께",
    male: false,
    elder: true,
    avatar: "/images/clothing-game/prod/avatars/mom.png",
  },
  dad: {
    id: "dad",
    ru: "Папа",
    topic: "아빠는",
    dative: "아빠께",
    male: true,
    elder: true,
    avatar: "/images/clothing-game/prod/avatars/dad.png",
  },
  grandma: {
    id: "grandma",
    ru: "Бабушка",
    topic: "할머니는",
    dative: "할머니께",
    male: false,
    elder: true,
    avatar: "/images/clothing-game/prod/avatars/grandma.png",
  },
};

export type Severity = "minor" | "forbidden";

type Selector = { items?: string[]; slots?: Slot[] };

export type ColorRule = Selector & {
  allowed?: ColorId[];
  banned?: ColorId[];
  severity?: Severity;
  ru: string;
};

export type PatternRule = Selector & {
  allowed: PatternId[];
  severity?: Severity;
  ru: string;
};

export type OutfitPiece = { id: string; color: ColorId; pattern: PatternId };

export type Situation = {
  id: string;
  target: TargetId;
  /** outfit — полный наряд (верх, низ, обувь); gift — одна вещь;
   * shopping — купить то, что просили (проверяются только правила). */
  kind: "outfit" | "gift" | "shopping";
  titleKo: string;
  ko: string;
  ru: string;
  /** Каждая группа — «нужна хотя бы одна из этих вещей». */
  required?: { anyOf: string[]; ru: string }[];
  /** Грубая ошибка: эмоция shock. */
  forbidden?: { items: string[]; ru: string }[];
  /** Неудачный, но не нелепый выбор: эмоция oops. */
  discouraged?: { items: string[]; ru: string }[];
  colors?: ColorRule[];
  patterns?: PatternRule[];
  success: string;
  /** Эталонный верный набор (тесты, подсказка). */
  example: OutfitPiece[];
};

const piece = (id: string, color: ColorId = "white", pattern: PatternId = "plain"): OutfitPiece => ({
  id,
  color,
  pattern,
});

const CASUAL_EXTREME = ["shorts", "slippers", "swimsuit", "tracksuit", "hiking_wear", "hiking_boots"];
const CASUAL = ["jeans", "tshirt", "sneakers", "padded_jacket", "hat"];

export const SITUATIONS: Situation[] = [
  {
    id: "interview",
    target: "me",
    kind: "outfit",
    titleKo: "면접",
    ko: "내일 회사 면접이 있어요. 면접에서는 깔끔하고 단정한 옷이 중요해요. 뭘 입을까요?",
    ru: "Завтра у меня собеседование в компании. На собеседовании важна аккуратная, строгая одежда. Что надеть?",
    required: [
      { anyOf: ["suit", "jacket"], ru: "На 면접 нужен 정장 или 재킷." },
      { anyOf: ["dress_shirt", "blouse"], ru: "Под 정장 — 와이셔츠 или 블라우스." },
      { anyOf: ["dress_shoes"], ru: "К строгой одежде — 구두." },
    ],
    forbidden: [{ items: CASUAL_EXTREME, ru: "На 면접 так не ходят!" }],
    discouraged: [{ items: CASUAL, ru: "Слишком повседневно для 면접." }],
    colors: [
      {
        slots: ["full", "outer", "bottom"],
        allowed: ["black", "navy", "gray"],
        ru: "Одежда на 면접 — тёмная: 검은색, 남색 или 회색.",
      },
      {
        items: ["dress_shirt", "blouse"],
        allowed: ["white"],
        ru: "Рубашка или блузка на 면접 обычно 흰색.",
      },
    ],
    patterns: [
      {
        slots: ["full", "outer", "bottom", "top"],
        allowed: ["plain"],
        ru: "На 면접 одежда без узоров — 민무늬.",
      },
    ],
    success: "Отлично! Строго и 단정해요 — 면접관 будет доволен.",
    example: [piece("suit", "navy"), piece("blouse", "white"), piece("dress_shoes", "black")],
  },
  {
    id: "wedding",
    target: "friend",
    kind: "outfit",
    titleKo: "결혼식",
    ko: "제 친구가 이번 토요일에 친구 결혼식에 가요. 하객으로 가니까 예의를 지켜야 해요.",
    ru: "Мой друг в эту субботу идёт на свадьбу к другу. Он гость (하객), поэтому нужно соблюдать приличия.",
    required: [
      { anyOf: ["suit", "jacket"], ru: "На 결혼식 гость идёт в 정장 или 재킷." },
      { anyOf: ["dress_shirt"], ru: "Под 정장 нужна 와이셔츠." },
      { anyOf: ["tie"], ru: "На 결혼식 мужчины обычно 넥타이를 매요." },
      { anyOf: ["dress_shoes"], ru: "К 정장 — 구두." },
    ],
    forbidden: [{ items: CASUAL_EXTREME, ru: "На 결혼식 в таком не ходят!" }],
    discouraged: [{ items: [...CASUAL, "boots"], ru: "Слишком повседневно для 결혼식." }],
    colors: [
      {
        slots: ["full", "outer"],
        allowed: ["black", "navy", "gray"],
        ru: "Гостю лучше спокойный 정장: 검은색, 남색 или 회색.",
      },
    ],
    success: "Хорошо! Гость выглядит нарядно и вежливо.",
    example: [
      piece("suit", "gray"),
      piece("dress_shirt", "white"),
      piece("tie", "pink", "dots"),
      piece("dress_shoes", "black"),
    ],
  },
  {
    id: "funeral",
    target: "me",
    kind: "outfit",
    titleKo: "장례식",
    ko: "친구 할아버지의 장례식이 있어요. 오늘 저녁에 장례식에 가요.",
    ru: "Похороны дедушки подруги. Сегодня вечером я иду на 장례식.",
    forbidden: [{ items: [...CASUAL_EXTREME, "hanbok"], ru: "На 장례식 так одеваться нельзя!" }],
    discouraged: [{ items: ["sneakers", "hat", "earrings", "jeans"], ru: "На 장례식 лучше скромнее." }],
    colors: [
      {
        slots: ["full", "outer", "bottom", "top", "shoes", "neck", "head"],
        banned: [...BRIGHT],
        severity: "forbidden",
        ru: "Яркий цвет на 장례식 — большая ошибка.",
      },
      {
        slots: ["full", "outer", "bottom", "shoes"],
        allowed: ["black"],
        ru: "На 장례식 надевают 검은색.",
      },
      {
        slots: ["top"],
        allowed: ["black", "white"],
        ru: "Верх на 장례식 — 검은색 или 흰색.",
      },
    ],
    patterns: [
      {
        slots: ["full", "outer", "bottom", "top", "neck"],
        allowed: ["plain"],
        ru: "На 장례식 — только 민무늬.",
      },
    ],
    success: "Правильно. Скромно и по-корейски уместно.",
    example: [piece("dress", "black"), piece("dress_shoes", "black")],
  },
  {
    id: "school",
    target: "brother",
    kind: "outfit",
    titleKo: "중학교",
    ko: "제 남동생이 내일 중학교에 처음 가요. 이 학교에서는 교복을 입어야 해요.",
    ru: "Мой младший брат завтра впервые идёт в среднюю школу. В этой школе нужно носить форму.",
    required: [
      { anyOf: ["school_uniform"], ru: "В эту школу ходят в 교복." },
      { anyOf: ["bag"], ru: "А учебники? Нужен 가방." },
    ],
    forbidden: [{ items: ["slippers", "swimsuit", "hiking_wear"], ru: "В школу так не ходят!" }],
    discouraged: [{ items: ["suit", "tracksuit", "hiking_boots"], ru: "В эту школу ходят в 교복." }],
    success: "Готово! Брат в 교복 и с 가방 — можно в школу.",
    example: [piece("school_uniform", "navy"), piece("sneakers", "white"), piece("bag", "black")],
  },
  {
    id: "dol",
    target: "dad",
    kind: "outfit",
    titleKo: "돌잔치",
    ko: "다음 주말에 사촌 동생 아기의 돌잔치가 있어요. 아빠도 같이 가세요. 돌잔치는 기쁜 날이니까 너무 어두운 넥타이보다 밝은 넥타이가 좋아요.",
    ru: "В следующие выходные 돌잔치 (первый день рождения) малыша двоюродного брата. Папа тоже идёт. Праздник радостный, поэтому галстук лучше светлый, а не слишком тёмный.",
    required: [
      { anyOf: ["suit", "jacket"], ru: "На 돌잔치 папа идёт в 정장 или 재킷." },
      { anyOf: ["dress_shirt"], ru: "Под 정장 нужна 와이셔츠." },
      { anyOf: ["tie"], ru: "Папа обычно 넥타이를 매세요." },
      { anyOf: ["dress_shoes"], ru: "К 정장 — 구두." },
    ],
    forbidden: [{ items: CASUAL_EXTREME, ru: "На праздник так не ходят!" }],
    discouraged: [{ items: CASUAL, ru: "Слишком повседневно для 돌잔치." }],
    colors: [
      {
        items: ["tie"],
        allowed: [...BRIGHT, "white"],
        ru: "Праздник радостный — 넥타이 светлого или яркого цвета.",
      },
    ],
    success: "Отлично! Нарядно и празднично.",
    example: [
      piece("suit", "navy"),
      piece("dress_shirt", "white"),
      piece("tie", "yellow"),
      piece("dress_shoes", "brown"),
    ],
  },
  {
    id: "holiday",
    target: "mom",
    kind: "outfit",
    titleKo: "명절",
    ko: "이번 설날에 할머니 댁에 가요. 엄마는 명절에 한복을 입으세요. 화사한 색 한복이 잘 어울리세요.",
    ru: "На Соллаль мы едем к бабушке. На праздник мама надевает 한복. Ей идёт 한복 нарядного яркого цвета.",
    required: [{ anyOf: ["hanbok"], ru: "На 명절 мама надевает 한복." }],
    forbidden: [{ items: [...CASUAL_EXTREME, "hiking_boots"], ru: "На 명절 так не одеваются!" }],
    discouraged: [{ items: ["sneakers", "hat", "boots"], ru: "К 한복 это не подходит." }],
    colors: [
      {
        items: ["hanbok"],
        allowed: [...BRIGHT],
        ru: "Праздничный 한복 — 화사한 색: яркий.",
      },
    ],
    success: "Красиво! 화사한 한복 — то, что нужно на 명절.",
    example: [piece("hanbok", "pink", "floral"), piece("dress_shoes", "white")],
  },
  {
    id: "grandma-gift",
    target: "grandma",
    kind: "gift",
    titleKo: "생신 선물",
    ko: "다음 주가 할머니 생신이에요. 요즘 날씨가 추워서 할머니께 따뜻한 선물을 드리고 싶어요.",
    ru: "На следующей неделе день рождения бабушки. Сейчас холодно, хочу подарить бабушке что-то тёплое.",
    required: [{ anyOf: ["muffler", "gloves"], ru: "Нужен тёплый подарок: 목도리 или 장갑." }],
    success: "Бабушке будет тепло. Отличный 선물!",
    example: [piece("muffler", "red", "check")],
  },
  {
    id: "hiking",
    target: "me",
    kind: "outfit",
    titleKo: "등산",
    ko: "이번 주말에 친구들하고 산에 가요. 산에서는 편한 옷하고 좋은 신발이 중요해요. 밝은 색 옷을 입으면 멀리에서도 잘 보여요.",
    ru: "В эти выходные иду в горы с друзьями. В горах важны удобная одежда и хорошая обувь. В светлой яркой одежде тебя видно издалека.",
    required: [
      { anyOf: ["hiking_wear"], ru: "В горы — 등산복." },
      { anyOf: ["hiking_boots"], ru: "Для гор нужны 등산화." },
    ],
    forbidden: [
      {
        items: ["dress_shoes", "slippers", "skirt", "dress", "suit", "swimsuit", "hanbok"],
        ru: "В горы так не ходят!",
      },
    ],
    discouraged: [{ items: ["boots", "sneakers", "jeans"], ru: "Для гор это неудобно." }],
    colors: [
      {
        items: ["hiking_wear"],
        allowed: [...BRIGHT],
        ru: "В горах лучше 밝은 색 — так видно издалека.",
      },
    ],
    success: "Готово к походу! Удобно и заметно.",
    example: [
      piece("hiking_wear", "orange"),
      piece("hiking_boots", "brown"),
      piece("hat", "blue"),
      piece("bag", "green"),
    ],
  },
  {
    id: "gym",
    target: "friend",
    kind: "outfit",
    titleKo: "헬스장",
    ko: "제 친구가 오늘부터 헬스장에서 운동해요. 운동할 때는 편한 옷을 입어야 해요.",
    ru: "Мой друг с сегодняшнего дня занимается в спортзале. Для тренировки нужна удобная одежда.",
    required: [
      { anyOf: ["tracksuit", "tshirt"], ru: "Для зала — 운동복 или 티셔츠." },
      { anyOf: ["sneakers"], ru: "В зале занимаются в 운동화." },
    ],
    forbidden: [
      {
        items: ["dress_shoes", "boots", "suit", "hanbok", "school_uniform", "coat"],
        ru: "В этом не потренируешься!",
      },
    ],
    discouraged: [
      { items: ["jeans", "dress_shirt", "slippers", "hiking_boots"], ru: "Для тренировки это неудобно." },
    ],
    success: "Можно на тренировку!",
    example: [piece("tracksuit", "black"), piece("sneakers", "white")],
  },
  {
    id: "dad-gift",
    target: "dad",
    kind: "gift",
    titleKo: "생신 선물",
    ko: "곧 아빠 생신이에요. 아빠는 매일 정장을 입고 회사에 가세요. 아빠께 뭘 드리면 좋을까요?",
    ru: "Скоро день рождения папы. Папа каждый день ходит на работу в костюме. Что ему подарить?",
    required: [{ anyOf: ["tie"], ru: "К 정장 каждый день — лучший подарок 넥타이." }],
    success: "Папа будет носить его на работу!",
    example: [piece("tie", "navy", "stripes")],
  },
  {
    id: "party",
    target: "me",
    kind: "outfit",
    titleKo: "생일 파티",
    ko: "오늘 저녁에 친구 생일 파티가 있어요. 예쁘고 화려한 옷을 입고 싶어요!",
    ru: "Сегодня вечером день рождения подруги. Хочу надеть что-то красивое и яркое (화려하다)!",
    forbidden: [
      { items: ["hiking_wear", "tracksuit", "swimsuit", "slippers", "school_uniform"], ru: "На вечеринку так не ходят!" },
    ],
    discouraged: [{ items: ["hiking_boots", "raincoat"], ru: "Это не для вечеринки." }],
    colors: [
      {
        slots: ["full", "top"],
        allowed: [...BRIGHT],
        ru: "Хотелось 화려한 — выберите яркий цвет.",
      },
    ],
    success: "Очень 화려해요! Вечеринка будет отличной.",
    example: [piece("dress", "pink", "dots"), piece("boots", "black"), piece("earrings", "white")],
  },
  {
    id: "rain",
    target: "brother",
    kind: "outfit",
    titleKo: "비 오는 날",
    ko: "밖에 비가 많이 와요. 그런데 남동생이 학교에 가야 해요. 비가 와도 괜찮은 옷하고 신발이 필요해요.",
    ru: "На улице сильный дождь, а брату нужно в школу. Нужны одежда и обувь, которым дождь не страшен.",
    required: [
      { anyOf: ["raincoat"], ru: "Под дождь — 비옷." },
      { anyOf: ["boots"], ru: "И 부츠, чтобы не промочить ноги." },
    ],
    forbidden: [{ items: ["swimsuit", "suit", "hanbok"], ru: "В школу так не ходят!" }],
    discouraged: [{ items: ["slippers", "dress_shoes", "sneakers"], ru: "В дождь ноги промокнут." }],
    success: "Теперь дождь не страшен!",
    example: [
      piece("school_uniform", "navy"),
      piece("raincoat", "yellow"),
      piece("boots", "yellow"),
      piece("bag", "blue"),
    ],
  },
  {
    id: "mom-gift",
    target: "mom",
    kind: "gift",
    titleKo: "엄마 선물",
    ko: "엄마는 꽃무늬를 좋아하세요. 봄에 엄마께 가벼운 스카프를 드리고 싶어요. 어떤 스카프가 좋을까요?",
    ru: "Мама любит цветочный узор (꽃무늬). Весной хочу подарить маме лёгкий платок. Какой выбрать?",
    required: [{ anyOf: ["scarf"], ru: "Решили дарить 스카프." }],
    patterns: [{ items: ["scarf"], allowed: ["floral"], ru: "Мама любит 꽃무늬!" }],
    success: "Мама будет рада такому 스카프!",
    example: [piece("scarf", "pink", "floral")],
  },
  {
    id: "date",
    target: "friend",
    kind: "outfit",
    titleKo: "데이트",
    ko: "제 친구가 토요일에 처음으로 데이트를 해요. 너무 화려하지 않고 깔끔한 옷이 좋겠어요.",
    ru: "Мой друг в субботу идёт на первое свидание. Лучше аккуратная одежда, не слишком яркая.",
    forbidden: [{ items: CASUAL_EXTREME, ru: "На свидание так не ходят!" }],
    discouraged: [{ items: ["raincoat", "hat", "suit"], ru: "Для свидания это не лучший выбор." }],
    patterns: [
      {
        slots: ["full", "top", "outer", "bottom"],
        allowed: ["plain", "stripes", "check"],
        ru: "Не слишком 화려하게: без цветочков и горошка.",
      },
    ],
    success: "Аккуратно и со вкусом. Удачи на свидании!",
    example: [
      piece("dress_shirt", "white"),
      piece("jeans"),
      piece("jacket", "navy"),
      piece("sneakers", "white"),
    ],
  },
  {
    id: "hospital",
    target: "me",
    kind: "outfit",
    titleKo: "병원",
    ko: "감기에 걸려서 병원에 가요. 의사 선생님을 만날 때는 편한 옷이 좋아요.",
    ru: "Я простудилась и иду в больницу. К врачу лучше идти в удобной одежде.",
    forbidden: [{ items: ["swimsuit", "hanbok"], ru: "В больницу так не ходят!" }],
    discouraged: [{ items: ["suit", "dress_shoes", "hiking_wear"], ru: "К врачу лучше что-то попроще и удобнее." }],
    success: "Удобно и тепло — выздоравливай!",
    example: [
      piece("tshirt", "gray"),
      piece("pants", "navy"),
      piece("coat", "brown"),
      piece("sneakers", "white"),
    ],
  },
];
