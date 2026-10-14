#!/usr/bin/env python3
"""Odeon-logoen til Håvard Ergas referanse (Stavanger), sendt av Marit 2026-10-14.

Kilden er `ODEON_LOGO_CMYK.png` (Odeons blå, gjennomsiktig bakgrunn) i
CleanUnit.Dokumenter/Stavanger, utenfor repoet. Filen har 19–20 px tomrom rundt
ordmerket; det beskjæres bort så logoboksene i kunderaden og på sitatkortet
måler selve logoen, ikke luften rundt.

Kjør: python3 verktoy/logo-odeon.py
"""

from pathlib import Path

from PIL import Image

KILDE = Path('/home/ricky/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/ODEON_LOGO_CMYK.png')
UT = Path(__file__).resolve().parent.parent / 'bilder'

im = Image.open(KILDE).convert('RGBA')
im = im.crop(im.split()[3].getbbox())
im.save(UT / 'logo-odeon.png', optimize=True)
im.save(UT / 'logo-odeon.webp', lossless=True, method=6)
print('logo-odeon', im.size)
