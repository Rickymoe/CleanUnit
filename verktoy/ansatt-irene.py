#!/usr/bin/env python3
"""Irenes portrett til ansattsitatet på Om oss (Marit 2026-10-14: «Hvilket blir best på nettsiden?»; Ricky prøvde først «Irene 1», så «Irene2»).

Kilden er `Irene2 (1).jpg` (720 × 1280) i CleanUnit.Dokumenter/Oslo/14.10, utenfor repoet. Utsnittet er et kvadrat rundt hodet
(hår og skuldre med), skalert til 288 px (3 × avatarens 96 px, så det er skarpt på 3x-skjermer; var 192 px for 64 px-avataren før Ricky ville ha den større 2026-10-28) og lagret som WebP og JPG.
Metningen dempes litt (0,85): originalen er sterkt mettet (oransje skjerf, rødt lys), og det slo ut mot de dempede fargene på siden.
Avataren rundes av CSS (.sitat-avatar--foto), ikke her.

Kjør fra repo-roten: python3 verktoy/ansatt-irene.py"""
from pathlib import Path
from PIL import Image, ImageEnhance

KILDE = Path('/home/ricky/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/14.10/Irene2 (1).jpg')
UT = Path(__file__).resolve().parent.parent / 'bilder'
RUTE = (80, 30, 720, 670)                 # x0, y0, x1, y1: hodet midtstilt, litt luft over håret

im = Image.open(KILDE).convert('RGB').crop(RUTE).resize((288, 288), Image.LANCZOS)
im = ImageEnhance.Color(im).enhance(0.85)
im.save(UT / 'ansatt-irene.webp', quality=88, method=6)
im.save(UT / 'ansatt-irene.jpg', quality=88, optimize=True)
print(im.size)
