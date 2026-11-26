"""Genera le icone dell'app in web/icons/ a partire da docs/.

Uso (solo su Mac, serve Quick Look): python3 tools/icone.py
Le icone generate sono salvate nel repository, quindi va rilanciato
solo quando cambia il logo.
"""
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "icons"


def render(svg: Path, size: int) -> Image.Image:
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["qlmanage", "-t", "-s", str(size), "-o", tmp, str(svg)],
                       check=True, capture_output=True)
        return Image.open(Path(tmp) / (svg.name + ".png")).convert("RGB").copy()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    big = render(ROOT / "docs" / "icona-app.svg", 1024)
    for name, size in [("icon-192.png", 192), ("icon-512.png", 512),
                       ("icon-maskable-512.png", 512), ("apple-touch-icon.png", 180)]:
        big.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
    big.resize((64, 64), Image.LANCZOS).save(ROOT / "web" / "favicon.ico",
                                             sizes=[(16, 16), (32, 32), (48, 48)])
    shutil.copy(ROOT / "docs" / "logo.svg", ROOT / "web" / "favicon.svg")
    print("Icone aggiornate in", OUT)


if __name__ == "__main__":
    main()
