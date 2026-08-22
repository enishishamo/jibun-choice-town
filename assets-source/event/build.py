# Build イベント編 assets.
# Scenes (ev1/ev3/ev6/ev7) are used WHOLE — aspect ratio untouched.
# Only the sheet tiles (ev2/ev4/ev8/ev9) are cut, tile by tile, with a
# flood-fill key so no label text or neighbouring tile is carried over.
from PIL import Image, ImageDraw
from collections import deque
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "..", "public", "assets", "event")
os.makedirs(OUT, exist_ok=True)
S = lambda n: Image.open(os.path.join(SRC, f"ev{n}.png"))


def keyout(im, thresh=26):
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    corners = [px[1, 1], px[w - 2, 1], px[1, h - 2], px[w - 2, h - 2]]
    bg = tuple(sum(c[i] for c in corners) // 4 for i in range(3))
    seen = bytearray(w * h)
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        x, y = q.popleft()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        r, g, b, a = px[x, y]
        if abs(r - bg[0]) + abs(g - bg[1]) + abs(b - bg[2]) > thresh * 3:
            continue
        px[x, y] = (r, g, b, 0)
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    bbox = im.split()[3].getbbox()
    return im.crop(bbox) if bbox else im


def jpg(im, name, maxw, q=88):
    im = im.convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".jpg")
    im.save(p, quality=q, optimize=True)
    print(f"{name}.jpg {im.size} {round(os.path.getsize(p)/1024)}KB")


def png(im, name, maxw=220):
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".png")
    im.save(p, optimize=True)
    return im


# ---------- whole scenes ----------
jpg(S(6), "venue_empty", 1100)      # 設営前のからっぽの会場（ゲーム盤）
jpg(S(3), "venue_map", 1100)        # 完成した会場マップ
jpg(S(1), "venue_busy", 1100)       # 開催中の会場
jpg(S(7), "venue_success", 1100)    # 成功後の会場

# ---------- ev2: layout parts ----------
PARTS2 = {
    "p_stage":    (30, 95, 420, 330),
    "p_tent":     (455, 100, 665, 330),
    "p_booth_goods": (700, 90, 920, 330),
    "p_booth_food":  (950, 90, 1160, 330),
    "p_rest_table":  (1190, 140, 1350, 330),
    "p_rest_bench":  (1370, 210, 1510, 320),
    "p_gate":     (20, 385, 215, 545),
    "p_fence":    (300, 425, 465, 535),
    "p_sign_in":  (485, 400, 585, 545),
    "p_sign_out": (600, 400, 700, 545),
    "p_flag":     (725, 375, 800, 545),
    "p_infomap":  (840, 385, 1035, 545),
    "p_bins":     (1070, 420, 1265, 545),
    "p_flower":   (1320, 435, 1510, 545),
    "p_light":    (30, 615, 205, 730),
    "p_mic":      (245, 600, 320, 730),
    "p_speaker":  (355, 615, 445, 730),
    "p_mixer":    (465, 645, 610, 730),
    "p_rack":     (630, 630, 760, 730),
    "p_signpost": (790, 600, 950, 735),
    "p_cone":     (990, 640, 1105, 730),
    "p_bar":      (1130, 650, 1290, 730),
    "p_rope":     (1330, 640, 1500, 730),
}
b2 = S(2)
for name, box in PARTS2.items():
    png(keyout(b2.crop(box)), name, 200)
print(f"ev2 parts: {len(PARTS2)}")

# ---------- ev4: promotion media ----------
PARTS4 = {
    "m_poster":  (30, 150, 300, 545),
    "m_flyer":   (315, 165, 660, 530),
    "m_sns":     (735, 135, 965, 545),
    "m_story":   (985, 150, 1200, 545),
    "m_street":  (1230, 140, 1510, 555),
    "m_banner":  (30, 625, 205, 960),
    "m_web":     (270, 620, 680, 975),
    "m_mail":    (735, 620, 965, 950),
    "m_board":   (1020, 630, 1510, 960),
}
b4 = S(4)
for name, box in PARTS4.items():
    png(keyout(b4.crop(box)), name, 240)
print(f"ev4 media: {len(PARTS4)}")

# ---------- ev8: performers ----------
PARTS8 = {
    "a_singer":   (990, 130, 1090, 285),
    "a_musician": (1120, 130, 1250, 285),
    "a_dancer":   (1310, 130, 1430, 285),
    "a_magician": (990, 305, 1090, 465),
    "a_mc":       (1130, 305, 1250, 465),
    "a_mascot":   (1300, 305, 1430, 465),
}
b8 = S(8)
for name, box in PARTS8.items():
    png(keyout(b8.crop(box)), name, 170)
print(f"ev8 performers: {len(PARTS8)}")

# ---------- ev9: sound gear ----------
PARTS9 = {
    "s_mixer":    (25, 145, 425, 395),
    "s_mic":      (465, 145, 610, 385),
    "s_micstand": (650, 85, 800, 385),
    "s_speaker":  (840, 130, 990, 385),
    "s_monitor":  (1030, 190, 1250, 385),
    "s_cable":    (1290, 250, 1470, 385),
    "s_meter":    (285, 500, 420, 660),
    "s_lights":   (30, 790, 260, 950),
}
b9 = S(9)
for name, box in PARTS9.items():
    png(keyout(b9.crop(box)), name, 200)
print(f"ev9 gear: {len(PARTS9)}")

# ---------- contact sheet ----------
names = list(PARTS2) + list(PARTS4) + list(PARTS8) + list(PARTS9)
cols, cell = 8, 130
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * (cell + 18)), (200, 220, 236))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    im = Image.open(os.path.join(OUT, n + ".png")).convert("RGBA")
    im.thumbnail((cell - 12, cell - 12))
    x, y = (i % cols) * cell, (i // cols) * (cell + 18)
    sheet.paste(im, (x + 6, y + 6), im)
    d.text((x + 4, y + cell + 3), n, fill=(20, 20, 20))
sheet.save(os.path.join(SRC, "contact-event.png"))
print("contact sheet saved")
