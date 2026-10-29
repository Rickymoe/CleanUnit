#!/usr/bin/env python3
"""Irenes portrett til ansattsitatet på Om oss (Marit 2026-10-14: «Hvilket blir best på nettsiden?»; Ricky prøvde først «Irene 1», så «Irene2»).

Kilden er `Irene2 (1).jpg` (720 × 1280) i CleanUnit.Dokumenter/Oslo/14.10, utenfor repoet. Utsnittet (840 px, med utvidet bakgrunn, se utvid_sidene) er et kvadrat rundt hodet
(hår og skuldre med), skalert til 288 px (3 × avatarens 96 px, så det er skarpt på 3x-skjermer; var 192 px for 64 px-avataren før Ricky ville ha den større 2026-10-28) og lagret som WebP og JPG.
Metningen dempes litt (0,85): originalen er sterkt mettet (oransje skjerf, rødt lys), og det slo ut mot de dempede fargene på siden.
Avataren rundes av CSS (.sitat-avatar--foto), ikke her.

Kjør fra repo-roten: python3 verktoy/ansatt-irene.py"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

KILDE = Path('/home/ricky/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/14.10/Irene2 (1).jpg')
UT = Path(__file__).resolve().parent.parent / 'bilder'
SIDE = 840                                # utsnittets side i originalens piksler (Marit 2026-10-29: «zoomes litt ut»; var 640)


def utvid_sidene(im, side):
    # Originalen er bare 720 px bred. Et videre utsnitt trenger bakgrunn på sidene: kantene speiles og gjøres uskarpe
    # (bakgrunnen er allerede uskarp, så skjøten syns ikke). Hodet og skjerfet ligger langt fra kantene.
    ekstra = (side - im.width) // 2
    stor = Image.fromarray(np.pad(np.asarray(im), ((0, 0), (ekstra, ekstra), (0, 0)), mode='reflect'))
    maske = Image.new('L', stor.size, 0)
    tegn = ImageDraw.Draw(maske)
    tegn.rectangle((0, 0, ekstra, stor.height), fill=255)
    tegn.rectangle((stor.width - ekstra, 0, stor.width, stor.height), fill=255)
    return Image.composite(stor.filter(ImageFilter.GaussianBlur(25)), stor, maske.filter(ImageFilter.GaussianBlur(20)))


im = utvid_sidene(Image.open(KILDE).convert('RGB'), SIDE).crop((0, 0, SIDE, SIDE)).resize((288, 288), Image.LANCZOS)
im = ImageEnhance.Color(im).enhance(0.85)
im.save(UT / 'ansatt-irene.webp', quality=88, method=6)
im.save(UT / 'ansatt-irene.jpg', quality=88, optimize=True)
print(im.size)
