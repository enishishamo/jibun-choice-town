# Build 給食編 web assets.
# Policy: every illustration is used WHOLE (aspect ratio untouched).
# The only edit is trimming the ragged AI-generated edge on src2/src1,
# which removes background fringe only — no person or equipment is cut.
from PIL import Image
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "..", "public", "assets", "kyushoku")
os.makedirs(OUT, exist_ok=True)


def save_jpg(im, name, maxw, quality=88):
    im = im.convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".jpg")
    im.save(p, quality=quality, optimize=True)
    print(f"{name}.jpg {im.size} {round(os.path.getsize(p)/1024)}KB")


def save_png(im, name, maxw):
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".png")
    im.save(p, optimize=True)
    print(f"{name}.png {im.size} {round(os.path.getsize(p)/1024)}KB")


def flatten(im, box=None, bg=(250, 245, 233)):
    im = im.convert("RGBA")
    if box:
        im = im.crop(box)
    out = Image.new("RGB", im.size, bg)
    out.paste(im, (0, 0), im)
    return out


s = lambda n: Image.open(os.path.join(SRC, f"src{n}.png"))

# 1. farmer character (transparent cut-out, keep alpha for the reveal screen)
farmer = s(1).convert("RGBA")
bbox = farmer.split()[3].getbbox()
save_png(farmer.crop(bbox), "farmer_char", 620)

# 2. school kitchen — trim ragged edge only
k = s(2)
w, h = k.size
save_jpg(flatten(k, (int(w * 0.06), int(h * 0.07), int(w * 0.94), int(h * 0.97))), "school_kitchen", 900)

# 3. farm field (whole)
save_jpg(s(3), "farm_field", 900)
# 4. delivery check / 検収 (whole)
save_jpg(s(4), "delivery_check", 900)
# 5. delivery centre (whole)
save_jpg(s(5), "delivery_center", 1000)
# 6. recycling sorting line (whole)
save_jpg(s(6), "recycle_sorting", 1000)
# 7. recycling plant -> compost -> farm (whole)
save_jpg(s(7), "compost_to_farm", 1100)
# 8. classroom lunch (whole)
save_jpg(s(8), "classroom_lunch", 1000)
# 9. leftovers collected after lunch (whole)
save_jpg(s(9), "food_waste", 1000)
