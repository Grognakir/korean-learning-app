import { BookIcon } from "@/components/icons/BookIcon";
import { TopicsIcon } from "@/components/icons/TopicsIcon";
import { DictionaryIcon } from "@/components/icons/DictionaryIcon";
import { ChartIcon } from "@/components/icons/ChartIcon";
import type { TabSection } from "@/components/ui/BottomTabBar";

export const NAV_SECTIONS: TabSection[] = [
  { label: "Обучение", icon: BookIcon, href: "/learning" },
  { label: "Темы", icon: TopicsIcon, href: "/topics" },
  { label: "Словарь", icon: DictionaryIcon, href: "/dictionary" },
  { label: "Прогресс", icon: ChartIcon },
];
