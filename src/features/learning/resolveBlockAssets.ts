import "server-only";
import { getSignedAssetUrl } from "@/features/learning/assets";
import type { Block } from "@/features/learning/types";

const ASSET_PREFIX = "inha_book_1";

export async function resolveBlockAssets(blocks: Block[]): Promise<Block[]> {
  return Promise.all(
    blocks.map(async (block) => {
      if (block.type === "illustration" && block.storage_path) {
        const imageUrl = await getSignedAssetUrl(
          `${ASSET_PREFIX}/${block.storage_path}`,
        );
        return { ...block, imageUrl };
      }
      if (block.type === "text") {
        const [audioUrl, illustrationImageUrl] = await Promise.all([
          block.audio_id
            ? getSignedAssetUrl(`${ASSET_PREFIX}/audio/${block.audio_id}.mp3`)
            : Promise.resolve(null),
          block.illustration?.storage_path
            ? getSignedAssetUrl(
                `${ASSET_PREFIX}/${block.illustration.storage_path}`,
              )
            : Promise.resolve(null),
        ]);
        return {
          ...block,
          audioUrl,
          illustration: block.illustration
            ? { ...block.illustration, imageUrl: illustrationImageUrl }
            : block.illustration,
        };
      }
      return block;
    }),
  );
}
