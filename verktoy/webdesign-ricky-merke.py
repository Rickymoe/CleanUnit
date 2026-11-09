#!/usr/bin/env python3
"""Lager to SVG-er av ordmerket «Webdesign by Ricky» (Syne 700, som på webdesign-siden til Ricky) til lenken nederst i footeren:
  bilder/webdesign-by-ricky.svg      stille merke i lys grønn (siden vises slik uten JavaScript og med «redusert bevegelse»)
  bilder/webdesign-by-ricky-lys.svg  samme merke i tre trinn (Ricky 2026-11-09, «Bokstavlys» på lilleh): (1) bokstavene tennes én og én, med et lite blaff og en myk glød,
                                     (2) når alle lyser, flimrer alle sammen noen ganger som et lysstoffrør, (3) og slås av, så merket står som før effekten begynte
Teksten tegnes som SVG-stier, så merket ikke avhenger av at skriften lastes. Uten den pikselrutede bakgrunnen fra webdesign-siden.
Begge har samme viewBox, med marg rundt (PAD) så gløden ikke kuttes, slik at bildet ikke endrer størrelse når det byttes (se .side-footer__utviklerlenke i css/style.css).
Animasjonen kjører én gang, i alt under 5 sekunder (WCAG 2.2.2 krever pausekontroll for bevegelse som varer lenger), og ender i det stille merkets utgangsfarge uten glød.
Flimmeret er bare små flater og under 3 blink i sekundet (WCAG 2.3.1).
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
TRINN, VARIGHET = 0.16, 1.1   # sekunder mellom bokstavene, og hvor lenge hver bokstav «blafrer»
PAUSE, FLIMMER = 0.05, 1.2    # pause etter siste bokstav, og lengden på lysstoffrør-flimmeret (alle bokstavene sammen) før de slås av
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
lag = ''.join(f'<g class="b" style="--d:{i * TRINN:.2f}s"><use href="#b{i}" class="g" filter="url(#gl)"/><use href="#b{i}" class="t"/></g>'
              for i in range(len(bokstaver)))
START_FLIMMER = (len(bokstaver) - 1) * TRINN + VARIGHET + PAUSE


def trinn(tider, pa, av):
    """Keyframes for lysstoffrør-flimmeret: tider = [(slutt, på/av), ...] i sekunder av FLIMMER; skarpe overganger (0,3 % mellom verdiene)."""
    ut, start = [], 0.0
    for slutt, tilstand in tider:
        p0, p1 = start / FLIMMER * 100, slutt / FLIMMER * 100
        p_slutt = 100 if slutt >= FLIMMER else max(p1 - 0.3, p0)   # siste trinn går helt til 100 %: ellers faller den implisitte sluttverdien tilbake til det tente trinnet under
        ut.append(f'{p0:.1f}%, {p_slutt:.1f}% {{ {pa if tilstand else av} }}')
        start = slutt
    return ' '.join(ut)


# på 0,20 – av 0,12 – på 0,30 – av 0,10 – på 0,26 – av 0,08 – på 0,12 – av for godt (høyst tre blink i sekundet, bare små flater)
TIDER = [(0.20, 1), (0.32, 0), (0.62, 1), (0.72, 0), (0.98, 1), (1.06, 0), (1.18, 1), (FLIMMER, 0)]
lys = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{b}" height="{h}" role="img" aria-label="{TEKST}">
<style>
.b .t {{ fill: {FARGE}; animation: tent {VARIGHET}s ease-out var(--d) both, flimmer {FLIMMER}s linear {START_FLIMMER:.2f}s forwards; }}
.b .g {{ fill: {GLOD}; opacity: 0; animation: glod {VARIGHET}s ease-out var(--d) both, flimmerglod {FLIMMER}s linear {START_FLIMMER:.2f}s forwards; }}
@keyframes tent {{ 0% {{ fill: {FARGE}; }} 22% {{ fill: {LYS}; }} 40% {{ fill: {DIMMET}; }} 58%, 100% {{ fill: {LYS}; }} }}
@keyframes glod {{ 0% {{ opacity: 0; }} 22% {{ opacity: .9; }} 40% {{ opacity: .15; }} 58% {{ opacity: 1; }} 100% {{ opacity: .4; }} }}
@keyframes flimmer {{ {trinn(TIDER, 'fill: ' + LYS + ';', 'fill: ' + FARGE + ';')} }}
@keyframes flimmerglod {{ {trinn(TIDER, 'opacity: .8;', 'opacity: 0;')} }}
@media (prefers-reduced-motion: reduce) {{ .b .t {{ animation: none; fill: {FARGE}; }} .b .g {{ animation: none; opacity: 0; }} }}
</style>
<defs><filter id="gl" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>{defs}</defs>
{lag}
</svg>
'''
(UT / 'webdesign-by-ricky-lys.svg').write_text(lys)
total = START_FLIMMER + FLIMMER
print(f'stille {b} × {h}, {(UT / "webdesign-by-ricky.svg").stat().st_size} byte; lys {(UT / "webdesign-by-ricky-lys.svg").stat().st_size} byte, {len(bokstaver)} bokstaver, {total:.1f} s')
