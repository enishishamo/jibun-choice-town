# Build 医療編 assets.
# Scenes are used WHOLE (aspect ratio untouched) — the baked-in text in the
# source pictures is scenery only; every number the game uses lives in React.
# Only two things are cut: the 8 profession portraits and the 4 X-ray frames,
# both taken as complete tiles.
from PIL import Image, ImageDraw
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "..", "public", "assets", "medical")
os.makedirs(OUT, exist_ok=True)
S = lambda n: Image.open(os.path.join(SRC, f"m{n}.png"))


def jpg(im, name, maxw, q=88):
    im = im.convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".jpg")
    im.save(p, quality=q, optimize=True)
    print(f"{name}.jpg {im.size} {round(os.path.getsize(p)/1024)}KB")


# ---------- whole scenes ----------
jpg(S(4), "er_arrival", 1000)     # 来院（車いす・咳）
jpg(S(3), "er_bed", 1000)         # 救急外来のベッド
jpg(S(5), "er_exam", 1000)        # 診察の場面
jpg(S(10), "lab", 1000)           # 検査室
jpg(S(6), "xray_room", 1000)      # X線撮影室
jpg(S(11), "pharmacy", 1000)      # 薬剤部
jpg(S(9), "ward", 1000)           # 病室
jpg(S(8), "rehab", 1000)          # リハビリ
jpg(S(1), "msw_room", 1000)       # 退院前の面談
jpg(S(12), "back_home", 1100)     # 最終：生活へ戻る（まとめ用の元画像）

# まとめ画面は文字の読めない1枚絵ではなく、
# 「救急外来に来たとき → 自分の家で過ごしている」の2枚だけを使う。
# 座標は幅1100の書き出し基準なので、元画像の幅に合わせて拡大する。
_b12 = S(12)
_k = _b12.width / 1100
_box = lambda b: tuple(round(v * _k) for v in b)
jpg(_b12.crop(_box((26, 150, 342, 448))), "home_before", 320, 92)
jpg(_b12.crop(_box((376, 156, 746, 448))), "home_after", 380, 92)

# ---------- 8 profession portraits from the clear screen ----------
# The bottom row of m12 holds one card per profession; we take the picture
# area of each card (no caption text).
PORTRAITS = ["doctor", "labtech", "radtech", "pharmacist", "nurse", "dietitian", "pt", "msw"]
b12 = S(12)
x0, step = 52, 184
for i, name in enumerate(PORTRAITS):
    left = x0 + i * step
    tile = b12.crop((left, 733, left + 168, 838))
    jpg(tile, f"who_{name}", 260, 90)

# ---------- 4 X-ray frames from the radiography sheet ----------
# three not-good-enough shots and one usable one
XRAYS = {
    # crop below the ✕ badge so no judgement mark is baked into the frame
    "xray_a": (343, 858, 480, 975),
    "xray_b": (535, 858, 668, 975),
    "xray_c": (730, 858, 862, 975),
    "xray_ok": (944, 850, 1075, 975),
}
b6 = S(6)
for name, box in XRAYS.items():
    jpg(b6.crop(box), name, 300, 90)

# contact sheet
names = [f"who_{p}" for p in PORTRAITS] + list(XRAYS)
cols, cell = 6, 170
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell, rows * (cell + 20)), (210, 224, 236))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    im = Image.open(os.path.join(OUT, n + ".jpg"))
    im.thumbnail((cell - 12, cell - 12))
    x, y = (i % cols) * cell, (i // cols) * (cell + 20)
    sheet.paste(im, (x + 6, y + 6))
    d.text((x + 6, y + cell + 4), n, fill=(20, 20, 20))
sheet.save(os.path.join(SRC, "contact-medical.png"))
print("contact sheet saved")
