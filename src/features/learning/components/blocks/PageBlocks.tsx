import type { Block, HintBlock, VocabListBlock } from "@/features/learning/types";
import { LessonToc } from "./LessonToc";
import { TextBlock } from "./TextBlock";
import { VocabList } from "./VocabList";
import { Hint } from "./Hint";
import { Illustration } from "./Illustration";
import { ReferenceTable } from "./ReferenceTable";
import { PhraseGallery } from "./PhraseGallery";
import { GrammarPoint } from "./GrammarPoint";
import { GrammarExercise } from "./GrammarExercise";

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

/**
 * Список типов блоков открытый (docs/dev_docs/4-textbook-content-authoring.md) —
 * новые типы добавляются сюда тем же паттерном по мере появления в следующих
 * уроках.
 */
export function PageBlocks({
  blocks,
  lessonNumber,
  blockTypeById,
}: {
  blocks: Block[];
  lessonNumber?: number;
  blockTypeById?: Record<string, Block["type"]>;
}) {
  const textIds = textIdsOnPage(blocks);
  const vocabMap = vocabByRelatedText(blocks, textIds);
  const hintMap = hintsByRelatedText(blocks, textIds);

  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "lesson_toc":
            if (lessonNumber == null || !blockTypeById) return null;
            return (
              <LessonToc
                key={i}
                block={block}
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
                vocabItems={
                  block.id ? vocabMap.get(block.id) : undefined
                }
                relatedHint={
                  block.id ? hintMap.get(block.id) : undefined
                }
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
            return <GrammarPoint key={i} id={block.id} block={block} />;
          case "grammar_exercise":
            return <GrammarExercise key={i} id={block.id} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
