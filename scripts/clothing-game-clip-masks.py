# Маски видимости для игры «Примерочная»: какая часть нижнего слоя остаётся видна,
# когда сверху надета вещь (замена, а не наложение). Считаются по картинкам-стопкам,
# где нижние вещи нарисованы служебными цветами. Нужны Pillow, numpy, scipy.
# Запуск из корня репозитория: python3 scripts/clothing-game-clip-masks.py
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path("public/images/clothing-game/test2")  # стопки Codex
PROD = Path("public/images/clothing-game/prod")
OUT = PROD / "clip"
OUT.mkdir(exist_ok=True)

# в каком stack_N вещь надета впервые
STAGE = dict(pants=1, shoes=2, shirt=3, tie=4, jacket=5)
# пары «нижний слой — верхняя вещь», для которых нужна маска
PAIRS = [("base", u) for u in ("pants", "shoes", "shirt", "tie", "jacket")] + [
    ("pants", "shirt"), ("pants", "jacket"), ("shirt", "tie"), ("shirt", "jacket"), ("tie", "jacket")]
BAND = 14  # px вокруг верхней вещи, где маска действует; дальше нижний слой не трогаем


def rgb(path):
    return np.array(Image.open(path).convert("RGB")).astype(np.float32) / 255


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255


def alpha(name):
    return np.array(Image.open(PROD / "layers" / f"{name}.png"))[..., 3] > 127


def save(mask, name):
    a = (nd.gaussian_filter(mask.astype(np.float32), 0.7) * 255).astype(np.uint8)
    img = np.zeros(mask.shape + (4,), np.uint8)
    img[..., :3] = 255
    img[..., 3] = a
    Image.fromarray(img).save(OUT / f"{name}.png", optimize=True)


for lower, upper in PAIRS:
    stack = rgb(ROOT / "stack" / f"stack_{STAGE[upper]}.png")
    band = nd.binary_dilation(alpha(upper), iterations=BAND)
    replace = sorted((PROD / "replace").glob(f"{upper}_replace.*"))
    if lower == "base" and replace:
        # ручное выделение: на prod/sources/base.png залито #FF00FF то, что исчезает под вещью
        painted = np.array(Image.open(replace[0]).convert("RGB")).astype(np.int16)
        gone = (painted[..., 0] > 190) & (painted[..., 1] < 100) & (painted[..., 2] > 190)
        gone = nd.binary_fill_holes(nd.binary_closing(gone, iterations=2))
        save(~gone, f"{lower}__{upper}")
        print("ok", lower, "under", upper, "(by hand)")
        continue
    if lower == "base" and upper != "shoes":
        # тело под вещью скрываем по форме самой вещи, только под её плотной частью:
        # мягкий (полупрозрачный) край вещи должен лечь на тело, а не на пустоту,
        # иначе по контуру просвечивает фон светлой линией
        save(~nd.binary_erosion(alpha(upper), iterations=2), f"{lower}__{upper}")
        print("ok", lower, "under", upper, "(by item shape)")
        continue
    mx, mn = stack.max(2), stack.min(2)
    # нижний слой скрыт там, где на стопке белое: сама верхняя вещь или пустой фон.
    # Служебные цвета нижних вещей и кожа никогда не белые, поэтому видимые части
    # (воротник, вырез, манжеты) остаются, а всё, что выглядывало бы наружу, стирается.
    hidden = (mn > 0.85) & ((mx - mn) < 0.10)
    hidden = nd.binary_opening(hidden, iterations=1)
    hidden = nd.binary_dilation(hidden, iterations=1)
    visible = ~hidden
    save(visible | ~band, f"{lower}__{upper}")
    print("ok", lower, "under", upper)
