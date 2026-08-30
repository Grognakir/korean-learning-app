import { BookIcon } from "@/components/icons/BookIcon";
import { DictionaryIcon } from "@/components/icons/DictionaryIcon";
import { ChartIcon } from "@/components/icons/ChartIcon";
import type { TabSection } from "@/components/ui/BottomTabBar";

export const NAV_SECTIONS: TabSection[] = [
  { label: "Обучение", icon: BookIcon, href: "/learning" },
  { label: "Словарь", icon: DictionaryIcon, href: "/dictionary" },
  { label: "Прогресс", icon: ChartIcon },
];
