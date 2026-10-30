#!/usr/bin/env python3
"""Lager «Julen 2026» i samme skrivemåte som CleanUnit-logoen, i jul2026/bilder/julen/:
  julen-2026-logo(-lys).svg + PNG i tre størrelser (liten/middels/stor): én linje, JULEN grå og 2026 turkis, som CleanUnit-logoen
Bokstavene L, E, N og U hentes ordrett fra bilder/logo-cleanunit.svg (samme konturer). J, 2, 0 og 6 finnes ikke i logoen og tegnes
som streker i samme tykkelse (11,8) og høyde (grunnlinje 150, topp 80) med flate ender, som resten av logot.
Kjør: python3 verktoy/jul-julen-logo.py"""
import re, subprocess, tempfile
from pathlib import Path
from PIL import Image

UT = Path('jul2026/bilder/julen')
SW = 11.8                                   # strektykkelse i logoen (stammen på L)
GRA, TEAL_LYS = '#8E9595', '#87CAC9'
GAP, MELLOMROM = 24, 64                     # mellom bokstaver / ord, målt i logoen
GAP_TALL = 13                               # tettere mellom sifrene i årstallet (Ricky: «litt tettere»)

logo = Path('bilder/logo-cleanunit.svg').read_text()
stier = re.findall(r'<path[^>]* d="([^"]+)"', logo)
under = [u for d in stier for u in re.findall(r'M[^Z]*Z', d)]


def fra_logo(start, xmin, bredde):
    """Alle delstier som begynner med gitt koordinat (E har fire), plassert så venstre kant er 0."""
    d = ' '.join(u for u in under if u.startswith(start) or (start == 'M152.95' and u.startswith('M145.65')))
    return {'d': d, 'dx': -xmin, 'w': bredde, 'type': 'fyll'}


def strek(d, bredde, ekstra=''):
    return {'d': d, 'dx': 0, 'w': bredde, 'type': 'strek', 'ekstra': ekstra}


L = fra_logo('M87.23', 87.23, 39.6)
E = fra_logo('M152.95', 145.65, 42.6)
N = fra_logo('M343.49', 292.39, 62.7)
U = fra_logo('M380.52', 380.52, 51.1)
J = strek('M46 80 V124.1 A20 20 0 0 1 6 124.1', 52)
S2 = strek('M6 103 A19 17.1 0 0 1 44 103 C44 122 26 132 6 144.1 H49', 50, 'stroke-linejoin="miter" stroke-miterlimit="10"')
S0 = strek('M25 85.9 A19.1 29.1 0 1 0 25.01 85.9Z', 50)
S6 = strek('M5.9 121 A19.1 23.1 0 1 0 44.1 121 A19.1 23.1 0 1 0 5.9 121Z M5.9 121 C5.9 98 16 85.9 31 85.9 C36 85.9 40.5 87.2 44 90', 50)


def linje(glyfer, farge, x0=0, gap=GAP):
    """Setter glyfene etter hverandre fra x0; returnerer (svg, høyre kant)."""
    x, ut = x0, ''
    for g in glyfer:
        if g['type'] == 'fyll':
            ut += f'<path transform="translate({x + g["dx"]:.2f} 0)" d="{g["d"]}" fill="{farge}"/>'
        else:
            ut += (f'<path transform="translate({x:.2f} 0)" d="{g["d"]}" fill="none" stroke="{farge}" stroke-width="{SW}" '
                   f'{g.get("ekstra", "")}/>')
        x += g['w'] + gap
    return ut, x - gap


def bredde(glyfer):
    return sum(g['w'] for g in glyfer) + GAP * (len(glyfer) - 1)


JULEN = [J, U, L, E, N]
AAR = [S2, S0, S2, S6]


def julen_logo(lys=False):
    f1, f2 = ('#FFFFFF', TEAL_LYS) if lys else (GRA, TEAL_LYS)
    bobler = ('#87CAC9', '#3DB8B5', '#AED1D1') if lys else ('#3AAFAF', '#008789', '#87CAC9')
    s1, h1 = linje(JULEN, f1)
    s2, h2 = linje(AAR, f2, h1 + MELLOMROM, GAP_TALL)
    b = [(h2 - 56.2, -7.5, 25.7), (h2 - 94.9, 27.8, 17.8), (h2 - 74, 58.4, 9.0)]
    cirkler = ''.join(f'<circle cx="{x:.1f}" cy="{y}" r="{r}" fill="{c}"/>' for (x, y, r), c in zip(b, bobler))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -40 {h2 + 1:.1f} 192" role="img" aria-label="Julen 2026">{cirkler}{s1}{s2}</svg>', h2 + 1


def png(svg_tekst, navn, w, h):
    with tempfile.TemporaryDirectory() as tmp:
        sti = Path(tmp) / 'a.svg'
        sti.write_text(svg_tekst)
        side = Path(tmp) / 'a.html'
        side.write_text(f'<html><body style="margin:0;background:transparent"><img src="file://{sti}" width="{w}" height="{h}" style="display:block"></body></html>')
        ut = UT / navn
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars', f'--screenshot={ut.resolve()}',
                        f'--window-size={w},{h}', '--default-background-color=00000000', f'file://{side}'], check=True, capture_output=True)
    im = Image.open(ut).convert('RGBA')
    im.save(ut, optimize=True)
    print(navn, im.size)


UT.mkdir(parents=True, exist_ok=True)
for lys in (False, True):
    svg, bredde_enh = julen_logo(lys)
    suff = '-lys' if lys else ''
    (UT / f'julen-2026-logo{suff}.svg').write_text(svg)
    for navn, w in (('liten', 400), ('middels', 800), ('stor', 1600)):
        png(svg, f'julen-2026-logo{suff}-{navn}.png', w, round(w * 192 / bredde_enh))
