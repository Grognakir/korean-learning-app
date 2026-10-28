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

for name in sys.argv[1:]:
    painted_path = sorted((PROD / "masks").glob(f"{name}_mask.*"))[0]
    painted = np.array(Image.open(painted_path).convert("RGB")).astype(np.int16)
    src = np.array(Image.open(PROD / "sources" / f"{name}.png").convert("RGB")).astype(np.int16)
    mag = (painted[..., 0] - painted[..., 1] > 90) & (painted[..., 2] - painted[..., 1] > 90)  # розовый по оттенку: заливка может быть полупрозрачной
    mag = nd.binary_fill_holes(nd.binary_closing(mag, iterations=2))
    lum = src @ np.array([0.299, 0.587, 0.114])
    # 1) перекрашиваемая часть — строго выделенная область
    mx, mn = src.max(2), src.min(2)
    cloth = (((mx - mn) / np.maximum(mx, 1) < 0.15) & (mn < 250)) | (mx < 110)
    out = np.where(cloth, lum, FABRIC).astype(np.float32)
    edge = mag & ~nd.binary_erosion(mag, iterations=3)
    out[edge & ~nd.binary_dilation(lum < 70, iterations=4)] = INK   # контур там, где своего нет
    a = (nd.gaussian_filter(mag.astype(np.float32), 0.5) * 255).astype(np.uint8)
    o = np.dstack([out] * 3).clip(0, 255).astype(np.uint8)
    res = np.dstack([o, a]); res[a == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}.png", optimize=True)
    # 2) контур вещи за краем выделения — без перекраски, как на картинке
    ring = nd.binary_dilation(mag, iterations=7) & ~mag
    line = ring & (lum < 140)
    lab, _ = nd.label(line | mag)
    line = np.isin(lab, np.unique(lab[mag])) & ~mag
    la = np.clip((140 - lum) / 70, 0, 1) * line          # мягкий край линии по её яркости
    la = (la * 255).astype(np.uint8)
    res = np.dstack([src.clip(0, 255).astype(np.uint8), la]); res[la == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}_line.png", optimize=True)
    shape = mag | line
    print("ok", name, int(shape.sum()), "px")
