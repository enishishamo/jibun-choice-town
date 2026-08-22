# Extract 異常気象編 assets.
#
# Policy (per the brief):
#  - The two park illustrations are STANDALONE images: used whole, aspect
#    ratio preserved, never cut into pieces.
#  - Only the small parts/data icons are taken from the sheet, tile by tile,
#    with a flood-fill key so no label text or frame is carried over.
from PIL import Image, ImageDraw
from collections import deque
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "..", "public", "assets", "heat")
os.makedirs(OUT, exist_ok=True)

board = Image.open(os.path.join(SRC, "board-heat.png"))
base = Image.open(os.path.join(SRC, "park-base-src.png"))
after = Image.open(os.path.join(SRC, "park-after-src.png"))


def keyout(im, thresh=30):
    """Make the sheet's cream background transparent (flood fill from the
    border), keeping cream-ish pixels inside the object."""
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    corners = [px[1, 1], px[w - 2, 1], px[1, h - 2], px[w - 2, h - 2]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    seen = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            continue
        seen[y][x] = True
        r, g, b, a = px[x, y]
        if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > thresh * 3:
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return im


def trim_alpha(im, pad=2):
    """Crop to the visible (non-transparent) content."""
    bbox = im.split()[3].getbbox()
    if not bbox:
        return im
    l, t, r, b = bbox
    return im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))


# ---------- 1. the park board: whole image, aspect ratio untouched ----------
base.save(os.path.join(OUT, "park-base.png"))
print("park-base:", base.size)

# ---------- 2. "after" panels: 4 complete park illustrations ----------
# The sheet holds four finished park pictures in a 2x2 grid. Each panel is a
# whole scene — we keep the entire scene and only leave out the explanatory
# badge strip at the very top of each panel (that badge is sheet annotation,
# not part of the illustration).
PANELS = {
    "after-tree": (22, 100, 553, 668),
    "after-shade": (568, 100, 1099, 668),
    "after-pavement": (22, 706, 553, 1274),
    "after-mist": (568, 706, 1099, 1274),
}
BADGE_H = 78  # drop the annotation badge row (sky only underneath)
for name, (l, t, r, b) in PANELS.items():
    panel = after.crop((l, t + BADGE_H, r, b))
    panel.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {panel.size}")

# ---------- 3. small parts (keyed out, no labels) ----------
PARTS = {
    "part-tree": (36, 645, 112, 748),
    "part-shade": (130, 650, 222, 742),
    "part-pavement": (228, 662, 325, 747),
    "part-mist": (352, 642, 447, 748),
}
for name, box in PARTS.items():
    im = trim_alpha(keyout(board.crop(box)))
    im.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {im.size}")

# ---------- 4. data cards (kept as their own rounded tiles) ----------
DATA = {
    "data-sun": (40, 449, 166, 548),
    "data-shade": (184, 449, 308, 548),
    "data-wind": (324, 449, 444, 548),
    "data-surface": (461, 449, 586, 548),
}
for name, box in DATA.items():
    im = board.crop(box)
    im.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {im.size}")

# ---------- 4b. place backgrounds (whole tiles, no labels) ----------
PLACES = {
    "place-park": (36, 157, 214, 350),
    "place-town": (222, 157, 359, 350),
    "place-site": (371, 157, 509, 350),
    "place-dam": (521, 157, 661, 350),
    "place-city": (673, 157, 814, 350),
}
for name, box in PLACES.items():
    im = board.crop(box)
    im.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {im.size}")

# ---------- 5. profession characters (same clay style as 給食編) ----------
CHARS = {
    "char-park": (848, 150, 962, 336),
    "char-power": (983, 150, 1092, 336),
    "char-site": (1112, 150, 1214, 336),
    "char-water": (1243, 150, 1347, 336),
    "char-urban": (1370, 150, 1487, 336),
}
for name, box in CHARS.items():
    im = trim_alpha(keyout(board.crop(box)))
    im.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {im.size}")

# ---------- 6. status icons ----------
STATUS = {
    "icon-good": (872, 855, 962, 945),
    "icon-warn": (975, 855, 1065, 945),
    "icon-bad": (1078, 855, 1168, 945),
    "icon-people": (1425, 855, 1515, 945),
}
for name, box in STATUS.items():
    im = trim_alpha(keyout(board.crop(box)))
    im.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {im.size}")

# ---------- contact sheet ----------
names = list(PARTS) + list(DATA) + list(STATUS) + list(CHARS) + list(PLACES)
cols, cell = 6, 150
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * (cell + 20)), (206, 226, 240))
d = ImageDraw.Draw(sheet)
for i, name in enumerate(names):
    im = Image.open(os.path.join(OUT, f"{name}.png")).convert("RGBA")
    im.thumbnail((cell - 12, cell - 12))
    x, y = (i % cols) * cell, (i // cols) * (cell + 20)
    sheet.paste(im, (x + 6, y + 6), im)
    d.text((x + 6, y + cell + 4), name, fill=(30, 30, 30))
sheet.save(os.path.join(SRC, "contact-heat.png"))

# panels contact sheet (separate: they are large scenes)
psheet = Image.new("RGB", (2 * 330, 2 * 360), (206, 226, 240))
for i, name in enumerate(PANELS):
    im = Image.open(os.path.join(OUT, f"{name}.png"))
    im.thumbnail((320, 330))
    psheet.paste(im, ((i % 2) * 330 + 5, (i // 2) * 360 + 5))
    d2 = ImageDraw.Draw(psheet)
    d2.text(((i % 2) * 330 + 8, (i // 2) * 360 + 340), name, fill=(30, 30, 30))
psheet.save(os.path.join(SRC, "contact-panels.png"))
print("contact sheets saved")
