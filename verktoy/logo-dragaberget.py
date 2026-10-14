#!/usr/bin/env python3
"""Dragaberget barnehages logo (Marit 2026-10-14: logoen sendt som PNG, «er det kanskje den svarte bakgrunnen som ikke fungerer?»).

Kilden er `Dragaberget logo.png` (482 × 424, gjennomsiktig bakgrunn) i CleanUnit.Dokumenter/Oslo/14.10, utenfor repoet. Den gamle
logoen (203 × 177 JPG) var for liten til sitatkortet og kunderaden. Tomrommet rundt tegnet beskjæres bort, så boksene måler logoen og
ikke luften rundt. WebP lagres tapsfritt (skarpe flater og tekst).

Erstatter Dragaberget-linjen i verktoy/kundelogoer-stavanger.py (den er fjernet derfra, ellers ville en ny kjøring skrevet over denne).

Kjør fra repo-roten: python3 verktoy/logo-dragaberget.py"""
from pathlib import Path
from PIL import Image

KILDE = Path('/home/ricky/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/14.10/Dragaberget logo.png')
UT = Path(__file__).resolve().parent.parent / 'bilder'

im = Image.open(KILDE).convert('RGBA')
im = im.crop(im.split()[3].getbbox())
im.save(UT / 'logo-dragaberget.png', optimize=True)
im.save(UT / 'logo-dragaberget.webp', lossless=True, method=6)
print('logo-dragaberget', im.size)
