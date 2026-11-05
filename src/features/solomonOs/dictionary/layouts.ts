export const DICTIONARY_LAYOUTS = [
  { id: "explorer", name: "Проводник", detail: "Коллекции и отдельный редактор" },
  { id: "table", name: "Таблица", detail: "Компактная таблица, формы в модалке" },
  { id: "tiles", name: "Карточки", detail: "Сетка слов, редактор по нажатию" },
  { id: "groups", name: "Группы", detail: "Колонки своих коллекций" },
  { id: "reference", name: "Справочник", detail: "Список и отдельная карточка записи" },
  { id: "capture", name: "Быстрый ввод", detail: "Быстрый ввод в отдельной форме" },
  { id: "overview", name: "Обзор", detail: "Сводка, группы и последние записи" },
] as const;
export type DictionaryLayout = (typeof DICTIONARY_LAYOUTS)[number]["id"] | "catalog";
