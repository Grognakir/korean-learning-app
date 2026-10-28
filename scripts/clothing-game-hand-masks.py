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
    mag = (painted[..., 0] - painted[..., 1] > 45) & (painted[..., 2] - painted[..., 1] > 45)  # розовый по оттенку: заливка может быть полупрозрачной
    mag = nd.binary_fill_holes(nd.binary_closing(mag, iterations=2))
    lum = src @ np.array([0.299, 0.587, 0.114])
    # контур вещи за краем выделения: тёмные пиксели в полосе до 7 px, связанные с выделением
    ring = nd.binary_dilation(mag, iterations=7) & ~mag
    lab, _ = nd.label((ring & (lum < 140)) | mag)
    line = np.isin(lab, np.unique(lab[mag])) & ~mag
    # светлая каёмка между выделением и контуром — тоже вещь (иначе там белые точки)
    area = nd.binary_fill_holes(mag | line) & ~(line & (lum < 90))
    area = nd.binary_fill_holes(area | mag)
    # 1) перекрашиваемая часть
    mx, mn = src.max(2), src.min(2)
    cloth = (((mx - mn) / np.maximum(mx, 1) < 0.15) & (mn < 250)) | (mx < 110)
    out = np.where(cloth, lum, FABRIC).astype(np.float32)
    # ровная заливка как у cel-shading: светлые места сводим к 2 тонам (свет и тень), мелкие
    # островки (< 120 px) поглощаются соседним тоном. Это убирает пятна от сжатия картинки.
    # Линии и швы (тёмное) остаются как нарисованы.
    flat = area & (out >= 150)
    if name in FLATTEN and flat.sum() > 100:
        smooth = nd.median_filter(out, size=7)
        thr = np.percentile(smooth[flat], 30)
        shadow = flat & (smooth < thr - 4)
        for _ in range(2):
            lab, n = nd.label(shadow)
            small = np.isin(lab, np.where(nd.sum(shadow, lab, range(1, n + 1)) < 120)[0] + 1)
            shadow &= ~small
            lab, n = nd.label(flat & ~shadow)
            small = np.isin(lab, np.where(nd.sum(flat & ~shadow, lab, range(1, n + 1)) < 120)[0] + 1)
            shadow |= small
        light_v = np.median(smooth[flat & ~shadow]) if (flat & ~shadow).any() else 240
        shadow_v = np.median(smooth[shadow]) if shadow.any() else light_v - 25
        out = np.where(flat, np.where(shadow, shadow_v, light_v), out)
    edge = area & ~nd.binary_erosion(area, iterations=3)
    out[edge & ~nd.binary_dilation(lum < 70, iterations=4)] = INK   # контур там, где своего нет
    a = (nd.gaussian_filter(area.astype(np.float32), 0.5) * 255).astype(np.uint8)
    o = np.dstack([out] * 3).clip(0, 255).astype(np.uint8)
    res = np.dstack([o, a]); res[a == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}.png", optimize=True)
    # 2) контур за краем — без перекраски, как на картинке
    line = line & ~area | (line & (lum < 90))
    la = (np.clip((140 - lum) / 70, 0, 1) * line * 255).astype(np.uint8)
    res = np.dstack([src.clip(0, 255).astype(np.uint8), la]); res[la == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}_line.png", optimize=True)
    shape = area | line
    print("ok", name, int(shape.sum()), "px")
