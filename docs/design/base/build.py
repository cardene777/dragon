"""見本帳を 1 枚の HTML に組む。

引数なしで全ての図を並べた gallery.html を作る。
図の id を 1 つ渡すと、その図だけを載せた preview-<id>.html を作る (図ごとに並べて作っても互いに上書きしない)。
"""
import sys
from pathlib import Path

DIR = Path(__file__).resolve().parent
ORDER = ["ccip", "oauth", "order", "web", "git", "finality"]


def build(only: str | None) -> Path:
    ids = [only] if only else [i for i in ORDER if (DIR / "scenes" / f"{i}.js").exists()]
    scenes = "\n".join((DIR / "scenes" / f"{i}.js").read_text() for i in ids)
    html = (
        '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
        "<title>dragon の見た目の見本</title>\n"
        f"<style>\n{(DIR / 'engine.css').read_text()}</style>\n</head>\n"
        f'<body{f" data-only={chr(34)}{only}{chr(34)}" if only else ""}>\n'
        f"<script>\nwindow.DRAGON_PALETTES = {(DIR / 'palettes.json').read_text().strip()};\n{(DIR / 'engine.js').read_text()}\n{scenes}\nDRAGON.boot();\n</script>\n</body>\n</html>\n"
    )
    out = DIR / (f"preview-{only}.html" if only else "gallery.html")
    out.write_text(html)
    return out


if __name__ == "__main__":
    print(build(sys.argv[1] if len(sys.argv) > 1 else None))
