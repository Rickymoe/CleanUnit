#!/usr/bin/env python3
"""Lager jul2026/bilder/jul-oslo-vinter.{jpg,png} og jul-stavanger-vinter.{jpg,png}: vinterbildene med CleanUnit-logoen
på varebilens side. Forsiden legger logoen oppå bildet med CSS (.hero__scene-merke: left 19,4 %, top 68 %, width 5,5 %),
så de blanke bildene i bilder/ er uendret; her tegnes logoen inn permanent, slik at Word-bildet får den også.
Samme plassering som i CSS, målt mot bildet (2172 × 724). Logoen er bilder/logo-cleanunit-varebil-full.svg.
Kjør: python3 verktoy/jul-varebil-logo.py"""
import subprocess, tempfile
from pathlib import Path
from PIL import Image

UT = Path('jul2026/bilder')
LOGO = Path('bilder/logo-cleanunit-varebil-full.svg')
BILDER = [('bilder/hero-scene-vinter.jpg', 'jul-oslo-vinter'), ('bilder/hero-stavanger-vinter.jpg', 'jul-stavanger-vinter')]
VENSTRE, TOPP, BREDDE = 0.194, 0.68, 0.055     # andeler av bildet, fra CSS


def logo_png(bredde_px):
    """Rasteriserer logoen 4× for skarphet med gjennomsiktig bakgrunn, og returnerer den nedskalert til bredde_px."""
    w = bredde_px * 4
    h = round(w * 244 / 626)
    with tempfile.TemporaryDirectory() as tmp:
        side = Path(tmp) / 'logo.html'
        side.write_text(f'<html><body style="margin:0;background:transparent"><img src="file://{LOGO.resolve()}" width="{w}" height="{h}" style="display:block"></body></html>')
        png = Path(tmp) / 'logo.png'
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars',
                        f'--screenshot={png}', f'--window-size={w},{h}', '--default-background-color=00000000',
                        f'file://{side}'], check=True, capture_output=True)
        im = Image.open(png).convert('RGBA')
    return im.resize((bredde_px, round(bredde_px * 244 / 626)), Image.LANCZOS)


UT.mkdir(parents=True, exist_ok=True)
for kilde, navn in BILDER:
    bilde = Image.open(kilde).convert('RGB')
    b, h = bilde.size
    logo = logo_png(round(b * BREDDE))
    bilde.paste(logo, (round(b * VENSTRE), round(h * TOPP)), logo)
    bilde.save(UT / f'{navn}.png', optimize=True)
    bilde.save(UT / f'{navn}.jpg', quality=92, optimize=True)
    print(navn, bilde.size, 'logo', logo.size)
