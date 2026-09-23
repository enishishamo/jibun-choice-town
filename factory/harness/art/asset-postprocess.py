#!/usr/bin/env python3
"""Post-process a generated PNG into a game master asset (Ver.2 lunch pipeline).
   - verifies/creates transparency (keys a flat white backdrop if the generator ignored alpha)
   - trims to the content bounding box, pads to the target aspect with margin, resizes to master size
   - keeps the raw generation for provenance
   usage: asset-postprocess.py <in.png> <out.png> <raw-keep.png> <W> <H> [margin=0.08]
   prints one JSON line with the checks."""
import json, sys, shutil
from PIL import Image, ImageChops

src, out, keep, W, H = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
margin = float(sys.argv[6]) if len(sys.argv) > 6 else 0.08
im = Image.open(src).convert("RGBA")
res = {"src_size": im.size}
a = im.getchannel("A")
corners = [a.getpixel((0, 0)), a.getpixel((im.width - 1, 0)), a.getpixel((0, im.height - 1)), a.getpixel((im.width - 1, im.height - 1))]
res["alpha_corners"] = corners
if max(corners) > 8:
    # generator ignored alpha: key out the near-white backdrop
    rgb = im.convert("RGB")
    px = rgb.load(); ap = a.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y]
            m = min(r, g, b)
            if m > 245: ap[x, y] = 0
            elif m > 225: ap[x, y] = int((245 - m) / 20 * 255)
    im.putalpha(a)
    res["keyed_white"] = True
else:
    res["keyed_white"] = False
bbox = im.getchannel("A").point(lambda v: 255 if v > 10 else 0).getbbox()
res["content_bbox"] = bbox
if not bbox:
    print(json.dumps({**res, "ok": False, "error": "empty image"})); sys.exit(1)
content = im.crop(bbox)
# pad to target aspect with margin
cw, ch = content.size
tw, th = W, H
scale = min((tw * (1 - 2 * margin)) / cw, (th * (1 - 2 * margin)) / ch)
nw, nh = max(1, round(cw * scale)), max(1, round(ch * scale))
content = content.resize((nw, nh), Image.LANCZOS)
canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
canvas.paste(content, ((tw - nw) // 2, (th - nh) // 2), content)
shutil.copyfile(src, keep)
canvas.save(out, "PNG", optimize=True)
fill = (nw * nh) / (tw * th)
res.update({"ok": True, "out": out, "out_size": [tw, th], "content_fill": round(fill, 3)})
print(json.dumps(res))
