"""Cut approved clothing masks and build a four-outfit contact sheet.

Run from any directory with Python, Pillow and numpy installed.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public/images/clothing-game"
SOURCES = ART / "test/clothes"
MASKS = ART / "test2/masks"
LAYERS = ART / "test2/layers"
SIZE = (1024, 1536)
ITEMS = ("pants", "shirt", "tie", "jacket", "shoes", "glasses")
EXPRESSIONS = ("base", "base_blink", "base_happy", "base_oops")
MAGENTA = np.array([255, 0, 255], dtype=np.int16)


def read_rgb(path):
    image = Image.open(path).convert("RGB")
    if image.size != SIZE:
        raise ValueError(f"Unexpected size: {path}: {image.size}")
    return np.array(image)


def smooth_alpha(mask):
    image = Image.fromarray(mask.astype(np.uint8) * 255)
    alpha = np.array(image.filter(ImageFilter.GaussianBlur(0.35)))
    alpha[alpha <= 1] = 0
    alpha[alpha >= 254] = 255
    return alpha


def edge_colors(rgb, mask, alpha):
    colors = rgb.copy()
    known = mask.copy()
    for _ in range(2):
        missing = (alpha > 0) & ~known
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0),
                       (1, 1), (1, -1), (-1, 1), (-1, -1)):
            available = np.roll(known, (dy, dx), axis=(0, 1)) & missing
            shifted = np.roll(colors, (dy, dx), axis=(0, 1))
            colors[available] = shifted[available]
            known[available] = True
            missing[available] = False
    inner_edge = mask & (alpha > 0) & (alpha < 255)
    coverage = alpha[inner_edge, None].astype(float) / 255
    colors[inner_edge] = np.clip(
        (colors[inner_edge].astype(float) - 255 * (1 - coverage)) / coverage,
        0, 255,
    ).round().astype(np.uint8)
    colors[alpha == 0] = 0
    return colors


def save_layer(name, source, mask, grayscale=False):
    alpha = smooth_alpha(mask)
    colors = edge_colors(source, mask, alpha)
    if grayscale:
        gray = np.rint(colors @ np.array([0.299, 0.587, 0.114])).astype(np.uint8)
        colors = np.repeat(gray[:, :, None], 3, axis=2)
    colors[alpha == 0] = 0
    rgba = np.dstack((colors, alpha))
    Image.fromarray(rgba).save(LAYERS / f"{name}.png", optimize=True)
    assert not rgba[alpha == 0, :3].any()
    assert rgba.shape == (1536, 1024, 4)
    assert not alpha[:8].any() and not alpha[-8:].any()
    assert not alpha[:, :8].any() and not alpha[:, -8:].any()
    print(f"OK layer {name}: RGBA 1024x1536; transparent RGB=0")
    return rgba


def base_silhouette(base):
    white = base.min(axis=2) >= 248
    protected_face = np.zeros(white.shape, dtype=bool)
    protected_face[115:215, 450:565] = True
    background = white & ~protected_face
    flood = Image.fromarray(white.astype(np.uint8) * 255).copy()
    for seed in ((0, 0), (1023, 0), (0, 1535), (1023, 1535), (650, 530)):
        if flood.getpixel(seed) == 255:
            ImageDraw.floodfill(flood, seed, 128)
    background |= np.array(flood) == 128
    silhouette = ~background
    assert not silhouette[530, 650], "Enclosed arm gap must be transparent"
    return silhouette


def tint(layer, color):
    result = layer.copy()
    if color is not None:
        rgb = np.array([int(color[i:i + 2], 16) for i in (1, 3, 5)])
        result[:, :, :3] = np.rint(layer[:, :, :3].astype(float) * rgb / 255).astype(np.uint8)
    return Image.fromarray(result)


def build_preview(layers):
    outfits = (
        dict(pants="#3A3A40", shirt="#FFFFFF", tie="#D9443B",
             jacket="#3A3A40", shoes="#5A3A22", glasses=None),
        dict(pants="#9B9A9F", shirt="#9EC5E8", tie="#1F2F5C",
             jacket="#1F2F5C", shoes="#2E2D31"),
        dict(pants="#8B5A33", shirt="#F1C232", tie="#4F9A5A", shoes="#FFFFFF"),
        dict(pants="#3F6FC6", shirt="#F29BB5", glasses=None),
    )
    preview = Image.new("RGB", (4096, 1536), "#FAF6EE")
    for index, outfit in enumerate(outfits):
        frame = Image.new("RGBA", SIZE, "#FAF6EE")
        frame.alpha_composite(Image.fromarray(layers["base"]))
        for item in ITEMS:
            if item in outfit:
                frame.alpha_composite(tint(layers[item], outfit[item]))
        preview.paste(frame.convert("RGB"), (index * 1024, 0))
    preview.save(ART / "test2/preview.png", optimize=True)
    print("OK preview: 4096x1536, four outfits, multiply colors, requested layer order")


def main():
    LAYERS.mkdir(parents=True, exist_ok=True)
    base = read_rgb(ART / "test2/base.png")
    silhouette = base_silhouette(base)
    layers = {}
    for name in EXPRESSIONS:
        layers[name] = save_layer(name, read_rgb(ART / f"test2/{name}.png"), silhouette)
    for name in ITEMS:
        source = read_rgb(SOURCES / f"{name}.png")
        marked = read_rgb(MASKS / f"{name}_mask.png")
        mask = np.abs(marked.astype(np.int16) - MAGENTA).max(axis=2) <= 40
        if not mask.any():
            raise ValueError(f"Empty mask: {name}")
        if mask[0].any() or mask[-1].any() or mask[:, 0].any() or mask[:, -1].any():
            raise ValueError(f"Mask includes the canvas border: {name}")
        if not np.array_equal(marked[~mask], source[~mask]):
            raise ValueError(f"Pixels outside the mask changed: {name}")
        if not (marked[mask] == MAGENTA).all():
            raise ValueError(f"Mask fill must be flat #FF00FF: {name}")
        print(f"OK mask {name}: flat #FF00FF; outside pixels identical")
        layers[name] = save_layer(name, source, mask, grayscale=name != "glasses")
    build_preview(layers)


if __name__ == "__main__":
    main()
