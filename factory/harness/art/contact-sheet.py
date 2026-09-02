# Visual contact sheet for the Series Style Gate: reference assets (top rows)
# + newly generated assets (bottom rows) side by side, so per-image review
# cannot miss series-level style drift. Usage:
#   python3 contact-sheet.py --out <png> <new1> <new2> ...
# References come from reference-set.json automatically.
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ART = Path(__file__).resolve().parent
ROOT = ART.parent.parent.parent

CELL_W, CELL_H, LABEL_H, PAD = 300, 300, 26, 8


def load_cell(path: Path, label: str) -> Image.Image:
    im = Image.open(path).convert("RGB")
    im.thumbnail((CELL_W, CELL_H))
    cell = Image.new("RGB", (CELL_W, CELL_H + LABEL_H), (245, 242, 232))
    cell.paste(im, ((CELL_W - im.width) // 2, (CELL_H - im.height) // 2))
    d = ImageDraw.Draw(cell)
    d.text((6, CELL_H + 5), label[:44], fill=(60, 50, 40))
    return cell


def main() -> None:
    args = sys.argv[1:]
    out = ROOT / "factory/state/art/contact-sheet.png"
    if "--out" in args:
        i = args.index("--out")
        out = Path(args[i + 1])
        args = args[:i] + args[i + 2:]
    refs = json.loads((ART / "reference-set.json").read_text())["references"]
    rows = [("REF: " + r["role"].split(":")[0], ROOT / r["path"]) for r in refs]
    rows += [("NEW: " + a, ROOT / a) for a in args]
    cols = 4
    n = len(rows)
    grid_h = -(-n // cols)
    sheet = Image.new("RGB", (cols * (CELL_W + PAD) + PAD, grid_h * (CELL_H + LABEL_H + PAD) + PAD), (230, 225, 210))
    for k, (label, p) in enumerate(rows):
        cell = load_cell(p, label)
        x = PAD + (k % cols) * (CELL_W + PAD)
        y = PAD + (k // cols) * (CELL_H + LABEL_H + PAD)
        sheet.paste(cell, (x, y))
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(str(out))


if __name__ == "__main__":
    main()
