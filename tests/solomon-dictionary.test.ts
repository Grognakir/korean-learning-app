import { beforeEach, describe, expect, it } from "vitest";
import { createOsStore } from "@/features/solomonOs/store";
import { deleteEntry, emptyDictionary, findDuplicate, koreanVariants, MAX_WORDS, normalizeKorean, putEntry, readDictionary, recordAnswer, russianVariants, saveAnswer, searchWords, subscribeDictionary, trainableWords, writeDictionary, type DictionaryData, type DictionaryEntry } from "@/features/solomonOs/dictionary/entries";
import { answerText, cardChoices, checkKoreanAnswer, type CardMode } from "@/features/solomonOs/dictionary/answers";
import { answerCard, nextCard, repeatCards, scopedWords, startCards, stopCards } from "@/features/solomonOs/dictionary/session";
import { dictionaryTopic } from "@/features/solomonOs/dictionary/topic";
import { checkAnswer } from "@/features/solomonOs/wordTrainer/quiz";
import { APPS } from "@/features/solomonOs/apps";
import { compute, gridGeometry, withApps, type GridModel } from "@/features/solomonOs/iconGrid";

const entry = (id: string, ko = "사과", ru = "яблоко"): DictionaryEntry => ({ id, ko, ru, createdAt: 1, updatedAt: 1, ok: 0, fail: 0 });
const words = [entry("a"), entry("b", "학교/학교에", "школа; учебное заведение"), entry("c", "집", "дом"), entry("d", "물", "вода"), entry("e", "책", "книга")];
const data: DictionaryData = { v: 1, words };
beforeEach(() => localStorage.clear());

describe("Личные слова: валидация и хранение", () => {
  it("начинается пустым, разбирает варианты, сохраняя запятые в скобках", () => {
    expect(readDictionary(createOsStore())).toEqual(emptyDictionary());
    expect(russianVariants(" красный, красного цвета; надевать (обувь, носки); ;")).toEqual(["красный", "красного цвета", "надевать (обувь, носки)"]);
    expect(russianVariants("вещь (одна (два, три), четыре), предмет")).toEqual(["вещь (одна (два, три), четыре)", "предмет"]);
    expect(koreanVariants(" 학교 / 학교에 /학교 ")).toEqual(["학교", "학교에"]);
  });
  it("нормализует NFC, пробелы и регистр для дублей, включая варианты", () => {
    expect(normalizeKorean(" 학 校 A ")).toBe(normalizeKorean("학校a"));
    expect(findDuplicate([entry("a", "학 교/A학교")], "학교")).toBeTruthy();
    expect(findDuplicate([entry("a", "학교/a학교")], "A학교/집")?.id).toBe("a");
    expect(findDuplicate([entry("a")], "사 과", "a")).toBeUndefined();
  });
  it.each([
    ["apple", "яблоко", "korean"], ["사과", "사과", "translation"], ["가".repeat(61), "яблоко", "koLength"], ["사과", "я".repeat(121), "ruLength"],
  ])("отклоняет %s / %s", (ko, ru, error) => expect(putEntry(emptyDictionary(), { ko, ru }).error).toBe(error));
  it("добавляет без перевода, убирает лишние пробелы, правит без потери статистики", () => {
    const result = putEntry(emptyDictionary(), { ko: " 학교  에 ", ru: " " }, 10, "id");
    expect(result.entry).toEqual({ ...entry("id", "학교 에", ""), createdAt: 10, updatedAt: 10 });
    expect(trainableWords(result.data)).toEqual([]);
    const counted = recordAnswer(result.data, "id", false, 11);
    const edited = putEntry(counted, { id: "id", ko: "학교", ru: "  учебное   заведение " }, 12);
    expect(edited.entry).toMatchObject({ id: "id", ru: "учебное заведение", fail: 1, ok: 0, createdAt: 10, updatedAt: 12, lastAt: 11 });
    expect(trainableWords(edited.data)).toHaveLength(1);
    expect(deleteEntry(edited.data, "id").words).toEqual([]);
    expect(putEntry(edited.data, { id: "gone", ko: "학교", ru: "школа" }).error).toBe("missing");
  });
  it("дубль возвращает существующую запись, не меняет данные", () => {
    const result = putEntry(data, { ko: "학교에", ru: "у школы" });
    expect(result.error).toBe("duplicate");
    expect(result.duplicate?.id).toBe("b");
    expect(result.data).toBe(data);
  });
  it("при 2000 словах блокирует добавление, разрешает правку", () => {
    const full: DictionaryData = { v: 1, words: Array.from({ length: MAX_WORDS }, (_, i) => entry(String(i), `단어${i}`)) };
    expect(putEntry(full, { ko: "새", ru: "новый" }).error).toBe("full");
    expect(putEntry(full, { id: "0", ko: "새", ru: "новый" }).error).toBeUndefined();
  });
  it("ищет по двум языкам, сортирует, отбирает только сложные", () => {
    expect(searchWords(data, "ШКОЛА", "new").map((w) => w.id)).toEqual(["b"]);
    expect(searchWords(data, "학교", "alpha").map((w) => w.id)).toEqual(["b"]);
    expect(searchWords({ v: 1, words: [entry("a"), { ...entry("b", "가"), createdAt: 2 }] }, "", "new")[0].id).toBe("b");
    expect(searchWords({ v: 1, words: [entry("a", "나"), entry("b", "가")] }, "", "alpha")[0].id).toBe("b");
    const hard: DictionaryData = { v: 1, words: [{ ...words[0], ok: 1, fail: 2 }, { ...words[1], ok: 1, fail: 1 }, { ...words[2], ru: "", fail: 3 }] };
    expect(scopedWords(hard, "hard").map((w) => w.id)).toEqual(["a"]);
  });
  it("уведомляет окна, обновляет статистику по свежим данным, изолирует аккаунты", () => {
    const a = createOsStore("dict-a", false), b = createOsStore("dict-b", false);
    let calls = 0;
    const unsubscribe = subscribeDictionary(a, () => calls++);
    writeDictionary(a, data);
    saveAnswer(a, "a", true, 4); saveAnswer(a, "a", false, 5);
    expect(readDictionary(a).words[0]).toMatchObject({ ok: 1, fail: 1, lastAt: 5 });
    expect(readDictionary(b).words).toEqual([]);
    expect(calls).toBe(3);
    saveAnswer(a, "deleted", true); expect(calls).toBe(3);
    unsubscribe(); saveAnswer(a, "a", true); expect(calls).toBe(3);
  });
  it("повреждённое хранилище не ломает приложение", () => {
    const store = createOsStore();
    store.save("dictionary", { v: 2, words }); expect(readDictionary(store).words).toEqual([]);
    store.save("dictionary", { v: 1, words: [null, { id: "bad" }, words[0], words[0]] });
    expect(readDictionary(store).words).toEqual([words[0]]);
  });
});

describe("Ответы и карточки", () => {
  it.each(["ko-ru", "ru-ko"] as CardMode[])("%s: уникальные варианты для двух и пяти слов", (mode) => {
    for (const pool of [words.slice(0, 2), words]) for (const word of pool) {
      const choices = cardChoices(pool, word, mode, () => .3);
      expect(choices).toHaveLength(Math.min(4, pool.length));
      expect(new Set(choices).size).toBe(choices.length);
      expect(choices.filter((value) => value === answerText(word, mode))).toHaveLength(1);
    }
    expect(cardChoices([words[0], entry("copy"), words[1]], words[0], mode)).toHaveLength(2);
  });
  it("корейский: варианты, NFC и пробелы, без допуска опечатки", () => {
    expect(checkKoreanAnswer(words[1], " 학 교 에 ")).toBe(true);
    expect(checkKoreanAnswer(words[1], "학교")).toBe(true);
    expect(checkKoreanAnswer(words[1], "학고")).toBe(false);
    expect(checkKoreanAnswer(words[1], "")).toBe(false);
  });
  it("русский из словаря использует общую проверку и все варианты", () => {
    const topic = dictionaryTopic(data);
    expect(checkAnswer(topic.words[1], "Учебное заведение!")).toBe("exact");
    expect(checkAnswer(topic.words[0], "яблако")).toBe("typo");
    expect(topic.document[0].groups[0].rows.map((row) => row.id)).toEqual(words.map((w) => w.id));
  });
  it("один ввод / два слова выбора, круг по разу, итог и повторы", () => {
    expect(startCards(words.slice(0, 1), "ko-ru")).toBeNull();
    expect(startCards(words.slice(0, 1), "typing")).toBeTruthy();
    let session = startCards(words, "ru-ko", () => .2)!;
    expect(new Set(session.words.map((w) => w.id)).size).toBe(words.length);
    const initial = session.words.map((w) => w.id), failed = initial[0];
    for (let i = 0; i < words.length; i++) {
      const answer = i === 0 ? session.choices.find((v) => v !== answerText(session.words[i], session.mode))! : answerText(session.words[i], session.mode);
      session = answerCard(session, answer);
      expect(answerCard(session, answer)).toBe(session);
      session = nextCard(session, () => .2);
    }
    expect(session).toMatchObject({ phase: "done", correct: 4, answered: 5, errors: [failed] });
    const retry = repeatCards(session, true)!;
    expect(retry.words.map((w) => w.id)).toEqual([failed]);
    expect(retry.choices.length).toBe(4);
    const repeated = repeatCards(session, false, () => .8)!;
    expect(new Set(repeated.words.map((w) => w.id))).toEqual(new Set(initial));
    expect(repeated).toMatchObject({ correct: 0, answered: 0, errors: [] });
  });
  it("закончить можно до ответа и во время результата; копия независима от исходных слов", () => {
    const pool = words.map((word) => ({ ...word }));
    const session = startCards(pool, "typing", () => .2)!;
    const original = session.words.map((w) => w.ko);
    pool.forEach((w) => { w.ko = "변경"; });
    expect(session.words.map((w) => w.ko)).toEqual(original);
    expect(stopCards(session)).toMatchObject({ phase: "done", answered: 0 });
    expect(nextCard(session)).toBe(session);
    expect(stopCards(answerCard(session, answerText(session.words[0], "typing")))).toMatchObject({ phase: "done", answered: 1, correct: 1 });
  });
});

it("новая иконка словаря не сдвигает сохранённые иконки", () => {
  const model: GridModel = [{ y: 0, ay: "t", left: [{ id: "msg", gap: 1 }], right: [{ id: "notes", gap: 0 }] }];
  const geometry = gridGeometry(900, 600, 92, 96);
  const before = compute(model, geometry);
  const next = compute(withApps(model, ["msg", "notes", "dict"], geometry.rows), geometry);
  expect(next.msg).toEqual(before.msg); expect(next.notes).toEqual(before.notes);
  expect(next.dict).toBeTruthy();
  expect(APPS.find((app) => app.id === "dict")).toMatchObject({ w: 860, h: 640, minW: 360, minH: 440 });
});
