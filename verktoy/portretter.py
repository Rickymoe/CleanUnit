#!/usr/bin/env python3
"""Portrettene til «Om oss» og «Kontakt» (Oslo), fra Marits originaler 28.10.2026.

Kjør:  python3 verktoy/portretter.py [ut-mappe]      (standard: bilder/)
Per person: team-<navn>.webp/.jpg (480 px, «Om oss»-kortet) og team-<navn>-liten.webp/.jpg (240 px,
Kontakt-raden, videre utsnitt fordi det vises som 72 px rundt). Monika: ansatt-monika.webp/.jpg (288 px,
sitat-avataren, 288 px = 3 × 96 px).

Utsnittene er firkanter angitt som (senter-x, topp-y, side) i originalens piksler, målt fra miniatyrer.
Sjekk alltid hårtoppen mot originalens topprader etter å ha endret et utsnitt."""
import glob
import os
import sys
from PIL import Image, ImageOps

MAPPE = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/28.10.2026.bilder')
UT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'bilder')

# (fil, {variant: (senter_x, topp_y, side)}, utstørrelse per variant)
PERSONER = {
    'guro':  ('GURO_1_FARGE.jpg',  {'': (1730, 100, 3300), 'liten': (1730, 100, 3456)}),
    'marit': ('MARIT_1_FARGE.jpg', {'': (1710, 330, 3300), 'liten': (1710, 280, 3456)}),
    'mari':  ('MARI_1_FARGE.jpg',  {'': (1780, 0, 3300), 'liten': (1780, 0, 3456)}),
    'age':   ('ÅGE_2_FARGE.jpg',   {'': (1680, 250, 3300), 'liten': (1680, 200, 3456)}),
}
MONIKA = ('Monika S.jpeg', (770, 30, 720))


def finn(navn):
    treff = glob.glob(os.path.join(MAPPE, navn))
    if not treff:
        raise SystemExit(f'fant ikke {navn} i {MAPPE}')
    return Image.open(treff[0]).convert('RGB')


def utsnitt(im, senter_x, topp, side, px):
    # Utsnittet må ligge innenfor originalen: utenfor blir det svart kant ved siden av lyse klær.
    side = int(min(side, im.width, im.height))
    x0 = max(0, min(int(senter_x - side / 2), im.width - side))
    y0 = max(0, min(int(topp), im.height - side))
    boks = (x0, y0, x0 + side, y0 + side)
    return im.crop(boks).resize((px, px), Image.LANCZOS)


def lagre(im, stamme):
    im.save(f'{stamme}.webp', quality=82, method=6)
    im.save(f'{stamme}.jpg', quality=84, optimize=True, progressive=True)


for navn, (fil, varianter) in PERSONER.items():
    im = ImageOps.exif_transpose(finn(fil))
    for v, (sx, ty, s) in varianter.items():
        lagre(utsnitt(im, sx, ty, s, 240 if v else 480), os.path.join(UT, f'team-{navn}{"-" + v if v else ""}'))

fil, (sx, ty, s) = MONIKA
lagre(utsnitt(ImageOps.exif_transpose(finn(fil)), sx, ty, s, 288), os.path.join(UT, 'ansatt-monika'))
