#!/usr/bin/env python3
"""Lager bilder/webdesign-by-ricky.svg: ordmerket «Webdesign by Ricky» (Syne 700, som på webdesign-siden til Ricky) i lys grønn, til lenken nederst i footeren.
Teksten tegnes som SVG-stier, så merket ikke avhenger av at skriften lastes. Uten den pikselrutede bakgrunnen fra webdesign-siden.
Skriften (verktoy/syne-700-latin.woff2, SIL Open Font License) er Google Fonts' latin-delmengde av Syne 700.
Kjør: python3 verktoy/webdesign-ricky-merke.py"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

TEKST = 'Webdesign by Ricky'
STORRELSE = 46          # px i SVG-ets eget koordinatsystem (webdesign-siden bruker 23 px; dobbelt for skarpt merke)
SPORING = -0.01         # letter-spacing i em, som på webdesign-siden
FARGE = '#AED1D1'       # --gronn-lys, samme som «Personvern» (4,8:1 mot --teal-mork)
UT = Path('bilder/webdesign-by-ricky.svg')

f = TTFont('verktoy/syne-700-latin.woff2')
gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
k = STORRELSE / upm
asc, desc = f['hhea'].ascent * k, -f['hhea'].descent * k
x, d = 0.0, ''
for c in TEKST:
    g = cmap[ord(c)]
    pen = SVGPathPen(gs)
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, asc)))
    d += pen.getCommands()
    x += f['hmtx'][g][0] * k + SPORING * STORRELSE
bredde, hoyde = round(x - SPORING * STORRELSE), round(asc + desc)
UT.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {bredde} {hoyde}" width="{bredde}" height="{hoyde}">'
              f'<path d="{d}" fill="{FARGE}"/></svg>\n')
print(UT, f'{bredde} × {hoyde}', f'{UT.stat().st_size} byte')
