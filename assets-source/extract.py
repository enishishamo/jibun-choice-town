# Extract individual asset images from the JIBUN CHOICE design boards.
# Boards are 1536x1024. Object icons sit on a cream background, so after a
# generous crop we auto-trim the uniform background to get a tight sprite.
from PIL import Image
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "public", "assets")
os.makedirs(OUT, exist_ok=True)

b1 = Image.open(os.path.join(SRC, "board1.png"))
b2 = Image.open(os.path.join(SRC, "board2.png"))
b3 = Image.open(os.path.join(SRC, "board3.png"))


def trim(im, thresh=26, pad=6):
    """Trim uniform background sampled from corners; keep small padding."""
    rgb = im.convert("RGB")
    w, h = rgb.size
    corners = [rgb.getpixel(p) for p in [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    px = rgb.load()
    left, top, right, bottom = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, bch = px[x, y]
            if abs(r - bg[0]) + abs(g - bg[1]) + abs(bch - bg[2]) > thresh * 3:
                if x < left:
                    left = x
                if x > right:
                    right = x
                if y < top:
                    top = y
                if y > bottom:
                    bottom = y
    if right <= left or bottom <= top:
        return im
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w, right + pad + 1)
    bottom = min(h, bottom + pad + 1)
    return im.crop((left, top, right, bottom))


# name: (board, box(l, t, r, b), trim?)
CROPS = {
    # --- large scenes ---
    "town-hero":        (b1, (980, 55, 1536, 265), False),
    "kids-walking":     (b1, (1200, 295, 1536, 495), True),
    # --- place backgrounds (board3 scene tiles, ~95px) ---
    "bg-school":        (b3, (22, 852, 118, 948), False),
    "bg-kitchen":       (b3, (128, 852, 232, 948), False),
    "bg-farm":          (b3, (242, 852, 336, 948), False),
    "bg-warehouse":     (b3, (340, 852, 438, 948), False),
    "bg-road":          (b3, (444, 852, 522, 948), False),
    "bg-recycle":       (b3, (528, 852, 628, 948), False),
    # --- profession characters (board2 right column, offset x+980, y+30) ---
    "char-nutrition":   (b2, (990, 290, 1090, 390), True),
    "char-cook":        (b2, (1090, 288, 1195, 390), True),
    "char-farmer":      (b2, (1195, 288, 1295, 390), True),
    "char-logistics":   (b2, (1295, 290, 1395, 390), True),
    "char-recycle":     (b2, (1395, 290, 1500, 390), True),
    # --- tools row 1 ---
    "tool-kama":        (b2, (990, 448, 1090, 534), True),
    "tool-oven":        (b2, (1090, 448, 1192, 534), True),
    "tool-thermo":      (b2, (1198, 448, 1278, 534), True),
    "tool-knife":       (b2, (1282, 448, 1392, 534), True),
    "tool-tray":        (b2, (1395, 444, 1502, 534), True),
    # --- tools row 2 ---
    "item-carrot":      (b2, (990, 560, 1072, 628), True),
    "item-fish":        (b2, (1072, 560, 1175, 628), True),
    "item-veggies":     (b2, (1185, 556, 1288, 628), True),
    "item-truck":       (b2, (1288, 556, 1395, 628), True),
    "item-map":         (b2, (1398, 556, 1498, 628), True),
    # --- tools row 3 ---
    "item-leftover":    (b2, (990, 655, 1082, 722), True),
    "item-recyclebag":  (b2, (1085, 652, 1178, 722), True),
    "item-compost":     (b2, (1185, 655, 1275, 722), True),
    "item-seedling":    (b2, (1282, 655, 1392, 722), True),
    "item-alert":       (b2, (1398, 652, 1490, 722), True),
    # --- UI parts ---
    "ui-fire":          (b2, (992, 782, 1062, 852), True),
    "ui-new":           (b2, (1075, 782, 1165, 852), True),
    "ui-sparkle":       (b2, (1178, 782, 1262, 852), True),
    "ui-timer":         (b2, (1278, 782, 1372, 852), True),
    "ui-balloon":       (b2, (1378, 778, 1500, 852), True),
}

for name, (board, box, do_trim) in CROPS.items():
    im = board.crop(box)
    if do_trim:
        im = trim(im)
    im.save(os.path.join(OUT, f"{name}.png"))
    print(f"{name}: {im.size}")

# contact sheet for visual verification
names = list(CROPS.keys())
cols = 6
cell = 130
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * (cell + 18)), (250, 245, 232))
from PIL import ImageDraw
d = ImageDraw.Draw(sheet)
for i, name in enumerate(names):
    im = Image.open(os.path.join(OUT, f"{name}.png"))
    im.thumbnail((cell - 10, cell - 10))
    x = (i % cols) * cell
    y = (i // cols) * (cell + 18)
    sheet.paste(im, (x + 5, y + 5))
    d.text((x + 5, y + cell + 2), name, fill=(60, 50, 40))
sheet.save(os.path.join(SRC, "contact-sheet.png"))
print("contact sheet saved")
