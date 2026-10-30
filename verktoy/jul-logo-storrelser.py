#!/usr/bin/env python3
"""Lager jul2026/bilder/logo/cleanunit-logo-{liten,middels,stor}.png og cleanunit-logo-lys-{liten,middels,stor}.png:
selve logoen alene som gjennomsiktig PNG i tre størrelser (400, 800 og 1600 px bred). «lys» er utgaven med hvit tekst til
mørk bakgrunn (bilder/logo-cleanunit-lys.svg). Hver størrelse rasteriseres rett fra SVG-en, ikke nedskalert fra den største,
så den er skarp. Kjør: python3 verktoy/jul-logo-storrelser.py"""
import subprocess, tempfile
from pathlib import Path
from PIL import Image

UT = Path('jul2026/bilder/logo')
SVG = {'': 'bilder/logo-cleanunit.svg', '-lys': 'bilder/logo-cleanunit-lys.svg'}
STORRELSER = {'liten': 400, 'middels': 800, 'stor': 1600}
SIDEFORHOLD = 192 / 626                      # viewBox 0 -40 626 192


def render(svg, bredde, ut):
    hoyde = round(bredde * SIDEFORHOLD)
    with tempfile.TemporaryDirectory() as tmp:
        side = Path(tmp) / 'logo.html'
        side.write_text(f'<html><body style="margin:0;background:transparent"><img src="file://{Path(svg).resolve()}" width="{bredde}" height="{hoyde}" style="display:block"></body></html>')
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars', f'--screenshot={ut.resolve()}',
                        f'--window-size={bredde},{hoyde}', '--default-background-color=00000000', f'file://{side}'],
                       check=True, capture_output=True)
    im = Image.open(ut).convert('RGBA')
    im.save(ut, optimize=True)
    return im


UT.mkdir(parents=True, exist_ok=True)
for variant, svg in SVG.items():
    for navn, bredde in STORRELSER.items():
        ut = UT / f'cleanunit-logo{variant}-{navn}.png'
        im = render(svg, bredde, ut)
        alfa = im.getchannel('A')
        print(ut.name, im.size, 'gjennomsiktig:', alfa.getextrema()[0] == 0)
