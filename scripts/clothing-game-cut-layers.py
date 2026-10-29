"""Cut clothing masks and catalog icons and build a diagnostic contact sheet.

Run from any directory with Python, Pillow and numpy installed.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / "public/images/clothing-game"
STACK = ART / "test2/stack"
MASKS = ART / "test2/masks"
LAYERS = ART / "test2/layers"
ICONS = ART / "test2/icons"
SIZE = (1024, 1536)
ITEMS = ("shoes", "pants", "shirt", "tie", "jacket", "glasses")
STAGES = dict(pants=1, shoes=2, shirt=3, tie=4, jacket=5, glasses=6)
EXPRESSIONS = ("base", "base_blink", "base_happy", "base_oops")
MAGENTA = np.array([255, 0, 255], dtype=np.int16)


def read_rgb(path):
    image = Image.open(path).convert("RGB")
    if image.size != SIZE:
        raise ValueError(f"Unexpected size: {path}: {image.size}")
    return np.array(image)


def dilate(mask, pixels=1):
    return np.array(Image.fromarray(mask.astype(np.uint8) * 255).filter(
        ImageFilter.MaxFilter(2 * pixels + 1))) > 0


def erode(mask, pixels=1):
    return np.array(Image.fromarray(mask.astype(np.uint8) * 255).filter(
        ImageFilter.MinFilter(2 * pixels + 1))) > 0


def exterior_background(source):
    white = source.min(axis=2) >= 248
    image = Image.fromarray(white.astype(np.uint8) * 255).copy()
    for seed in ((0, 0), (1023, 0), (0, 1535), (1023, 1535), (650, 530)):
        if image.getpixel(seed) == 255:
            ImageDraw.floodfill(image, seed, 128)
    return np.array(image) == 128


def read_mask(name, source):
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
    return mask


def complete_clothing(name, source, mask, palm):
    if name == "glasses":
        return source
    colors = source.copy()
    values = source.astype(np.int16)
    warm = (values[:, :, 0] > values[:, :, 1] + 18) & (
        values[:, :, 1] > values[:, :, 2] + 10)
    hand_region = np.zeros(mask.shape, dtype=bool)
    hand_region[568:685, 503:675] = True
    hidden = mask & dilate((warm & hand_region) | palm, 4)
    if name not in ("pants", "shirt", "jacket"):
        hidden[:] = False
    colors[hidden] = 255
    colors[hidden & ~erode(mask)] = 20
    background = exterior_background(source)
    neutral = values.max(axis=2) - values.min(axis=2) < 25
    invalid = mask & (background | ~neutral) & ~hidden
    known = mask & ~invalid
    propagation = dilate(mask, 4)
    for _ in range(40):
        if not (mask & ~known).any():
            break
        missing = propagation & ~known
        previous = known.copy()
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0),
                       (1, 1), (1, -1), (-1, 1), (-1, -1)):
            take = np.roll(previous, (dy, dx), axis=(0, 1)) & missing
            shifted = np.roll(colors, (dy, dx), axis=(0, 1))
            colors[take] = shifted[take]
            known[take] = True
            missing[take] = False
    if (mask & ~known).any():
        raise ValueError(f"Unresolved hidden fabric: {name}")
    if name != "glasses":
        colors[mask & ~erode(mask, 2)] = 20
    colors[~mask] = source[~mask]
    Image.fromarray(colors).save(STACK / f"stack_{STAGES[name]}_cloth.png", optimize=True)
    return colors


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
    if name in ("hand_front", "hand_palm"):
        values = colors.astype(np.int16)
        warm = (values[:, :, 0] > values[:, :, 1] + 18) & (
            values[:, :, 1] > values[:, :, 2] + 10)
        colors[(alpha > 0) & ~warm] = 18
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
        dict(pants="#3F6FC6"),
        dict(shoes="#6B4A2B"),
        dict(shirt="#F29BB5"),
        dict(tie="#4F9A5A"),
        dict(jacket="#2F3B52"),
        dict(glasses=None),
        dict(pants="#8B5A33", shirt="#F1C232", shoes="#FFFFFF"),
        dict(pants="#3A3A40", shirt="#F1C232", tie="#D9443B",
             jacket="#1F2F5C", shoes="#5A3A22", glasses=None),
    )
    preview = Image.new("RGB", (4096, 4608), "#FAF6EE")
    for index, outfit in enumerate(outfits):
        frame = Image.new("RGBA", SIZE, "#FAF6EE")
        frame.alpha_composite(Image.fromarray(layers["base"]))
        for item in ITEMS:
            if item in outfit:
                frame.alpha_composite(tint(layers[item], outfit[item]))
        frame.alpha_composite(Image.fromarray(layers["hand_palm"]))
        preview.paste(frame.convert("RGB"), ((index % 4) * 1024, (index // 4) * 1536))
    frame = Image.new("RGBA", SIZE, "#FAF6EE")
    frame.alpha_composite(Image.fromarray(layers["base"]))
    outfit = dict(pants="#3A3A40", shirt="#F1C232", tie="#D9443B",
                  jacket="#1F2F5C", shoes="#5A3A22", glasses=None)
    for item in ITEMS:
        frame.alpha_composite(tint(layers[item], outfit[item]))
    frame.alpha_composite(Image.fromarray(layers["hand_palm"]))
    close = frame.crop((490, 555, 705, 695)).resize((1290, 840), Image.Resampling.LANCZOS)
    preview.paste(close.convert("RGB"), (32, 3140))
    shirt = Image.new("RGBA", SIZE, "#FAF6EE")
    shirt.alpha_composite(Image.fromarray(layers["base"]))
    shirt.alpha_composite(tint(layers["pants"], "#8B5A33"))
    shirt.alpha_composite(tint(layers["shirt"], "#F1C232"))
    shirt.alpha_composite(Image.fromarray(layers["hand_palm"]))
    detail = shirt.crop((340, 570, 680, 745)).resize((1836, 945), Image.Resampling.LANCZOS)
    preview.paste(detail.convert("RGB"), (1500, 3100))
    colors = dict(shirt="#F1C232", pants="#3F6FC6", tie="#D9443B",
                  jacket="#4F9A5A", shoes="#8B5A33", glasses=None)
    for i, name in enumerate(("shirt", "pants", "tie", "jacket", "shoes", "glasses")):
        icon = np.array(Image.open(ICONS / "cut" / f"{name}.png").convert("RGBA"))
        preview.paste(tint(icon, colors[name]), (128 + i * 640, 4096), tint(icon, colors[name]))
    preview.save(ART / "test2/preview.png", optimize=True)
    print("OK preview: eight outfits, yellow-shirt hand/hem closeups, six recolored icons")


def cut_icons():
    (ICONS / "cut").mkdir(parents=True, exist_ok=True)
    for name in ITEMS:
        source = np.array(Image.open(ICONS / f"{name}.png").convert("RGB"))
        marked = np.array(Image.open(ICONS / f"{name}_mask.png").convert("RGB"))
        assert source.shape == marked.shape == (512, 512, 3)
        mask = (marked == MAGENTA).all(axis=2)
        assert mask.any() and np.array_equal(source[~mask], marked[~mask])
        assert (source[:8] == 255).all() and (source[-8:] == 255).all()
        assert (source[:, :8] == 255).all() and (source[:, -8:] == 255).all()
        alpha = smooth_alpha(mask)
        colors = edge_colors(source, mask, alpha)
        colors[(alpha > 0) & ~erode(mask)] = 18
        if name != "glasses":
            gray = np.rint(colors @ np.array([0.299, 0.587, 0.114])).astype(np.uint8)
            colors = np.repeat(gray[:, :, None], 3, axis=2)
        colors[alpha == 0] = 0
        Image.fromarray(np.dstack((colors, alpha))).save(ICONS / "cut" / f"{name}.png", optimize=True)
        assert not colors[alpha == 0].any()
        print(f"OK icon {name}: RGB/mask 512x512 white background; RGBA cut; transparent RGB=0")


def validate_coverage(layers, base):
    values = base.astype(np.int16)
    skin = (values[:, :, 0] > values[:, :, 1] + 18) & (
        values[:, :, 1] > values[:, :, 2] + 10)
    alpha = {name: image[:, :, 3].astype(float) / 255 for name, image in layers.items()}
    ankles = np.zeros(skin.shape, dtype=bool)
    ankles[1310:1490, 350:812] = True
    exposed = (1 - alpha["pants"]) * (1 - alpha["shoes"])
    if (skin & ankles & (exposed > 0.02)).any():
        raise ValueError("Skin exposed at the trousers/shoes join")
    shoulders = np.zeros(skin.shape, dtype=bool)
    shoulders[285:570, 305:710] = True
    if (skin & shoulders & (alpha["shirt"] < 0.98)).any():
        raise ValueError("Body exposed through the shirt silhouette")
    for name in ("pants", "shirt", "jacket"):
        if alpha[name][625, 550] != 1:
            raise ValueError(f"Hand-shaped hole in {name}")
    for x in (270, 285, 300):
        shirt_end = np.where(alpha["shirt"][710:790, x] > 0.5)[0].max()
        jacket_end = np.where(alpha["jacket"][710:790, x] > 0.5)[0].max()
        if not 8 <= shirt_end - jacket_end <= 12:
            raise ValueError(f"Uneven hanging cuff at x={x}")
    if not alpha["hand_front"][550, 730] or alpha["hand_palm"][550, 730]:
        raise ValueError("Forearm/palm overlay separation is invalid")
    print("OK coverage: no skin at joins; complete hidden fabric; cuff=8–12px; separate palm overlay")


def main():
    LAYERS.mkdir(parents=True, exist_ok=True)
    base = read_rgb(ART / "test2/base.png")
    silhouette = base_silhouette(base)
    layers = {}
    for name in EXPRESSIONS:
        layers[name] = save_layer(name, read_rgb(ART / f"test2/{name}.png"), silhouette)
    palm = read_mask("hand_palm", base)
    for name in ("hand_front", "hand_palm"):
        layers[name] = save_layer(name, base, read_mask(name, base))
    for name in ITEMS:
        source = read_rgb(STACK / f"stack_{STAGES[name]}.png")
        mask = read_mask(name, source)
        complete = complete_clothing(name, source, mask, palm)
        layers[name] = save_layer(name, complete, mask, grayscale=name != "glasses")
    validate_coverage(layers, base)
    cut_icons()
    build_preview(layers)


if __name__ == "__main__":
    main()
