"""Кладёт в приложение сырые картинки генератора как есть (без композита по
маске ткани): revisions/ai-completion-2026-10-30/<id>-<color>-raw.png подгоняются
по рамке исходной иконки 256×256 тем же fit(), что в use-generated.py, и пишутся в
public/.../colored/<id>/<color>.webp. Запуск: /usr/bin/python3 use-raw.py"""
from pathlib import Path
import importlib.util

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("use_generated", HERE / "use-generated.py")
ug = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ug)

RAW = HERE / "revisions/ai-completion-2026-10-30"


def main():
    done = 0
    for raw in sorted(RAW.glob("*-raw.png")):
        item, color = raw.stem[: -len("-raw")].rsplit("-", 1)
        if color not in ug.COLORS or not (ug.ICONS / f"{item}.png").exists():
            continue
        image, _ = ug.fit(raw, ug.ICONS / f"{item}.png")
        (ug.OUT / item).mkdir(parents=True, exist_ok=True)
        image.save(ug.OUT / item / f"{color}.webp", quality=92, method=6)
        done += 1
    print(done, "files from raw generator output")


if __name__ == "__main__":
    main()
