#!/usr/bin/env python3
"""Erzeugt langdock/4_code_pdf.js aus tools/pdf_node_template.js plus Marken-Assets.

- Schrift: Quicksand (variabel, von hyo-health.de) -> statische Schnitte 500 und 700,
  auf Windows-1252-Zeichen reduziert, als TrueType zum Einbetten ins PDF.
- Logo: hyo-logo-violet-transparent.png -> RGB + Alphakanal, zlib-komprimiert
  (FlateDecode), damit das PDF ohne Bildbibliothek erzeugt werden kann.

Aufruf im Repo-Hauptordner:  python3 tools/build_pdf_node.py
Benötigt: pip install fonttools brotli pillow
"""
import base64
import io
import json
import zlib
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "brand" / "quicksand-latin-var.woff2"
LOGO = ROOT / "brand" / "hyo-logo-violet-transparent.png"
TEMPLATE = ROOT / "tools" / "pdf_node_template.js"
OUT = ROOT / "langdock" / "4_code_pdf.js"

CODES = [c for c in range(32, 256) if c not in (0x81, 0x8D, 0x8F, 0x90, 0x9D)]
UNI = {c: bytes([c]).decode("cp1252") for c in CODES}


def font_asset(weight, name):
    var = TTFont(FONT)
    inst = instancer.instantiateVariableFont(var, {"wght": weight})
    inst.flavor = None
    opts = subset.Options()
    opts.layout_features = []
    opts.hinting = False
    opts.name_IDs = [1, 2, 4, 6]
    opts.notdef_outline = True
    opts.drop_tables += ["GSUB", "GPOS", "GDEF", "STAT", "HVAR", "gasp", "DSIG"]
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=[ord(u) for u in UNI.values()] + [0x20])
    sub.subset(inst)
    buf = io.BytesIO(); inst.save(buf); data = buf.getvalue()
    upm = inst["head"].unitsPerEm
    cmap = inst.getBestCmap(); hmtx = inst["hmtx"]
    scale = 1000 / upm
    widths = []
    for c in range(32, 256):
        g = cmap.get(ord(UNI[c])) if c in UNI else None
        widths.append(round(hmtx[g][0] * scale) if g else 0)
    os2, hhea, head = inst["OS/2"], inst["hhea"], inst["head"]
    return {
        "name": name,
        "ttf": base64.b64encode(data).decode(),
        "len": len(data),
        "widths": widths,
        "ascent": round(hhea.ascent * scale), "descent": round(hhea.descent * scale),
        "capHeight": round(getattr(os2, "sCapHeight", 700) * scale),
        "bbox": [round(v * scale) for v in (head.xMin, head.yMin, head.xMax, head.yMax)],
    }


def logo_asset(width_px=640):
    im = Image.open(LOGO).convert("RGBA")
    im = im.crop(im.getbbox())
    h = round(im.height * width_px / im.width)
    im = im.resize((width_px, h), Image.LANCZOS)
    rgb = im.convert("RGB").tobytes()
    alpha = im.getchannel("A").tobytes()
    return {"w": width_px, "h": h,
            "rgb": base64.b64encode(zlib.compress(rgb, 9)).decode(),
            "alpha": base64.b64encode(zlib.compress(alpha, 9)).decode()}


def main():
    assets = {
        "regular": font_asset(500, "HYOAAA+Quicksand-Medium"),
        "bold": font_asset(700, "HYOAAB+Quicksand-Bold"),
        "logo": logo_asset(),
    }
    js = TEMPLATE.read_text(encoding="utf-8").replace("/*__ASSETS__*/null", json.dumps(assets, separators=(",", ":")))
    OUT.write_text(js, encoding="utf-8")
    kb = len(js.encode()) / 1024
    print(f"{OUT.relative_to(ROOT)} geschrieben ({kb:.0f} KB): Schrift {assets['regular']['len']//1024}+{assets['bold']['len']//1024} KB, Logo {assets['logo']['w']}x{assets['logo']['h']}")


if __name__ == "__main__":
    main()
