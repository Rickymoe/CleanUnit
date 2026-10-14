#!/usr/bin/env python3
"""Konverterer kundelogoene Marit sendte for Stavanger (2026-10-12) til
nettvennlige filer i bilder/.

Kilden er tre JPG-er i CleanUnit.Dokumenter/Stavanger — utenfor repoet, så de
konverteres én gang og sjekkes inn. Skriptet ligger her for å vise hvor de kom
fra og hvordan de ble behandlet.

Bakgrunnen tvinges til ren hvit: Breitorget-logoen er klippet ut av et dokument
og har en beige bakgrunn (~240) som ville syntes som et rektangel mot de hvite
sitatkortene. De to andre har allerede hvit bakgrunn, og der er skalaen 1,0 —
altså uendret. Skaleringen er den samme i alle kanaler, så fargetoner beholdes.

WebP lagres tapsfritt: logoene er skarp tekst, og ved 192 px visningsbredde er
en tapsrik kompresjon synlig som grums rundt bokstavene.

Kjør: python3 verktoy/kundelogoer-stavanger.py
"""

from pathlib import Path

import numpy as np
from PIL import Image

KILDE = Path('/home/ricky/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger')
UT = Path(__file__).resolve().parent.parent / 'bilder'

# (kildefil, filnavn uten endelse)
LOGOER = [
    # Dragaberget: erstattet 2026-10-14 av en større PNG, se verktoy/logo-dragaberget.py
    ('Breitorget.jpg', 'logo-breitorget'),
    ('Storhaug.jpeg', 'logo-storhaug'),
]

for kilde, slug in LOGOER:
    im = Image.open(KILDE / kilde).convert('RGB')
    a = np.asarray(im).astype(np.float32)

    # Bakgrunnen leses fra kanten av bildet, der logoen ikke har innhold.
    # Persentiler over hele bildet duger ikke: JPEG-støyen legger noen få rene
    # hvite piksler inn i det beige, og da bommer 99-persentilen på bakgrunnen.
    kant = np.median(np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]), axis=0)

    # Bare Breitorget treffer denne grenen — den er klippet ut av et dokument og
    # ligger på beige (~240), som ville syntes som et rektangel mot det hvite
    # kortet. Hver kanal strekkes til kanten blir ren hvit, og resten av
    # bakgrunnsstøyen klippes. Logoen er et svart ordmerke, så kanalforskyvningen
    # er uten betydning; Dragaberget og Storhaug har allerede hvit bakgrunn.
    if kant.min() < 250:
        a = np.clip(a * (255.0 / kant), 0, 255)
        a[a.min(axis=2) >= 240] = 255

    a = a.astype(np.uint8)
    ut = Image.fromarray(a)
    ut.save(UT / f'{slug}.png', optimize=True)
    ut.save(UT / f'{slug}.webp', lossless=True, method=6)

    print(f'{kilde:24} {im.size[0]}x{im.size[1]}  →  {slug}.png/.webp  '
          f'({(UT / f"{slug}.webp").stat().st_size / 1024:.0f} KB webp, '
          f'bakgrunn {kant.astype(int).tolist()})')
