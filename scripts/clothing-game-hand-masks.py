# Слои вещей по ручной обводке: prod/masks/<вещь>_mask.png — заливка #FF00FF поверх
# prod/sources/<вещь>.png; результат — prod/layers/<вещь>.png.
# Обводка = силуэт вещи, берётся как есть, ничего не обрезается. Внутри силуэта:
# пиксели вещи (белые/серые) берутся из картинки; где под обводкой не вещь (кожа, фон) —
# дорисовывается ткань; по краю силуэта, где нет своего контура, рисуется контур.
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
    mag = (painted[..., 0] > 190) & (painted[..., 1] < 100) & (painted[..., 2] > 190)
    mag = nd.binary_fill_holes(nd.binary_closing(mag, iterations=2))
    # контур вещи прямо за краем обводки тоже входит в вещь
    lum = src @ np.array([0.299, 0.587, 0.114])
    ring = nd.binary_dilation(mag, iterations=3) & ~mag
    shape = mag | (ring & (lum < 70))
    mx, mn = src.max(2), src.min(2)
    cloth = ((mx - mn) / np.maximum(mx, 1) < 0.15) & (mn < 250)   # белая/серая вещь и контур
    out = np.where(cloth, lum, FABRIC).astype(np.float32)
    edge = shape & ~nd.binary_erosion(shape, iterations=3)
    has_line = nd.binary_dilation(lum < 70, iterations=1)
    out[edge & ~has_line] = INK
    alpha = (nd.gaussian_filter(shape.astype(np.float32), 0.6) * 255).astype(np.uint8)
    o = np.dstack([out, out, out]).clip(0, 255).astype(np.uint8)
    res = np.dstack([o, alpha]); res[alpha == 0] = 0
    Image.fromarray(res).save(PROD / "layers" / f"{name}.png", optimize=True)
    print("ok", name, int(shape.sum()), "px")
