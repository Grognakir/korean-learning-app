import { BRIGHT, type ColorId, type PatternId } from "../clothing/colors";
import type { OutfitPiece } from "../clothing/situations";
import { makeEpisode } from "./episodes";
import { INTERVIEW_EPISODE } from "./interviewEpisode";
import type { Episode } from "./types";

const piece = (id: string, color: ColorId = "white", pattern: PatternId = "plain"): OutfitPiece => ({
  id,
  color,
  pattern,
});

const TOO_CASUAL = ["jeans", "sneakers", "tshirt", "shorts", "slippers", "tracksuit", "hiking_wear", "hiking_boots"];

/** Ситуации урока 10: игрок одевается сам (self) или покупает одежду
 * 지아 (forJia). Каждый запуск тренажёра — случайная из списка. */
export const EPISODES: Episode[] = [
  INTERVIEW_EPISODE,

  makeEpisode({
    id: "wedding",
    title: "Свадьба друга",
    kind: "self",
    hello: "Привет! Ты не забыл, что в эту субботу?",
    replies: ["Э-э… суббота? А что в субботу?", "Конечно помню! …Напомни, что именно?"],
    react: "Ну ты даёшь! Минсу же женится! Хорошо, что я позвонила.",
    call: [
      {
        pose: "call-talk",
        text: "이번 토요일에 민수 씨 결혼식이 있지요? 잊지 않았지요?",
        ru: "В эту субботу свадьба Минсу, помнишь? Не забыл?",
      },
      {
        pose: "call-talk",
        text: "결혼식에는 정장을 입어야 해요. 검은색이나 남색, 회색 정장이 좋아요.",
        ru: "На свадьбу нужно надеть костюм. Подойдёт чёрный, тёмно-синий или серый.",
      },
      {
        pose: "call-smirk",
        text: "흰색 와이셔츠를 입고 넥타이를 매세요. 구두도 신으세요.",
        ru: "Надень белую рубашку и повяжи галстук. И туфли надень.",
      },
      { pose: "call-annoyed", text: "운동화나 청바지는 안 돼요!", ru: "Кроссовки и джинсы — нельзя!" },
    ],
    agree: { text: "네, 정장을 사러 갈게요.", ru: "Хорошо, пойду куплю костюм." },
    placeKo: "결혼식에",
    placeRu: "на свадьбу",
    place: ["토요일 11:30", "결혼식장 앞"],
    advice: "검은색이나 남색, 회색 정장, 흰색 와이셔츠, 넥타이, 구두",
    adviceRu: "чёрный, тёмно-синий или серый костюм, белую рубашку, галстук и туфли",
    praise: { text: "와, 멋있어요! 결혼식에 잘 어울려요!", ru: "Вау, отлично! Самое то для свадьбы!" },
    rules: {
      titleKo: "결혼식",
      required: [
        { anyOf: ["suit", "jacket"], ru: "На 결혼식 — 정장 (или 재킷 с брюками)." },
        { anyOf: ["dress_shirt"], ru: "Под 정장 — 와이셔츠." },
        { anyOf: ["tie"], ru: "Нужен 넥타이." },
        { anyOf: ["dress_shoes"], ru: "К 정장 — 구두." },
      ],
      forbidden: [{ items: TOO_CASUAL, ru: "Это слишком повседневно для 결혼식." }],
      colors: [
        { slots: ["full", "outer"], allowed: ["black", "navy", "gray"], ru: "정장 — 검은색, 남색 или 회색." },
        { items: ["dress_shirt"], allowed: ["white"], ru: "와이셔츠 — 흰색." },
      ],
      example: [piece("suit", "gray"), piece("dress_shirt"), piece("tie", "pink", "dots"), piece("dress_shoes", "black")],
    },
  }),

  makeEpisode({
    id: "funeral",
    title: "Похороны",
    kind: "self",
    hello: "Привет… У меня грустная новость.",
    replies: ["Что случилось? Ты в порядке?", "Ох… Рассказывай."],
    react: "Я в порядке, спасибо. Но нам с тобой сегодня нужно кое-куда сходить.",
    call: [
      {
        pose: "call-talk",
        text: "오늘 저녁에 부장님 어머님 장례식이 있어요. 같이 가요.",
        ru: "Сегодня вечером похороны мамы нашего начальника. Пойдём вместе.",
      },
      {
        pose: "call-talk",
        text: "장례식에는 검은색 옷을 입어야 해요. 검은색 정장하고 흰색 와이셔츠를 입으세요.",
        ru: "На похороны надевают чёрное. Надень чёрный костюм и белую рубашку.",
      },
      {
        pose: "call-talk",
        text: "넥타이도 검은색으로 매고 검은색 구두를 신으세요.",
        ru: "Галстук тоже чёрный, и надень чёрные туфли.",
      },
      {
        pose: "call-talk",
        text: "밝은 색 옷이나 무늬가 있는 옷은 입지 마세요.",
        ru: "Не надевай яркое и одежду с узором.",
      },
    ],
    agree: { text: "네, 알겠어요.", ru: "Да, понял." },
    placeKo: "장례식장에",
    placeRu: "на похороны",
    place: ["오늘 18:00", "장례식장 앞"],
    advice: "검은색 정장, 흰색 와이셔츠, 검은색 넥타이, 검은색 구두",
    adviceRu: "чёрный костюм, белую рубашку, чёрный галстук и чёрные туфли",
    praise: { pose: "idle", text: "네, 단정해요. 같이 가요.", ru: "Да, строго и аккуратно. Пойдём." },
    rules: {
      titleKo: "장례식",
      required: [
        { anyOf: ["suit", "jacket"], ru: "На 장례식 — 검은색 정장." },
        { anyOf: ["dress_shirt"], ru: "Под 정장 — 와이셔츠." },
        { anyOf: ["tie"], ru: "Нужен 넥타이." },
        { anyOf: ["dress_shoes"], ru: "Нужны 구두." },
      ],
      forbidden: [{ items: [...TOO_CASUAL, "hat"], ru: "На 장례식 так не ходят!" }],
      colors: [
        {
          slots: ["full", "outer", "bottom", "shoes", "neck"],
          allowed: ["black"],
          ru: "На 장례식 — всё 검은색.",
        },
        { items: ["dress_shirt"], allowed: ["white"], ru: "와이셔츠 — 흰색." },
      ],
      patterns: [
        { slots: ["full", "outer", "bottom", "top", "neck"], allowed: ["plain"], ru: "На 장례식 — только 민무늬." },
      ],
      example: [piece("suit", "black"), piece("dress_shirt"), piece("tie", "black"), piece("dress_shoes", "black")],
    },
  }),

  makeEpisode({
    id: "hiking",
    title: "Поход в горы",
    kind: "self",
    hello: "Привет! Завтра рано вставать, помнишь?",
    replies: ["Рано?! Насколько рано?..", "Помню-помню… кажется."],
    react: "Ха-ха, в семь утра! Мы же в горы идём, соня!",
    call: [
      {
        pose: "call-smirk",
        text: "내일 우리 등산 가기로 했지요? 잊지 않았지요?",
        ru: "Мы же завтра идём в горы? Не забыл?",
      },
      {
        pose: "call-talk",
        text: "산에서는 등산복을 입고 등산화를 신어야 해요.",
        ru: "В горах нужно надеть походную одежду и треккинговые ботинки.",
      },
      {
        pose: "call-talk",
        text: "밝은 색 등산복이 좋아요. 멀리에서도 잘 보여요.",
        ru: "Лучше яркая походная одежда — тебя видно издалека.",
      },
      {
        pose: "call-talk",
        text: "모자를 쓰고 가방도 메세요. 구두나 청바지는 안 돼요!",
        ru: "Надень кепку и возьми рюкзак. Туфли и джинсы — нельзя!",
      },
    ],
    agree: { text: "네, 오늘 사 둘게요.", ru: "Да, сегодня куплю." },
    placeKo: "산에",
    placeRu: "в горы",
    place: ["토요일 07:00", "북한산 입구"],
    advice: "밝은 색 등산복, 등산화, 모자, 가방",
    adviceRu: "яркую походную одежду, треккинговые ботинки, кепку и рюкзак",
    praise: { text: "좋아요! 이제 산에 가요!", ru: "Отлично! Теперь в горы!" },
    rules: {
      titleKo: "등산",
      required: [
        { anyOf: ["hiking_wear"], ru: "В горы — 등산복." },
        { anyOf: ["hiking_boots"], ru: "Для гор нужны 등산화." },
        { anyOf: ["hat"], ru: "Нужен 모자." },
        { anyOf: ["bag"], ru: "Нужен 가방." },
      ],
      forbidden: [
        { items: ["dress_shoes", "slippers", "suit", "swimsuit", "hanbok"], ru: "В горы так не ходят!" },
      ],
      discouraged: [{ items: ["jeans", "sneakers"], ru: "Для гор это неудобно." }],
      colors: [{ items: ["hiking_wear"], allowed: [...BRIGHT], ru: "등산복 — 밝은 색, чтобы было видно издалека." }],
      example: [piece("hiking_wear", "orange"), piece("hiking_boots", "brown"), piece("hat", "blue"), piece("bag", "green")],
    },
  }),

  makeEpisode({
    id: "gym",
    title: "Спортзал",
    kind: "self",
    hello: "Привет! Ну что, начинаем новую жизнь?",
    replies: ["Какую ещё новую жизнь?", "Если это про диету — я против."],
    react: "Ха-ха, почти! Спорт! Мы же договорились, помнишь?",
    call: [
      {
        pose: "call-smirk",
        text: "오늘부터 같이 헬스장에 다니기로 했지요?",
        ru: "Мы же договорились с сегодняшнего дня вместе ходить в спортзал?",
      },
      {
        pose: "call-talk",
        text: "운동할 때는 편한 옷을 입어야 해요. 운동복이나 티셔츠하고 반바지를 입으세요.",
        ru: "Для тренировки нужна удобная одежда. Надень спортивный костюм или футболку с шортами.",
      },
      {
        pose: "call-talk",
        text: "운동화도 꼭 신으세요. 청바지나 구두는 안 돼요!",
        ru: "И обязательно кроссовки. Джинсы и туфли — нельзя!",
      },
    ],
    agree: { text: "네, 운동복을 살게요.", ru: "Хорошо, куплю спортивную одежду." },
    placeKo: "헬스장에",
    placeRu: "в спортзал",
    place: ["저녁 19:00", "헬스장 앞"],
    advice: "운동복이나 티셔츠하고 반바지, 운동화",
    adviceRu: "спортивный костюм или футболку с шортами и кроссовки",
    praise: { text: "좋아요! 그럼 운동 시작해요!", ru: "Отлично! Тогда начинаем тренировку!" },
    rules: {
      titleKo: "헬스장",
      required: [
        { anyOf: ["tracksuit", "tshirt"], ru: "Для зала — 운동복 или 티셔츠." },
        { anyOf: ["sneakers"], ru: "В зале занимаются в 운동화." },
      ],
      forbidden: [
        { items: ["dress_shoes", "boots", "suit", "hanbok", "coat", "jacket", "tie"], ru: "В этом не потренируешься!" },
      ],
      discouraged: [{ items: ["jeans", "dress_shirt", "slippers", "hiking_boots"], ru: "Для тренировки это неудобно." }],
      example: [piece("tshirt", "gray"), piece("shorts", "black"), piece("sneakers")],
    },
  }),

  makeEpisode({
    id: "hospital",
    title: "Запись к врачу",
    kind: "self",
    hello: "Привет! Как ты себя чувствуешь?",
    replies: ["Кхе-кхе… Так себе.", "Нормально! …Апчхи!"],
    react: "Ой, слышу-слышу. А ты не забыл, что тебе завтра к врачу?",
    call: [
      {
        pose: "call-talk",
        text: "내일 오전에 병원 예약이 있지요? 감기가 아직 안 나았지요?",
        ru: "У тебя же завтра утром запись к врачу? Простуда ещё не прошла?",
      },
      {
        pose: "call-talk",
        text: "날씨가 추우니까 따뜻하게 입으세요. 코트를 입고 목도리도 하세요.",
        ru: "На улице холодно, оденься тепло. Надень пальто и шарф.",
      },
      {
        pose: "call-talk",
        text: "병원에 갈 때는 편한 옷이 좋아요. 정장은 입지 마세요.",
        ru: "К врачу лучше идти в удобной одежде. Костюм не надевай.",
      },
    ],
    agree: { text: "네, 따뜻하게 입을게요.", ru: "Хорошо, оденусь тепло." },
    placeKo: "병원에",
    placeRu: "к врачу",
    place: ["다음 날 09:30", "병원 앞"],
    advice: "따뜻한 코트, 목도리, 편한 옷",
    adviceRu: "тёплое пальто, шарф и удобную одежду",
    praise: { text: "좋아요, 따뜻해 보여요. 빨리 나으세요!", ru: "Хорошо, выглядит тепло. Выздоравливай скорее!" },
    rules: {
      titleKo: "병원",
      required: [
        { anyOf: ["coat", "padded_jacket"], ru: "Холодно — нужен 코트 или 점퍼." },
        { anyOf: ["muffler"], ru: "Нужен 목도리." },
      ],
      forbidden: [{ items: ["swimsuit", "hanbok", "shorts", "slippers"], ru: "Простуженным так не ходят!" }],
      discouraged: [{ items: ["suit", "dress_shoes", "tie"], ru: "К врачу лучше что-то удобнее." }],
      example: [
        piece("tshirt", "gray"),
        piece("pants", "navy"),
        piece("coat", "brown"),
        piece("muffler", "red", "check"),
        piece("sneakers"),
      ],
    },
  }),

  makeEpisode({
    id: "rain",
    title: "Дождливый день",
    kind: "self",
    hello: "Привет! Ты в окно смотрел?",
    replies: ["Нет, а что там?", "Смотрел. Льёт как из ведра…"],
    react: "Вот именно! А мы сегодня в город собирались. Слушай внимательно.",
    call: [
      {
        pose: "call-talk",
        text: "오늘 오후에 같이 시내에 가기로 했지요? 그런데 비가 많이 와요.",
        ru: "Мы же днём едем в центр? А там сильный дождь.",
      },
      {
        pose: "call-talk",
        text: "비옷을 입고 부츠를 신으세요. 운동화를 신으면 발이 다 젖어요.",
        ru: "Надень дождевик и сапоги. В кроссовках ноги промокнут.",
      },
      {
        pose: "call-smirk",
        text: "비옷은 노란색이나 빨간색이 좋아요. 밝은 색이 잘 보여요.",
        ru: "Дождевик лучше жёлтый или красный — яркий цвет хорошо видно.",
      },
    ],
    agree: { text: "네, 비옷하고 부츠를 살게요.", ru: "Хорошо, куплю дождевик и сапоги." },
    placeKo: "시내에",
    placeRu: "в город",
    place: ["오후 14:00", "지하철역 앞"],
    advice: "노란색이나 빨간색 비옷, 부츠",
    adviceRu: "жёлтый или красный дождевик и сапоги",
    praise: { text: "좋아요! 이제 비가 와도 괜찮아요.", ru: "Отлично! Теперь и дождь не страшен." },
    rules: {
      titleKo: "비 오는 날",
      required: [
        { anyOf: ["raincoat"], ru: "В дождь — 비옷." },
        { anyOf: ["boots"], ru: "И 부츠, чтобы не промочить ноги." },
      ],
      forbidden: [{ items: ["swimsuit", "hanbok", "suit"], ru: "В город под дождём так не ходят!" }],
      discouraged: [{ items: ["slippers", "dress_shoes", "sneakers"], ru: "В дождь ноги промокнут." }],
      colors: [{ items: ["raincoat"], allowed: ["yellow", "red"], ru: "비옷 — 노란색 или 빨간색." }],
      example: [piece("tshirt"), piece("jeans"), piece("raincoat", "yellow"), piece("boots", "black")],
    },
  }),

  makeEpisode({
    id: "ski",
    title: "Зимняя поездка",
    kind: "self",
    hello: "Привет! Билеты на горнолыжку уже у меня!",
    replies: ["Ура! Наконец-то!", "Горнолыжку?.. Я же на лыжах не умею…"],
    react: "Научишься, ха-ха! Главное — не замёрзнуть. Сейчас скажу, что купить.",
    call: [
      {
        pose: "call-smirk",
        text: "다음 주에 스키장에 가요. 거기는 정말 추워요.",
        ru: "На следующей неделе едем на горнолыжный курорт. Там очень холодно.",
      },
      {
        pose: "call-talk",
        text: "점퍼를 입고 목도리를 하세요. 장갑도 끼세요.",
        ru: "Надень куртку и шарф. И перчатки надень.",
      },
      {
        pose: "call-talk",
        text: "목도리는 체크무늬가 예뻐요. 그리고 부츠를 신으세요.",
        ru: "Шарф в клетку — красиво. И надень сапоги.",
      },
      { pose: "call-annoyed", text: "반바지나 슬리퍼는 절대 안 돼요!", ru: "Шорты и шлёпанцы — ни в коем случае!" },
    ],
    agree: { text: "네, 따뜻한 옷을 살게요.", ru: "Хорошо, куплю тёплую одежду." },
    placeKo: "스키장에",
    placeRu: "на горнолыжный курорт",
    place: ["다음 주 토요일 08:00", "버스 터미널"],
    advice: "점퍼, 체크무늬 목도리, 장갑, 부츠",
    adviceRu: "куртку, шарф в клетку, перчатки и сапоги",
    praise: { text: "와, 따뜻해 보여요! 이제 스키 타러 가요!", ru: "Вау, тепло одет! Теперь кататься!" },
    rules: {
      titleKo: "스키장",
      required: [
        { anyOf: ["padded_jacket"], ru: "В мороз — 점퍼." },
        { anyOf: ["muffler"], ru: "Нужен 목도리." },
        { anyOf: ["gloves"], ru: "Нужны 장갑." },
        { anyOf: ["boots"], ru: "Нужны 부츠." },
      ],
      forbidden: [{ items: ["shorts", "slippers", "swimsuit"], ru: "Зимой так нельзя — замёрзнешь!" }],
      discouraged: [{ items: ["dress_shoes", "suit"], ru: "На горнолыжке это неудобно." }],
      patterns: [{ items: ["muffler"], allowed: ["check"], ru: "목도리 — 체크무늬, как советовала 지아." }],
      example: [
        piece("padded_jacket", "navy"),
        piece("tshirt", "gray"),
        piece("jeans"),
        piece("muffler", "red", "check"),
        piece("gloves", "red"),
        piece("boots", "brown"),
      ],
    },
  }),

  makeEpisode({
    id: "date",
    title: "Первое свидание",
    kind: "self",
    hello: "Привет! Я всё знаю про субботу!",
    replies: ["Откуда?! Кто проболтался?", "Про какую ещё субботу?.."],
    react: "Ха-ха, не скажу! Но помогу собраться, чтобы всё прошло идеально.",
    call: [
      {
        pose: "call-smirk",
        text: "토요일에 처음으로 데이트하지요? 축하해요!",
        ru: "В субботу у тебя первое свидание? Поздравляю!",
      },
      {
        pose: "call-talk",
        text: "깔끔한 옷이 좋아요. 와이셔츠를 입고 재킷을 입으세요.",
        ru: "Лучше аккуратная одежда. Надень рубашку и пиджак.",
      },
      {
        pose: "call-talk",
        text: "꽃무늬나 물방울무늬는 너무 화려해요. 민무늬나 줄무늬로 하세요.",
        ru: "Цветочки и горошек — слишком пёстро. Лучше однотонное или в полоску.",
      },
      {
        pose: "call-talk",
        text: "구두나 깨끗한 운동화를 신으세요.",
        ru: "Надень туфли или чистые кроссовки.",
      },
    ],
    agree: { text: "네, 고마워요! 옷을 사러 갈게요.", ru: "Спасибо! Пойду куплю одежду." },
    placeKo: "데이트에",
    placeRu: "на свидание",
    place: ["토요일 18:00", "카페 앞"],
    advice: "와이셔츠, 재킷, 구두나 운동화",
    adviceRu: "рубашку, пиджак и туфли или кроссовки",
    praise: { text: "와, 멋있어요! 데이트 잘 하세요!", ru: "Вау, отлично выглядишь! Удачного свидания!" },
    rules: {
      titleKo: "데이트",
      required: [
        { anyOf: ["dress_shirt"], ru: "Нужна 와이셔츠." },
        { anyOf: ["jacket"], ru: "Нужен 재킷." },
        { anyOf: ["dress_shoes", "sneakers"], ru: "Нужны 구두 или 운동화." },
      ],
      forbidden: [{ items: ["tracksuit", "hiking_wear", "hiking_boots", "slippers", "shorts"], ru: "На свидание так не ходят!" }],
      patterns: [
        {
          slots: ["full", "top", "outer", "bottom"],
          allowed: ["plain", "stripes"],
          ru: "Без 꽃무늬 и 물방울무늬 — 민무늬 или 줄무늬.",
        },
      ],
      example: [piece("dress_shirt", "white", "stripes"), piece("jacket", "navy"), piece("pants", "gray"), piece("sneakers")],
    },
  }),

  makeEpisode({
    id: "party",
    title: "Вечеринка 지아",
    kind: "forJia",
    hello: "Привет! Выручишь меня? Очень срочно!",
    replies: ["Конечно! Что случилось?", "Опять что-то срочное? Ну давай."],
    react: "Ты лучший! Только не смейся: дело в одежде.",
    call: [
      {
        pose: "call-talk",
        text: "오늘 저녁에 친구 생일 파티가 있어요. 그런데 일이 많아서 옷을 살 시간이 없어요.",
        ru: "Сегодня вечером день рождения подруги, а у меня столько работы, что некогда купить одежду.",
      },
      {
        pose: "call-smirk",
        text: "제 옷 좀 사 줄 수 있어요? 화려한 원피스가 좋아요. 빨간색이나 분홍색으로요!",
        ru: "Купишь мне одежду? Хочу яркое платье — красное или розовое!",
      },
      { pose: "call-talk", text: "귀걸이하고 부츠도 사 주세요.", ru: "И серьги с сапогами, пожалуйста." },
    ],
    agree: { text: "네, 사 줄게요.", ru: "Хорошо, куплю." },
    placeKo: "파티에",
    placeRu: "на вечеринку",
    place: ["오늘 19:00", "지아 집 앞"],
    advice: "빨간색이나 분홍색 원피스, 귀걸이, 부츠",
    adviceRu: "красное или розовое платье, серьги и сапоги",
    praise: { text: "와, 정말 예뻐요! 고마워요!", ru: "Вау, какая красота! Спасибо!" },
    rules: {
      titleKo: "생일 파티",
      required: [
        { anyOf: ["dress"], ru: "지아 просила 원피스." },
        { anyOf: ["earrings"], ru: "И 귀걸이." },
        { anyOf: ["boots"], ru: "И 부츠." },
      ],
      forbidden: [{ items: ["hiking_wear", "tracksuit", "slippers", "suit"], ru: "На вечеринку так не ходят!" }],
      colors: [{ items: ["dress"], allowed: ["red", "pink"], ru: "원피스 — 빨간색 или 분홍색." }],
      example: [piece("dress", "red", "dots"), piece("earrings"), piece("boots", "black")],
    },
  }),

  makeEpisode({
    id: "holiday",
    title: "Чхусок у бабушки",
    kind: "forJia",
    hello: "Привет! У меня к тебе праздничная просьба.",
    replies: ["Праздничная? Звучит интересно.", "Если про готовку — я пас."],
    react: "Ха-ха, нет, не про готовку! Про бабушку и Чхусок.",
    call: [
      {
        pose: "call-talk",
        text: "이번 추석에 할머니 댁에 가요. 할머니께서 한복을 좋아하세요.",
        ru: "На Чхусок еду к бабушке. Бабушка любит ханбок.",
      },
      {
        pose: "call-smirk",
        text: "한복을 하나 사 줄 수 있어요? 화사한 색이 좋아요. 노란색이나 분홍색이요.",
        ru: "Купишь мне ханбок? Хочу нарядный цвет — жёлтый или розовый.",
      },
      {
        pose: "call-talk",
        text: "꽃무늬 한복이면 더 좋아요! 구두도 부탁해요.",
        ru: "А если в цветочек — ещё лучше! И туфли, пожалуйста.",
      },
    ],
    agree: { text: "네, 예쁜 한복을 살게요.", ru: "Хорошо, куплю красивый ханбок." },
    placeKo: "할머니 댁에",
    placeRu: "к бабушке",
    place: ["추석 아침", "지아 집 앞"],
    advice: "노란색이나 분홍색 꽃무늬 한복, 구두",
    adviceRu: "жёлтый или розовый ханбок в цветочек и туфли",
    praise: { text: "와, 정말 화사해요! 할머니가 좋아하실 거예요!", ru: "Вау, какой нарядный! Бабушке понравится!" },
    rules: {
      titleKo: "추석",
      required: [
        { anyOf: ["hanbok"], ru: "지아 просила 한복." },
        { anyOf: ["dress_shoes"], ru: "И 구두." },
      ],
      forbidden: [{ items: ["hiking_wear", "tracksuit", "swimsuit", "jeans"], ru: "На 추석 к бабушке так не ходят!" }],
      colors: [{ items: ["hanbok"], allowed: ["yellow", "pink"], ru: "한복 — 노란색 или 분홍색." }],
      patterns: [{ items: ["hanbok"], allowed: ["floral"], ru: "한복 — 꽃무늬." }],
      example: [piece("hanbok", "pink", "floral"), piece("dress_shoes")],
    },
  }),

  makeEpisode({
    id: "guest",
    title: "Свадьба сестры 지아",
    kind: "forJia",
    hello: "Привет! Мне нужна твоя помощь с нарядом.",
    replies: ["С нарядом? Ты уверена, что именно моя?", "Конечно, говори."],
    react: "Уверена! У тебя хороший вкус. Ну… иногда, ха-ха.",
    call: [
      {
        pose: "call-talk",
        text: "다음 주 일요일에 사촌 언니 결혼식이 있어요.",
        ru: "В следующее воскресенье свадьба моей двоюродной сестры.",
      },
      {
        pose: "call-smirk",
        text: "원피스를 하나 사 줄 수 있어요? 그런데 흰색은 안 돼요. 흰색은 신부 색이에요.",
        ru: "Купишь мне платье? Только не белое — белый это цвет невесты.",
      },
      { pose: "call-talk", text: "구두하고 가방도 사 주세요.", ru: "И туфли с сумкой, пожалуйста." },
    ],
    agree: { text: "네, 알겠어요. 흰색은 안 살게요.", ru: "Понял. Белое не беру." },
    placeKo: "결혼식에",
    placeRu: "на свадьбу",
    place: ["일요일 12:00", "결혼식장 앞"],
    advice: "흰색이 아닌 원피스, 구두, 가방",
    adviceRu: "платье (только не белое), туфли и сумку",
    praise: { text: "와, 예뻐요! 결혼식에 딱 좋아요. 고마워요!", ru: "Вау, красиво! Как раз для свадьбы. Спасибо!" },
    rules: {
      titleKo: "결혼식",
      required: [
        { anyOf: ["dress"], ru: "지아 просила 원피스." },
        { anyOf: ["dress_shoes"], ru: "И 구두." },
        { anyOf: ["bag"], ru: "И 가방." },
      ],
      forbidden: [{ items: TOO_CASUAL, ru: "На 결혼식 так не ходят!" }],
      colors: [
        {
          items: ["dress"],
          banned: ["white"],
          severity: "forbidden",
          ru: "Белое на чужой 결혼식 — нельзя, это цвет невесты!",
        },
      ],
      example: [piece("dress", "navy"), piece("dress_shoes", "black"), piece("bag", "brown")],
    },
  }),

  makeEpisode({
    id: "jia-interview",
    title: "Собеседование 지아",
    kind: "forJia",
    hello: "Привет! Ты не поверишь — меня позвали на собеседование!",
    replies: ["Серьёзно?! Поздравляю!", "Куда? Рассказывай!"],
    react: "Спасибо! Я так волнуюсь… И у меня проблема с одеждой.",
    call: [
      {
        pose: "call-smirk",
        text: "저 내일 면접이 있어요! 그런데 정장이 없어요.",
        ru: "У меня завтра собеседование! А костюма нет.",
      },
      {
        pose: "call-talk",
        text: "검은색이나 남색 정장을 사 줄 수 있어요? 블라우스는 흰색으로요.",
        ru: "Купишь мне чёрный или тёмно-синий костюм? И белую блузку.",
      },
      {
        pose: "call-talk",
        text: "구두도 사 주세요. 무늬가 있는 옷은 안 돼요.",
        ru: "И туфли, пожалуйста. Одежду с узором — нельзя.",
      },
    ],
    agree: { text: "네, 사 줄게요. 면접 잘 보세요!", ru: "Хорошо, куплю. Удачи на собеседовании!" },
    placeKo: "면접에",
    placeRu: "на собеседование",
    place: ["다음 날 08:30", "지아 집 앞"],
    advice: "검은색이나 남색 정장, 흰색 블라우스, 구두",
    adviceRu: "чёрный или тёмно-синий костюм, белую блузку и туфли",
    praise: { text: "와, 완벽해요! 이제 면접에 갈 수 있어요!", ru: "Вау, идеально! Теперь можно на собеседование!" },
    rules: {
      titleKo: "면접",
      required: [
        { anyOf: ["suit", "jacket"], ru: "지아 просила 정장." },
        { anyOf: ["blouse"], ru: "И 블라우스." },
        { anyOf: ["dress_shoes"], ru: "И 구두." },
      ],
      forbidden: [{ items: [...TOO_CASUAL, "hat"], ru: "Это слишком повседневно для 면접." }],
      colors: [
        { slots: ["full", "outer", "bottom"], allowed: ["black", "navy"], ru: "정장 — 검은색 или 남색." },
        { items: ["blouse"], allowed: ["white"], ru: "블라우스 — 흰색." },
      ],
      patterns: [{ slots: ["full", "outer", "bottom", "top"], allowed: ["plain"], ru: "Одежда без узоров — 민무늬." }],
      example: [piece("suit", "black"), piece("blouse"), piece("dress_shoes", "black")],
    },
  }),

  makeEpisode({
    id: "beach",
    title: "Поездка на море",
    kind: "forJia",
    hello: "Привет! Угадай, куда я еду на выходных?",
    replies: ["В горы?", "На море? По голосу слышно!"],
    react: "На море, в Пусан! Только купальника-то у меня нет…",
    call: [
      {
        pose: "call-smirk",
        text: "이번 주말에 친구들하고 부산 바다에 가요!",
        ru: "В эти выходные еду с друзьями на море в Пусан!",
      },
      {
        pose: "call-talk",
        text: "수영복을 사 줄 수 있어요? 파란색이나 초록색이 좋아요.",
        ru: "Купишь мне купальник? Хочу синий или зелёный.",
      },
      {
        pose: "call-talk",
        text: "슬리퍼하고 모자도 사 주세요. 햇빛이 강해요.",
        ru: "И шлёпанцы с кепкой, пожалуйста. Солнце там сильное.",
      },
    ],
    agree: { text: "네, 사 줄게요. 재미있게 놀아요!", ru: "Хорошо, куплю. Хорошо отдохнуть!" },
    placeKo: "바다에",
    placeRu: "на море",
    place: ["금요일 저녁", "서울역"],
    advice: "파란색이나 초록색 수영복, 슬리퍼, 모자",
    adviceRu: "синий или зелёный купальник, шлёпанцы и кепку",
    praise: { text: "와, 마음에 들어요! 고마워요!", ru: "Вау, мне нравится! Спасибо!" },
    rules: {
      titleKo: "바다",
      required: [
        { anyOf: ["swimsuit"], ru: "지아 просила 수영복." },
        { anyOf: ["slippers"], ru: "И 슬리퍼." },
        { anyOf: ["hat"], ru: "И 모자." },
      ],
      forbidden: [{ items: ["coat", "padded_jacket", "suit", "boots", "muffler", "gloves"], ru: "На море летом — это лишнее!" }],
      colors: [{ items: ["swimsuit"], allowed: ["blue", "green"], ru: "수영복 — 파란색 или 초록색." }],
      example: [piece("swimsuit", "blue", "dots"), piece("slippers"), piece("hat", "yellow")],
    },
  }),

  makeEpisode({
    id: "picnic",
    title: "Весенний пикник",
    kind: "forJia",
    hello: "Привет! Завтра пикник, а мне нечего надеть!",
    replies: ["Совсем нечего?", "Классика. Чем помочь?"],
    react: "Совсем-совсем! Выручай, пожалуйста.",
    call: [
      {
        pose: "call-talk",
        text: "내일 회사에서 봄 소풍을 가요.",
        ru: "Завтра у нас на работе весенний пикник.",
      },
      {
        pose: "call-smirk",
        text: "꽃무늬 치마나 원피스를 사 줄 수 있어요? 봄이니까 꽃무늬가 예뻐요.",
        ru: "Купишь мне юбку или платье в цветочек? Весна — цветочки красиво.",
      },
      {
        pose: "call-talk",
        text: "많이 걸으니까 운동화를 신을 거예요. 운동화하고 가방도 사 주세요.",
        ru: "Ходить будем много, так что надену кроссовки. Купи кроссовки и сумку.",
      },
    ],
    agree: { text: "네, 예쁜 걸로 살게요.", ru: "Хорошо, выберу красивое." },
    placeKo: "소풍에",
    placeRu: "на пикник",
    place: ["다음 날 09:00", "회사 앞"],
    advice: "꽃무늬 치마나 원피스, 운동화, 가방",
    adviceRu: "юбку или платье в цветочек, кроссовки и сумку",
    praise: { text: "와, 봄 느낌이에요! 정말 고마워요!", ru: "Вау, прямо весна! Спасибо большое!" },
    rules: {
      titleKo: "소풍",
      required: [
        { anyOf: ["dress", "skirt"], ru: "지아 просила 치마 или 원피스." },
        { anyOf: ["sneakers"], ru: "И 운동화." },
        { anyOf: ["bag"], ru: "И 가방." },
      ],
      forbidden: [{ items: ["suit", "swimsuit", "padded_jacket"], ru: "На пикник так не ходят!" }],
      discouraged: [{ items: ["dress_shoes", "boots", "slippers"], ru: "Ходить много — в этом неудобно." }],
      patterns: [{ items: ["dress", "skirt"], allowed: ["floral"], ru: "치마 / 원피스 — 꽃무늬." }],
      example: [piece("skirt", "yellow", "floral"), piece("blouse"), piece("sneakers"), piece("bag", "pink")],
    },
  }),

  makeEpisode({
    id: "concert",
    title: "Концерт на улице",
    kind: "forJia",
    hello: "Привет! Сегодня концерт, а я совсем не готова к холоду!",
    replies: ["Какой концерт? Под открытым небом?", "Опять забыла про погоду?"],
    react: "Ага, на улице! Я там превращусь в сосульку, если ты не поможешь.",
    call: [
      {
        pose: "call-talk",
        text: "오늘 밤에 야외 공연이 있어요. 그런데 밖이 정말 추워요.",
        ru: "Сегодня вечером концерт под открытым небом, а на улице очень холодно.",
      },
      {
        pose: "call-talk",
        text: "따뜻한 코트를 사 줄 수 있어요? 갈색이나 회색으로요.",
        ru: "Купишь мне тёплое пальто? Коричневое или серое.",
      },
      {
        pose: "call-smirk",
        text: "목도리하고 장갑, 부츠도 부탁해요. 장갑은 빨간색이 좋아요!",
        ru: "И шарф, перчатки, сапоги, пожалуйста. Перчатки — красные!",
      },
    ],
    agree: { text: "네, 따뜻한 걸로 살게요.", ru: "Хорошо, куплю всё тёплое." },
    placeKo: "공연에",
    placeRu: "на концерт",
    place: ["오늘 19:30", "공연장 앞"],
    advice: "갈색이나 회색 코트, 목도리, 빨간색 장갑, 부츠",
    adviceRu: "коричневое или серое пальто, шарф, красные перчатки и сапоги",
    praise: { text: "와, 정말 따뜻해요! 고마워요!", ru: "Вау, как тепло! Спасибо!" },
    rules: {
      titleKo: "공연",
      required: [
        { anyOf: ["coat"], ru: "지아 просила 코트." },
        { anyOf: ["muffler"], ru: "И 목도리." },
        { anyOf: ["gloves"], ru: "И 장갑." },
        { anyOf: ["boots"], ru: "И 부츠." },
      ],
      forbidden: [{ items: ["shorts", "slippers", "swimsuit"], ru: "В такой холод — замёрзнет!" }],
      colors: [
        { items: ["coat"], allowed: ["brown", "gray"], ru: "코트 — 갈색 или 회색." },
        { items: ["gloves"], allowed: ["red"], ru: "장갑 — 빨간색." },
      ],
      example: [piece("coat", "brown"), piece("muffler"), piece("gloves", "red"), piece("boots", "black")],
    },
  }),
];
