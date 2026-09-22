import { WORD_CARDS } from "./wordCards";
import { FormalityToggle } from "./FormalityToggle";
import { QuestionsTrainer } from "./trainer/QuestionsTrainer";
import styles from "./QuestionsTopic.module.css";

const CONTRACTIONS = [
  {
    eq: ["누구+가", "누가"],
    desc: "Единственная настоящая неправильная стяжка. Не «누구가» — только 누가.",
    example: { kr: "교실에 누가 있어요?", rr: "Gyosire nuga isseoyo?", ru: "Кто есть в классе?" },
  },
  {
    eq: ["무엇+이", "뭐가"],
    desc: "Стяжка 무엇→뭐 + частица 이. Разговорный вариант, в письменном/официальном тексте — 무엇이.",
    example: { kr: "뭐가 맛있어요?", rr: "Mwoga masisseoyo?", ru: "Что вкусное?" },
  },
  {
    eq: ["무엇+을", "뭘"],
    desc: "Та же логика: 뭐+을 стягивается в 뭘.",
    example: { kr: "주말에 뭘 했어요?", rr: "Jumare mwol haesseoyo?", ru: "Что делал на выходных?" },
  },
  {
    eq: ["어디+에서", "어디서"],
    desc: "Просто разговорное сокращение, не неправильная форма — 에서 можно не сокращать.",
    example: { kr: "어디서 만나요?", rr: "Eodiseo manayo?", ru: "Где встретимся?" },
  },
];

const COUNTERS = [
  { kr: "개", rr: "gae", meaning: "вещи (штуки)", example: "사과가 몇 개 있어요? — сколько яблок?" },
  { kr: "명", rr: "myeong", meaning: "люди (нейтрально)", example: "가족이 몇 명이에요? — сколько человек в семье?" },
  { kr: "살", rr: "sal", meaning: "возраст", example: "몇 살이에요? — сколько лет?" },
  { kr: "시", rr: "si", meaning: "час", example: "지금 몇 시예요? — который час?" },
  { kr: "번", rr: "beon", meaning: "номер / количество раз", example: "전화번호가 몇 번이에요? — какой номер телефона?" },
];

const CHEAT_ITEMS = [
  { kr: "뭐/무엇", rr: "mwo/mueot", ru: "что" },
  { kr: "누구 (누가)", rr: "nugu (nuga)", ru: "кто" },
  { kr: "어디", rr: "eodi", ru: "где, куда" },
  { kr: "언제", rr: "eonje", ru: "когда" },
  { kr: "왜", rr: "wae", ru: "почему" },
  { kr: "어떻게", rr: "eotteoke", ru: "как" },
  { kr: "얼마", rr: "eolma", ru: "сколько (цена)" },
  { kr: "얼마나", rr: "eolmana", ru: "насколько/как долго" },
  { kr: "몇 + сч.сл.", rr: "myeot", ru: "сколько (штук)" },
  { kr: "어느 + сущ.", rr: "eoneu", ru: "который (из)" },
  { kr: "무슨 + сущ.", rr: "museun", ru: "что за" },
  { kr: "며칠", rr: "myeochil", ru: "какое число" },
];

const TOC = [
  { href: "#types", label: "Типы вопросов" },
  { href: "#words", label: "의문사" },
  { href: "#particles", label: "Частицы" },
  { href: "#vs", label: "무슨 vs 어느" },
  { href: "#counters", label: "몇 + счётные" },
  { href: "#style", label: "Уровни вежливости" },
  { href: "#answers", label: "Ответы" },
  { href: "#quiz", label: "Тренажёр" },
  { href: "#cheat", label: "Шпаргалка" },
];

export function QuestionsTopic() {
  return (
    <div className={styles.root}>
      <div className={styles.hero}>
        <span className={styles.eyebrow}>한국어 문법 · вопросы</span>
        <h1 className={styles.title}>
          Вопросы на корейском <span className={`${styles.titleKr} kr`}>한국어 질문</span>
        </h1>
        <p className={styles.subtitle}>
          Вопрос в корейском строится из обычного предложения: вопросительное слово занимает то же
          место, что было бы у ответа, а вопросительность добавляется окончанием или интонацией —
          без инверсии и без «do/does», как в английском.
        </p>

        <div className={styles.compare}>
          <div className={styles.compareRow}>
            <span className={styles.compareTag}>RU</span>
            <div>
              <div className={styles.compareSent}>
                <span className={styles.q}>Где</span> живёт Дима?
              </div>
              <div className={styles.compareNote}>вопросительное слово выносится в начало предложения</div>
            </div>
          </div>
          <div className={styles.compareRow}>
            <span className={styles.compareTag}>EN</span>
            <div>
              <div className={styles.compareSent}>
                <span className={styles.q}>Where</span> does Dima live?
              </div>
              <div className={styles.compareNote}>слово выносится в начало + появляется служебное does</div>
            </div>
          </div>
          <div className={styles.compareRow}>
            <span className={styles.compareTag}>KR</span>
            <div>
              <div className={`${styles.compareSent} kr`}>
                디마는 <span className={styles.q}>어디에</span> 살아요?
              </div>
              <div className={styles.compareNote}>
                <span className={styles.rr}>Dima-neun eodie sarayo?</span> — дословно «Дима где-в
                живёт?». Слово «где» стоит там же, где стояло бы в ответе (
                <span className="kr">디마는 서울에 살아요</span> — «Дима живёт в Сеуле»). Никуда не
                переносится.
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav className={styles.toc}>
        {TOC.map((item) => (
          <a key={item.href} href={item.href} className={styles.tocLink}>
            {item.label}
          </a>
        ))}
      </nav>

      <section id="types" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>01</span>
          <h2>Два типа вопросов</h2>
        </div>
        <p className={styles.secDesc}>
          В корейском нет отдельной «вопросительной формы» глагола — вопрос делается либо
          интонацией/окончанием, либо добавлением 의문사 в предложение. Структура предложения не
          меняется.
        </p>
        <div className={styles.typeGrid}>
          <div className={`${styles.typeCard} ${styles.typeCardClosed}`}>
            <span className={`${styles.badge} ${styles.badgeClosed}`}>закрытый · да/нет</span>
            <h3>Без вопросительного слова</h3>
            <p className={styles.typeCardText}>
              То же самое предложение, что и утверждение — просто с «?» на конце (на письме) и
              восходящей интонацией (в речи).
            </p>
            <div className={styles.ex}>
              <span className="kr">리나 씨, 학생이에요?</span>
              <span className={styles.rr}>Rina ssi, haksaeng-ieyo?</span>
              <span className={styles.ruLine}>Рина, ты студентка?</span>
            </div>
            <div className={styles.ex}>
              <span className="kr">네, 학생이에요. / 아니요, 학생이 아니에요.</span>
              <span className={styles.ruLine}>Да, студентка. / Нет, не студентка.</span>
            </div>
          </div>
          <div className={`${styles.typeCard} ${styles.typeCardOpen}`}>
            <span className={`${styles.badge} ${styles.badgeOpen}`}>открытый · с 의문사</span>
            <h3>С вопросительным словом</h3>
            <p className={styles.typeCardText}>
              В предложение вставляется 의문사 на то место, где в ответе стояло бы нужное слово.
            </p>
            <div className={styles.ex}>
              <span className="kr">
                리나 씨는 <b className={styles.accent}>뭐</b> 공부해요?
              </span>
              <span className={styles.rr}>Rina ssi-neun mwo gonghaeyo?</span>
              <span className={styles.ruLine}>Что изучает Рина?</span>
            </div>
            <div className={styles.ex}>
              <span className="kr">한국어를 공부해요.</span>
              <span className={styles.ruLine}>Изучает корейский.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="words" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>02</span>
          <h2>의문사 — вопросительные слова</h2>
        </div>
        <p className={styles.secDesc}>
          Нажмите на слово, чтобы открыть пример. 뭐 и 무엇 — одно и то же слово, 뭐 просто разговорный
          вариант 무엇.
        </p>
        <div className={styles.wordGrid}>
          {WORD_CARDS.map((word) => (
            <details key={word.kr} className={styles.wordDetails}>
              <summary className={styles.wordSummary}>
                <span className={`${styles.wordKr} kr`}>{word.kr}</span>
                <span className={styles.wordRr}>{word.rr}</span>
                <span className={styles.wordRu}>{word.ru}</span>
                <svg className={styles.wordChev} viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M6 3l5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </summary>
              <div className={styles.wordBody}>
                <p className={styles.wordNote}>{word.note}</p>
                <div className={styles.ex}>
                  <span className="kr">{word.example.kr}</span>
                  <span className={styles.rr}>{word.example.rr}</span>
                  <span className={styles.ruLine}>{word.example.ru}</span>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section id="particles" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>03</span>
          <h2>Вопросительные слова + частицы</h2>
        </div>
        <p className={styles.secDesc}>
          Частицы (을/를, 이/가, 에, 에서…) навешиваются на 의문사 так же, как на любое существительное
          — с парой важных исключений.
        </p>
        <div className={styles.contrGrid}>
          {CONTRACTIONS.map((c) => (
            <div key={c.eq[1]} className={styles.contrCard}>
              <div className={`${styles.contrEq} kr`}>
                {c.eq[0]}
                <span className={styles.contrArrow}>→</span>
                <span className={styles.contrOut}>{c.eq[1]}</span>
              </div>
              <div className={styles.contrDesc}>
                {c.desc}
                <br />
                <span className="kr">{c.example.kr}</span> <span className={styles.rr}>{c.example.rr}</span> —{" "}
                {c.example.ru}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="vs" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>04</span>
          <h2>무슨 vs 어느 — частая путаница</h2>
        </div>
        <p className={styles.secDesc}>Оба переводятся как «какой», но спрашивают о разном.</p>
        <div className={styles.vsGrid}>
          <div className={styles.vsCard}>
            <h4 className="kr">무슨 <span className={styles.rr}>museun</span></h4>
            <p>
              какой по <b>типу / содержанию</b> — вариантов заранее нет, ответ описывает вещь
            </p>
            <div className={styles.ex}>
              <span className="kr">무슨 책이에요?</span>
              <span className={styles.rr}>Museun chaegieyo?</span>
              <span className={styles.ruLine}>Что за книга? / О чём книга?</span>
            </div>
          </div>
          <div className={styles.vsCard}>
            <h4 className="kr">어느 <span className={styles.rr}>eoneu</span></h4>
            <p>
              какой из <b>конкретного набора</b> — есть варианты, из которых выбираешь
            </p>
            <div className={styles.ex}>
              <span className="kr">어느 책을 읽었어요?</span>
              <span className={styles.rr}>Eoneu chaegeul ilgeosseoyo?</span>
              <span className={styles.ruLine}>Которую (из этих) книгу прочитал?</span>
            </div>
          </div>
        </div>
      </section>

      <section id="counters" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>05</span>
          <h2>몇 + счётное слово</h2>
        </div>
        <p className={styles.secDesc}>
          몇 сам по себе не работает — сразу после него нужно счётное слово (для чего именно считаем).
        </p>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>몇 +</th>
                <th>считает</th>
                <th>пример</th>
              </tr>
            </thead>
            <tbody>
              {COUNTERS.map((c) => (
                <tr key={c.kr}>
                  <td>
                    <span className="kr">{c.kr}</span>
                    <span className={styles.rr}>{c.rr}</span>
                  </td>
                  <td>{c.meaning}</td>
                  <td className="kr">{c.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="style" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>06</span>
          <h2>Уровни вежливости в вопросе</h2>
        </div>
        <p className={styles.secDesc}>
          Вопрос строится на тех же окончаниях, что и утверждение — просто добавляется «?».
          Переключите стиль:
        </p>
        <FormalityToggle />
      </section>

      <section id="answers" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>07</span>
          <h2>Как отвечать</h2>
        </div>
        <p className={styles.secDesc}>
          Ответ — то же предложение, где 의문사 заменяется на нужную информацию. Порядок слов
          трогать не нужно.
        </p>
        <div className={styles.qaCard}>
          <div className={styles.qaLine}>
            <span className={`${styles.qaTag} ${styles.qaTagQ}`}>Q</span>
            <span>
              <span className="kr">디마 씨는 어디에 살아요?</span>{" "}
              <span className={styles.rr}>Dima ssi-neun eodie sarayo?</span>
            </span>
          </div>
          <div className={styles.qaLine}>
            <span className={`${styles.qaTag} ${styles.qaTagA}`}>A</span>
            <span>
              <span className="kr">서울에 살아요.</span> <span className={styles.rr}>Seoure sarayo.</span>
            </span>
          </div>
        </div>
        <div className={styles.qaCard}>
          <div className={styles.qaLine}>
            <span className={`${styles.qaTag} ${styles.qaTagQ}`}>Q</span>
            <span>
              <span className="kr">왜 한국어를 배워요?</span>{" "}
              <span className={styles.rr}>Wae hangugeoreul baewoyo?</span>
            </span>
          </div>
          <div className={styles.qaLine}>
            <span className={`${styles.qaTag} ${styles.qaTagA}`}>A</span>
            <span>
              <span className="kr">한국에서 살아서 배워요.</span>{" "}
              <span className={styles.rr}>Hangugeseo saraseo baewoyo.</span>
            </span>
          </div>
          <div className={styles.qaCallback}>
            ↳ причина оформлена через -아서 — этим окончанием обычно и отвечают на 왜
          </div>
        </div>
      </section>

      <section id="quiz" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>08</span>
          <h2>Тренажёр</h2>
        </div>
        <p className={styles.secDesc}>
          5 уровней, один за другим: от сопоставления слов с переводами до живых вопросов целиком.
          Каждый уровень можно проходить отдельно и пересдавать.
        </p>
        <QuestionsTrainer />
      </section>

      <section id="cheat" className={styles.section}>
        <div className={styles.secHead}>
          <span className={styles.secNum}>09</span>
          <h2>Шпаргалка</h2>
        </div>
        <div className={styles.cheat}>
          <h3>의문사 одной строкой</h3>
          <div className={styles.cheatGrid}>
            {CHEAT_ITEMS.map((item) => (
              <div key={item.kr} className={styles.cheatItem}>
                <span className="kr">{item.kr}</span>
                <span className={styles.cheatRr}>{item.rr}</span>
                <span className={styles.cheatRu}>{item.ru}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
