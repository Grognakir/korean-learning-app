"use client";

import { useRouter } from "next/navigation";
import { MultiSelect } from "@/components/ui/Select";

export function CategorySelect({
  categories,
  selectedIds,
}: {
  categories: { id: string; name: string }[];
  selectedIds: string[];
}) {
  const router = useRouter();

  return (
    <MultiSelect
      values={selectedIds}
      options={categories.map((category) => ({
        value: category.id,
        label: category.name,
      }))}
      placeholder="Все категории"
      aria-label="Категории"
      onChange={(ids) => {
        router.push(
          ids.length
            ? `/learning/trainers/flashcards?categories=${ids.join(",")}`
            : "/learning/trainers/flashcards",
        );
      }}
    />
  );
}
