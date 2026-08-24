# Build 修学旅行編 assets.
# Unlike medical's "guideline sheet" sources, these are plain illustrations
# with no baked-in text/UI, so nothing needs to be cropped out — every
# image is exported whole, aspect ratio untouched (object-fit: contain
# on the React side, never cover).
#
# 後半3職種＋達成画像は「暗い旧版」と「明るい修正版」が両方保存されていた。
# 目で見て判定し、明るいクリーム/コーラル/ミント/水色/バター/ラベンダーの
# 新パレット版だけを採用している（*_old.png は削除せず残す）。
from PIL import Image
import os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(SRC, "..", "..", "public", "assets", "schooltrip")
os.makedirs(OUT, exist_ok=True)


def jpg(name, src_name, maxw=1100, q=88):
    im = Image.open(os.path.join(SRC, src_name)).convert("RGB")
    if im.width > maxw:
        im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    p = os.path.join(OUT, name + ".jpg")
    im.save(p, quality=q, optimize=True)
    print(f"{name}.jpg  {im.size}  {round(os.path.getsize(p) / 1024)}KB   <- {src_name}")


jpg("school-trip-opening", "opening.png")            # 学校に集まった100人と貸切バス
jpg("school-trip-planner", "planner.png")             # 旅行会社の教育旅行担当
jpg("school-trip-teacher", "teacher.png")              # 教員が引率体制を組む
jpg("school-trip-bus-manager", "busmanager_new.png")   # 運行管理者（明るい新版）
jpg("school-trip-tour-conductor", "conductor_new.png") # 添乗員（明るい新版）
jpg("school-trip-hotel", "hotel_new.png")              # 団体受入担当（明るい新版）
jpg("school-trip-success", "success.png")              # 達成画像
