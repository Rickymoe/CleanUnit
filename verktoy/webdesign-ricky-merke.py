#!/usr/bin/env python3
"""Lager to SVG-er av ordmerket «Webdesign by Ricky» (Syne 700, som på webdesign-siden til Ricky) til lenken nederst i footeren:
  bilder/webdesign-by-ricky.svg      stille merke i lys grønn (siden vises slik uten JavaScript og med «redusert bevegelse»)
  bilder/webdesign-by-ricky-lys.svg  samme merke der bokstavene tennes én og én, med et lite blaff og en myk glød (Ricky 2026-11-09, som «Bokstavlys» på lilleh)
Teksten tegnes som SVG-stier, så merket ikke avhenger av at skriften lastes. Uten den pikselrutede bakgrunnen fra webdesign-siden.
Begge har samme viewBox, med marg rundt (PAD) så gløden ikke kuttes, slik at bildet ikke endrer størrelse når det byttes (se .side-footer__utviklerlenke i css/style.css).
Animasjonen kjører én gang (ca. 4,7 s, under de 5 sekundene som WCAG 2.2.2 krever pausekontroll for) og ender med at alle bokstavene står tent.
js/main.js (ordmerkeLys) bytter til den animerte versjonen første gang footeren er synlig.
Skriften (verktoy/syne-700-latin.woff2, SIL Open Font License) er Google Fonts' latin-delmengde av Syne 700.
Kjør: python3 verktoy/webdesign-ricky-merke.py"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

TEKST = 'Webdesign by Ricky'
STORRELSE = 46          # px i SVG-ets eget koordinatsystem (webdesign-siden bruker 23 px; dobbelt for skarpt merke)
SPORING = -0.01         # letter-spacing i em, som på webdesign-siden
PAD = 24                # marg rundt teksten, så gløden ikke kuttes
FARGE = '#AED1D1'       # --gronn-lys, samme som «Personvern» (4,8:1 mot --teal-mork)
LYS, GLOD, DIMMET = '#FFFFFF', '#8FE3E1', '#6E9C9C'
TRINN, VARIGHET = 0.22, 1.3   # sekunder mellom bokstavene, og hvor lenge hver bokstav «blafrer»
UT = Path('bilder')

f = TTFont('verktoy/syne-700-latin.woff2')
gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
k = STORRELSE / upm
asc, desc = f['hhea'].ascent * k, -f['hhea'].descent * k
x, bokstaver = 0.0, []
for c in TEKST:
    g = cmap[ord(c)]
    pen = SVGPathPen(gs, ntos=lambda v: f'{v:.1f}'.rstrip('0').rstrip('.'))
    gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, asc)))
    if c != ' ':
        bokstaver.append(pen.getCommands())
    x += f['hmtx'][g][0] * k + SPORING * STORRELSE
bredde, hoyde = round(x - SPORING * STORRELSE), round(asc + desc)
vb = f'{-PAD} {-PAD} {bredde + 2 * PAD} {hoyde + 2 * PAD}'
b, h = bredde + 2 * PAD, hoyde + 2 * PAD

stille = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{b}" height="{h}"><path d="{"".join(bokstaver)}" fill="{FARGE}"/></svg>\n')
(UT / 'webdesign-by-ricky.svg').write_text(stille)

defs = ''.join(f'<path id="b{i}" d="{d}"/>' for i, d in enumerate(bokstaver))
lag = ''.join(f'<g class="b" style="animation-delay:{i * TRINN:.2f}s"><use href="#b{i}" class="g" filter="url(#gl)"/><use href="#b{i}" class="t"/></g>'
              for i in range(len(bokstaver)))
lys = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{b}" height="{h}" role="img" aria-label="{TEKST}">
<style>
.b .t {{ fill: {FARGE}; animation: tent {VARIGHET}s ease-out both; animation-delay: inherit; }}
.b .g {{ fill: {GLOD}; opacity: 0; animation: glod {VARIGHET}s ease-out both; animation-delay: inherit; }}
@keyframes tent {{ 0% {{ fill: {FARGE}; }} 22% {{ fill: {LYS}; }} 40% {{ fill: {DIMMET}; }} 58%, 100% {{ fill: {LYS}; }} }}
@keyframes glod {{ 0% {{ opacity: 0; }} 22% {{ opacity: .9; }} 40% {{ opacity: .15; }} 58% {{ opacity: 1; }} 100% {{ opacity: .4; }} }}
@media (prefers-reduced-motion: reduce) {{ .b .t {{ animation: none; fill: {LYS}; }} .b .g {{ animation: none; opacity: .4; }} }}
</style>
<defs><filter id="gl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>{defs}</defs>
{lag}
</svg>
'''
(UT / 'webdesign-by-ricky-lys.svg').write_text(lys)
total = (len(bokstaver) - 1) * TRINN + VARIGHET
print(f'stille {b} × {h}, {(UT / "webdesign-by-ricky.svg").stat().st_size} byte; lys {(UT / "webdesign-by-ricky-lys.svg").stat().st_size} byte, {len(bokstaver)} bokstaver, {total:.1f} s')
