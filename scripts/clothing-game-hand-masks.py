# Слои вещей по ручной обводке (заливка #FF00FF поверх картинки вещи из test/clothes).
# Край обводки подтягивается к контуру вещи: в полосе до 6 px вокруг заливки берутся
# пиксели, которые отличаются от base (контур и край вещи), остальное (тело, фон) — нет.
# Запуск из корня: python3 scripts/clothing-game-hand-masks.py pants shoes shirt ...
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ART = Path("public/images/clothing-game")
base = np.array(Image.open(ART / "test2/base.png").convert("RGB")).astype(np.int16)

for name in sys.argv[1:]:
    paths = sorted((ART / "test2/hand-masks").glob(f"{name}_mask.*"))
    painted = np.array(Image.open(paths[0]).convert("RGB")).astype(np.int16)
    src = np.array(Image.open(ART / f"test/clothes/{name}.png").convert("RGB")).astype(np.int16)
    mag = (painted[..., 0] > 190) & (painted[..., 1] < 100) & (painted[..., 2] > 190)
    mag = nd.binary_fill_holes(nd.binary_closing(mag, iterations=2))
    changed = np.abs(src - base).sum(2) > 40
    ring = nd.binary_dilation(mag, iterations=6) & ~mag
    keep = mag | (ring & changed)
    keep = nd.binary_fill_holes(nd.binary_opening(keep, iterations=1))
    # обводку можно делать с заходом за контур: белый фон снаружи контура вещи срезаем.
    # Фон = светлые пиксели, связанные с краем картинки (контур вещи их не пропускает).
    light = src.min(2) > 225
    lab, _ = nd.label(light)
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    outside = np.isin(lab, edge[edge > 0])
    keep &= ~nd.binary_dilation(outside, iterations=1)
    # вещи белые: цветные пиксели (кожа, волосы), на которые зашла обводка, выкидываем
    mx, mn = src.max(2), src.min(2)
    skin = ((mx - mn) / np.maximum(mx, 1) > 0.18) & (mx > 60)
    keep &= ~nd.binary_opening(skin, iterations=1)
    keep = nd.binary_opening(keep, iterations=1)
    alpha = (nd.gaussian_filter(keep.astype(np.float32), 0.6) * 255).astype(np.uint8)
    lum = (src @ np.array([0.299, 0.587, 0.114])).clip(0, 255).astype(np.uint8)
    out = np.dstack([lum, lum, lum, alpha])
    out[alpha == 0] = 0
    Image.fromarray(out).save(ART / f"test2/layers/{name}.png", optimize=True)
    print("ok", name, int(keep.sum()), "px")
