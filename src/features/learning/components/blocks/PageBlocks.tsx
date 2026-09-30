import type { Block, HintBlock, VocabListBlock } from "@/features/learning/types";
import { vocabKeysInText, type VocabItem } from "./vocabHighlight";
import { LessonToc } from "./LessonToc";
import { TextBlock } from "./TextBlock";
import { VocabList } from "./VocabList";
import { Hint } from "./Hint";
import { Illustration } from "./Illustration";
import { ReferenceTable } from "./ReferenceTable";
import { PhraseGallery } from "./PhraseGallery";
import { GrammarPoint } from "./GrammarPoint";
import { GrammarExercise } from "./GrammarExercise";
import { ComprehensionExercise } from "./ComprehensionExercise";
import { WritingExercise } from "./WritingExercise";
import { Pronunciation } from "./Pronunciation";

function textIdsOnPage(blocks: Block[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    if (block.type === "text" && block.id) ids.add(block.id);
  }
  return ids;
}

function vocabByRelatedText(
  blocks: Block[],
  textIds: Set<string>,
): Map<string, VocabListBlock["items"]> {
  const map = new Map<string, VocabListBlock["items"]>();
  for (const block of blocks) {
    if (
      block.type === "vocab_list" &&
      block.related_text_ref &&
      textIds.has(block.related_text_ref)
    ) {
      map.set(block.related_text_ref, block.items);
    }
  }
  return map;
}

function allPageVocab(blocks: Block[]): VocabItem[] {
  return blocks
    .filter((block): block is VocabListBlock => block.type === "vocab_list")
    .flatMap((block) => block.items);
}

function hintsByRelatedText(
  blocks: Block[],
  textIds: Set<string>,
): Map<string, HintBlock> {
  const map = new Map<string, HintBlock>();
  for (const block of blocks) {
    if (
      block.type === "hint" &&
      block.related_text_ref &&
      textIds.has(block.related_text_ref)
    ) {
      map.set(block.related_text_ref, block);
    }
  }
  return map;
}

function blockTexts(block: Block): string[] {
  if (block.type === "text") return block.lines.map((line) => line.text);
  if (block.type === "grammar_point") return block.examples;
  if (block.type === "grammar_exercise") {
    return [
      ...block.example.dialogue,
      ...block.template,
      ...block.items.flatMap((item) => item.given),
    ];
  }
  return [];
}

function uniqueVocab(items: VocabItem[]): VocabItem[] {
  return items.filter(
    (item, index) => items.findIndex((candidate) => candidate.ko === item.ko) === index,
  );
}

function vocabForEachBlock(
  blocks: Block[],
  pageVocab: VocabItem[],
  vocabMap: Map<string, VocabListBlock["items"]>,
): VocabItem[][] {
  const seen = new Set<string>();

  return blocks.map((block) => {
    const candidates = uniqueVocab(
      block.type === "text"
        ? [
            ...(block.id ? (vocabMap.get(block.id) ?? []) : []),
            ...(block.vocab ?? []),
          ]
        : block.type === "grammar_exercise"
          ? [...pageVocab, ...(block.example.vocab ?? [])]
          : block.type === "grammar_point"
            ? [...pageVocab, ...(block.vocab ?? [])]
            : [],
    );
    const claimed = new Set<string>();

    for (const text of blockTexts(block)) {
      for (const key of vocabKeysInText(text, candidates)) {
        if (seen.has(key)) continue;
        seen.add(key);
        claimed.add(key);
      }
    }

    return candidates.filter((item) => claimed.has(item.ko));
  });
}

/** Тот же exercise_title, что печатает книга ("연습하기N"), — общий
 * ключ группировки и для grammar_exercise, и для text-блоков с
 * дополнительным заданием того же упражнения (см. TextBlock.exercise_title). */
function exerciseTitleOf(block: Block): string | null {
  if (block.type === "grammar_exercise") return block.exercise_title;
  if (block.type === "text" && block.exercise_title) return block.exercise_title;
  return null;
}

/** Когда несколько блоков подряд в разделе делят один и тот же
 * exercise_title (книга и правда печатает "연습하기2" один раз на оба
 * задания) — возвращает индекс "-1"/"-2"/... для КАЖДОГО такого блока, а
 * для уникальных заголовков — null (суффикс не нужен, дублей нет). Сам
 * exercise_title не трогаем (он источник-точный текст книги), суффикс
 * только для отображения. */
function exerciseTitleOccurrence(blocks: Block[]): (number | null)[] {
  const totals = new Map<string, number>();
  for (const block of blocks) {
    const title = exerciseTitleOf(block);
    if (title) totals.set(title, (totals.get(title) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return blocks.map((block) => {
    const title = exerciseTitleOf(block);
    if (!title || (totals.get(title) ?? 0) <= 1) return null;
    const next = (seen.get(title) ?? 0) + 1;
    seen.set(title, next);
    return next;
  });
}

/**
 * Список типов блоков открытый (docs/dev_docs/4-textbook-content-authoring.md) —
 * новые типы добавляются сюда тем же паттерном по мере появления в следующих
 * уроках.
 */
export function PageBlocks({
  blocks,
  textbookSlug,
  lessonNumber,
  blockTypeById,
}: {
  blocks: Block[];
  textbookSlug?: string;
  lessonNumber?: number;
  blockTypeById?: Record<string, Block["type"]>;
}) {
  const textIds = textIdsOnPage(blocks);
  const vocabMap = vocabByRelatedText(blocks, textIds);
  const hintMap = hintsByRelatedText(blocks, textIds);
  const pageVocab = allPageVocab(blocks);
  const blockVocab = vocabForEachBlock(blocks, pageVocab, vocabMap);
  const exerciseTitleIndex = exerciseTitleOccurrence(blocks);

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "lesson_toc":
            if (textbookSlug == null || lessonNumber == null || !blockTypeById) return null;
            return (
              <LessonToc
                key={i}
                block={block}
                textbookSlug={textbookSlug}
                lessonNumber={lessonNumber}
                blockTypeById={blockTypeById}
              />
            );
          case "text":
            return (
              <TextBlock
                key={i}
                id={block.id}
                block={block}
                vocabItems={blockVocab[i]}
                relatedHint={
                  block.id ? hintMap.get(block.id) : undefined
                }
                titleSuffix={exerciseTitleIndex[i]}
              />
            );
          case "vocab_list":
            return <VocabList key={i} id={block.id} block={block} />;
          case "hint":
            if (
              block.related_text_ref &&
              textIds.has(block.related_text_ref)
            ) {
              return null;
            }
            return <Hint key={i} id={block.id} block={block} />;
          case "illustration":
            return <Illustration key={i} id={block.id} block={block} />;
          case "reference_table":
            return <ReferenceTable key={i} id={block.id} block={block} />;
          case "phrase_gallery":
            return <PhraseGallery key={i} id={block.id} block={block} />;
          case "grammar_point":
            return <GrammarPoint key={i} id={block.id} block={block} vocabItems={blockVocab[i]} />;
          case "grammar_exercise":
            return (
              <GrammarExercise
                key={i}
                id={block.id}
                block={block}
                vocabItems={blockVocab[i]}
                titleSuffix={exerciseTitleIndex[i]}
                textbookSlug={textbookSlug}
                lessonNumber={lessonNumber}
              />
            );
          case "comprehension_exercise":
            return <ComprehensionExercise key={i} id={block.id} block={block} />;
          case "writing_exercise":
            return <WritingExercise key={i} id={block.id} block={block} />;
          case "pronunciation":
            return <Pronunciation key={i} id={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
