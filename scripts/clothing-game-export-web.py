# Экспорт итоговых файлов «Примерочной» из prod/ в лёгкие webp для игры: prod/web/.
# Персонаж и слои — 512x768, иконки — 256x256, маски видимости — 512x768.
# Запуск из корня: python3 scripts/clothing-game-export-web.py
from pathlib import Path
from PIL import Image

PROD = Path("public/images/clothing-game/prod")
JOBS = [("character", "", (512, 768)), ("layers", "", (512, 768)), ("icons", "icons", (256, 256)), ("clip", "clip", (512, 768))]
for src, dst, size in JOBS:
    out = PROD / "web" / dst
    out.mkdir(parents=True, exist_ok=True)
    for p in sorted((PROD / src).glob("*.png")):
        Image.open(p).resize(size, Image.LANCZOS).save(out / f"{p.stem}.webp", "WEBP", quality=90, method=6)
    print("ok", src)
