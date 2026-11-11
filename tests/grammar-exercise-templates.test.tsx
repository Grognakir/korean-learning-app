import { cleanup, fireEvent, render } from "@testing-library/react";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { PageBlocks } from "@/features/learning/components/blocks/PageBlocks";
import type { Block, GrammarExerciseBlock } from "@/features/learning/types";

afterEach(cleanup);

const root = join(process.cwd(), "content/reference/inha_book_content");

function loadExercises() {
  const found: { where: string; block: GrammarExerciseBlock }[] = [];
  for (const dir of readdirSync(root)) {
    if (!statSync(join(root, dir)).isDirectory()) continue;
    for (const file of readdirSync(join(root, dir))) {
      if (!/^0[12]-.*\.json$/.test(file)) continue;
      const data = JSON.parse(readFileSync(join(root, dir, file), "utf-8")) as {
        pages: { blocks: Block[] }[];
      };
      for (const page of data.pages)
        for (const block of page.blocks)
          if (block.type === "grammar_exercise")
            found.push({ where: `${dir}/${file}#${block.id}`, block });
    }
  }
  return found;
}

const blankIndexes = (template: string[]) =>
  [...new Set(template.flatMap((line) => [...line.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]))))].sort(
    (a, b) => a - b,
  );

it("у каждого пункта пропуски шаблона идут подряд и совпадают с ответами и вариантами", () => {
  const problems: string[] = [];
  for (const { where, block } of loadExercises()) {
    block.items.forEach((item, i) => {
      const template = item.template ?? block.template;
      const indexes = blankIndexes(template);
      const expected = Array.from({ length: item.answers.length }, (_, k) => k);
      if (JSON.stringify(indexes) !== JSON.stringify(expected)) problems.push(`${where} #${i + 1}: пропуски ${indexes} / ответов ${item.answers.length}`);
      for (const alt of item.alternatives ?? [])
        if (alt.length !== item.answers.length) problems.push(`${where} #${i + 1}: длина варианта`);
    });
  }
  expect(problems).toEqual([]);
});

it("в 2급 14과 «준비하기 1» шаблоны чистые: в них только пропуски, пробелы и знаки", () => {
  const dirty: string[] = [];
  for (const { where, block } of loadExercises()) {
    if (!where.startsWith("2급_lesson_14/01-preparation-1.json")) continue;
    for (const line of [...block.template, ...block.items.flatMap((item) => item.template ?? [])]) {
      const text = line.replace(/^[가나]:/, "").replace(/\{\d+\}/g, "").replace(/[\s.,?!/]/g, "");
      if (text) dirty.push(`${where}: ${line}`);
    }
  }
  expect(dirty).toEqual([]);
});

it("основной ответ и варианты из учебных данных засчитываются в интерфейсе", () => {
  const sample = loadExercises().find(({ where }) => where === "2급_lesson_14/01-preparation-1.json#exercise-1d");
  expect(sample).toBeTruthy();
  const block = sample!.block;
  const item = block.items[0];
  const variants = [item.answers, ...(item.alternatives ?? [])];
  expect(variants).toHaveLength(4);
  for (const variant of variants) {
    const { container, getByText, unmount } = render(<PageBlocks blocks={[block]} />);
    fireEvent.click(getByText(item.given.join(" / ")));
    const inputs = [...container.querySelectorAll("input")];
    expect(inputs).toHaveLength(variant.length);
    inputs.forEach((input, k) => fireEvent.change(input, { target: { value: variant[k] } }));
    fireEvent.click(getByText("Проверить"));
    expect(container.textContent).toContain("✓ Верно!");
    unmount();
  }
});

it("ответы каждого пункта всех уроков засчитываются в интерфейсе", () => {
  const failures: string[] = [];
  for (const { where, block } of loadExercises()) {
    const { container, getByText, unmount } = render(<PageBlocks blocks={[block]} />);
    block.items.forEach((item, i) => {
      const buttons = [...container.querySelectorAll("button")].filter((el) =>
        el.textContent?.includes(item.given.join(" / ")),
      );
      if (!buttons.length) {
        failures.push(`${where} #${i + 1}: нет кнопки пункта`);
        return;
      }
      fireEvent.click(buttons[0]);
      const order = (item.template ?? block.template).flatMap((line) =>
        [...line.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])),
      );
      for (const variant of [item.answers, ...(item.alternatives ?? [])]) {
        const inputs = [...container.querySelectorAll("input")];
        if (inputs.length !== order.length) {
          failures.push(`${where} #${i + 1}: полей ${inputs.length}, пропусков ${order.length}`);
          return;
        }
        inputs.forEach((input, k) => fireEvent.change(input, { target: { value: variant[order[k]] } }));
        fireEvent.click(getByText("Проверить"));
        if (!container.textContent?.includes("✓ Верно!")) failures.push(`${where} #${i + 1}: ответ не засчитан`);
      }
    });
    unmount();
  }
  expect(failures).toEqual([]);
}, 120000);
