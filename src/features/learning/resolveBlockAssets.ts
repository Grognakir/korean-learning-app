import "server-only";
import { getSignedAssetUrls } from "@/features/learning/assets";
import type { Block } from "@/features/learning/types";

function assetPath(assetPrefix: string, path: string): string {
  return `${assetPrefix}/${path}`;
}

// "inha-1" -> "inha_book_1" — та же схема именования папок в бакете
// textbook-assets, что использует scripts/import-textbook.ts при загрузке.
export function textbookAssetPrefix(textbookSlug: string): string {
  return textbookSlug.replace("-", "_book_");
}

/** Все файлы, которые понадобятся блокам страницы. */
function collectPaths(assetPrefix: string, blocks: Block[]): string[] {
  const paths: string[] = [];
  for (const block of blocks) {
    if (block.type === "illustration" && block.storage_path) {
      paths.push(assetPath(assetPrefix, block.storage_path));
    }
    if (block.type === "reference_table" && block.flags) {
      for (const flag of block.flags) {
        if (flag) paths.push(assetPath(assetPrefix, flag));
      }
    }
    if (block.type === "phrase_gallery") {
      for (const item of block.items) {
        if (item.storage_path) paths.push(assetPath(assetPrefix, item.storage_path));
      }
    }
    if (block.type === "text") {
      if (block.audio_id) {
        paths.push(assetPath(assetPrefix, `audio/${block.audio_id}.mp3`));
      }
      if (block.illustration?.storage_path) {
        paths.push(assetPath(assetPrefix, block.illustration.storage_path));
      }
    }
    if (block.type === "comprehension_exercise") {
      if (block.audio_id) {
        paths.push(assetPath(assetPrefix, `audio/${block.audio_id}.mp3`));
      }
      if (block.warmup?.illustration?.storage_path) {
        paths.push(assetPath(assetPrefix, block.warmup.illustration.storage_path));
      }
    }
    if (block.type === "pronunciation" && block.audio_id) {
      paths.push(assetPath(assetPrefix, `audio/${block.audio_id}.mp3`));
    }
  }
  return paths;
}

// Подписываем все файлы страницы одним запросом к Storage: раньше на
// каждую иллюстрацию, флаг и аудио уходил отдельный запрос, и урок с
// галереей ждал десятки round-trip'ов.
//
// assetPrefix — префикс пути в бакете textbook-assets для конкретного
// учебника (например "inha_book_1"), тот же, что использует
// scripts/import-textbook.ts при загрузке.
export async function resolveBlockAssets(
  blocks: Block[],
  assetPrefix: string,
): Promise<Block[]> {
  const urls = await getSignedAssetUrls(collectPaths(assetPrefix, blocks));
  const urlFor = (path: string | null | undefined) =>
    path ? (urls.get(assetPath(assetPrefix, path)) ?? null) : null;

  return blocks.map((block) => {
    if (block.type === "illustration" && block.storage_path) {
      return { ...block, imageUrl: urlFor(block.storage_path) };
    }
    if (block.type === "reference_table" && block.flags) {
      return { ...block, flagUrls: block.flags.map(urlFor) };
    }
    if (block.type === "phrase_gallery") {
      return {
        ...block,
        items: block.items.map((item) => ({
          ...item,
          imageUrl: urlFor(item.storage_path),
        })),
      };
    }
    if (block.type === "text") {
      return {
        ...block,
        audioUrl: block.audio_id
          ? urlFor(`audio/${block.audio_id}.mp3`)
          : null,
        illustration: block.illustration
          ? {
              ...block.illustration,
              imageUrl: urlFor(block.illustration.storage_path),
            }
          : block.illustration,
      };
    }
    if (block.type === "comprehension_exercise") {
      return {
        ...block,
        audioUrl: block.audio_id ? urlFor(`audio/${block.audio_id}.mp3`) : null,
        warmup: block.warmup
          ? {
              ...block.warmup,
              illustration: block.warmup.illustration
                ? {
                    ...block.warmup.illustration,
                    imageUrl: urlFor(block.warmup.illustration.storage_path),
                  }
                : block.warmup.illustration,
            }
          : block.warmup,
      };
    }
    if (block.type === "pronunciation") {
      return {
        ...block,
        audioUrl: block.audio_id ? urlFor(`audio/${block.audio_id}.mp3`) : null,
      };
    }
    return block;
  });
}
