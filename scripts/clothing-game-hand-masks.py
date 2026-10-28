# Слои вещей по ручной обводке: prod/masks/<вещь>_mask.png — заливка #FF00FF поверх
# prod/sources/<вещь>.png; результат — prod/layers/<вещь>.png.
# Перекрашивается строго выделенная область (layers/<вещь>.png); чёрный контур вещи за краем
# выделения кладётся отдельно, без перекраски (layers/<вещь>_line.png). Где под выделением
# не вещь (кожа, фон) — дорисовывается ткань, по краю без своего контура — контур.
# Запуск из корня: python3 scripts/clothing-game-hand-masks.py pants shoes shirt ...
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

PROD = Path("public/images/clothing-game/prod")
FABRIC = 236   # светлый тон дорисованной ткани (белая вещь до перекраски)
INK = 22       # цвет контура
# исходники, пришедшие сжатыми (webp через чат): их заливку выравниваем до 2 тонов
FLATTEN = {"shoes"}

for name in sys.argv[1:]:
    painted_path = sorted((PROD / "masks").glob(f"{name}_mask.*"))[0]
    painted = np.array(Image.open(painted_path).convert("RGB")).astype(np.int16)
    src = np.array(Image.open(PROD / "sources" / f"{name}.png").convert("RGB")).astype(np.int16)
    lum = src @ np.array([0.299, 0.587, 0.114])
    mx, mn = src.max(2), src.min(2)
    skin = ((mx - mn) / np.maximum(mx, 1) > 0.18) & (mx > 60)
    light = mn > 225
    lab, _ = nd.label(light)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    background = np.isin(lab, border[border > 0])
    # розовый по оттенку (заливка может быть полупрозрачной). Бледный розовый принимается
    # только поверх самой вещи; на коже и фоне — только плотный, чтобы ореол кисти за контуром
    # не считался заливкой
    dr, db = painted[..., 0] - painted[..., 1], painted[..., 2] - painted[..., 1]
    strong = (dr > 90) & (db > 90)
    faint = (dr > 45) & (db > 45)
    mag = strong | (faint & ~skin & ~background)
    mag = nd.binary_fill_holes(mag)
    # контур вещи за краем выделения: тёмные пиксели в полосе до 7 px, связанные с выделением
    ring = nd.binary_dilation(mag, iterations=7) & ~mag
    lab, _ = nd.label((ring & (lum < 140)) | mag)
    line = np.isin(lab, np.unique(lab[mag])) & ~mag
    # Правило: цвет только в пределах розового и никогда за чёрный контур.
    # Светлые пиксели самой вещи между розовым и чёрной линией (до 4 px) тоже вещь — иначе
    # там белые точки. Но не кожа, не фон и не то, что за линией.
    rim = nd.binary_dilation(mag, iterations=4) & ~mag & (lum >= 90) & ~skin & ~background
    lab, _ = nd.label(rim | mag)
    area = np.isin(lab, np.unique(lab[mag]))
    # 1) перекрашиваемая часть
    cloth = (((mx - mn) / np.maximum(mx, 1) < 0.15) & (mn < 250)) | (mx < 110)
    out = np.where(cloth, lum, FABRIC).astype(np.float32)
    # ровная заливка как у cel-shading: светлые места сводим к 3 тонам (свет, полутень, тень),
    # островки < 150 px поглощаются соседним тоном — так пропадают пятна от сжатия,
    # а все плоскости света и тени остаются. Линии и швы (тёмное) — как нарисованы.
    flat = area & (out >= 150)
    if name in FLATTEN and flat.sum() > 100:
        smooth = nd.median_filter(out, size=5)
        v = smooth[flat]
        levels = np.percentile(v, [10, 40, 85])
        for _ in range(15):
            idx = np.abs(v[:, None] - levels[None]).argmin(1)
            levels = np.array([v[idx == k].mean() if (idx == k).any() else levels[k] for k in range(3)])
        tone = np.full(out.shape, -1)
        tone[flat] = np.abs(v[:, None] - levels[None]).argmin(1)
        for _ in range(3):
            for k in range(3):
                lab, n = nd.label(tone == k)
                if not n:
                    continue
                small = np.isin(lab, np.where(nd.sum(tone == k, lab, range(1, n + 1)) < 150)[0] + 1)
                if small.any():
                    # островок берёт самый частый тон вокруг себя
                    ring = nd.binary_dilation(small, iterations=2) & ~small & flat
                    vals = tone[ring]
                    vals = vals[vals >= 0]
                    tone[small] = np.bincount(vals, minlength=3).argmax() if len(vals) else k
        levels[-1] = max(levels[-1], 250)   # свет — почти белый, чтобы белая вещь не серела
        out = np.where(flat, levels[np.clip(tone, 0, 2)], out)
    # тени глубже: белая вещь при перекраске (умножении) теряет светлые тени, поэтому
    # светлые тени (тон 225+) углубляем в 1.6 раза; средние и тёмные (190 и ниже) — как на
    # исходнике, между ними плавно. Иначе средне-серые грани (каблук) уходят в тёмные.
    fabric = area & (out >= 120)
    k = 1 + 0.6 * np.clip((out - 190) / 35, 0, 1)
    deeper = np.where(out >= 190, np.maximum(255 - (255 - out) * k, 190), out)
    out = np.where(fabric, deeper, out)
    out = out.clip(0, 255)
    # контур дорисовывается только там, где розовое шире нарисованной вещи (своей линии нет)
    edge = area & ~nd.binary_erosion(area, iterations=3)
    out[edge & ~nd.binary_dilation(lum < 70, iterations=4) & (skin | background)] = INK
    # край сглаживается только внутрь: наружу за area цвет не выходит ни на пиксель
    a = (nd.gaussian_filter(area.astype(np.float32), 0.5) * area * 255).astype(np.uint8)
    o = np.dstack([out] * 3).clip(0, 255).astype(np.uint8)
    res = np.dstack([o, a]); res[a == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}.png", optimize=True)
    # 2) контур за краем — без перекраски, как на картинке
    line = line & ~area
    la = (np.clip((140 - lum) / 70, 0, 1) * line * 255).astype(np.uint8)
    res = np.dstack([src.clip(0, 255).astype(np.uint8), la]); res[la == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}_line.png", optimize=True)
    shape = area | line
    print("ok", name, int(shape.sum()), "px")
