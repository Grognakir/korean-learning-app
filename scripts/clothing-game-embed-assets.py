# Встраивает картинки игры (prod/web) в макет как data:-ссылки, чтобы страница открывалась
# везде одним файлом (в том числе в приложении на iPhone, где отдельные файлы могут не грузиться).
# Запуск из корня: python3 scripts/clothing-game-embed-assets.py
import base64, json, re
from pathlib import Path

WEB = Path("public/images/clothing-game/prod/web")
PAGE = Path("docs/dev_docs/design/clothing-game-mockup.html")
assets = {}
for p in sorted(WEB.rglob("*.webp")):
    rel = "img/" + p.relative_to(WEB).as_posix()
    assets[rel] = "data:image/webp;base64," + base64.b64encode(p.read_bytes()).decode()
html = PAGE.read_text()
html, n = re.subn(r"/\*ASSETS\*/.*?/\*END\*/", lambda m: "/*ASSETS*/" + json.dumps(assets) + "/*END*/", html, flags=re.S)
assert n == 1, "метка ASSETS не найдена"
PAGE.write_text(html)
print("ok", len(assets), "картинок,", round(len(html) / 1024), "КБ")
