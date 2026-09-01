import "server-only";
import { getSignedAssetUrls } from "@/features/learning/assets";
import type { Block } from "@/features/learning/types";

const ASSET_PREFIX = "inha_book_1";

function assetPath(path: string): string {
  return `${ASSET_PREFIX}/${path}`;
}

/** Все файлы, которые понадобятся блокам страницы. */
function collectPaths(blocks: Block[]): string[] {
  const paths: string[] = [];
  for (const block of blocks) {
    if (block.type === "illustration" && block.storage_path) {
      paths.push(assetPath(block.storage_path));
    }
    if (block.type === "reference_table" && block.flags) {
      for (const flag of block.flags) {
        if (flag) paths.push(assetPath(flag));
      }
    }
    if (block.type === "phrase_gallery") {
      for (const item of block.items) {
        if (item.storage_path) paths.push(assetPath(item.storage_path));
      }
    }
    if (block.type === "text") {
      if (block.audio_id) {
        paths.push(assetPath(`audio/${block.audio_id}.mp3`));
      }
      if (block.illustration?.storage_path) {
        paths.push(assetPath(block.illustration.storage_path));
      }
    }
  }
  return paths;
}

// Подписываем все файлы страницы одним запросом к Storage: раньше на
// каждую иллюстрацию, флаг и аудио уходил отдельный запрос, и урок с
// галереей ждал десятки round-trip'ов.
export async function resolveBlockAssets(blocks: Block[]): Promise<Block[]> {
  const urls = await getSignedAssetUrls(collectPaths(blocks));
  const urlFor = (path: string | null | undefined) =>
    path ? (urls.get(assetPath(path)) ?? null) : null;

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
    return block;
  });
}
