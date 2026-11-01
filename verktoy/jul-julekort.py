#!/usr/bin/env python3
"""Lager jul2026/bilder/jul-julekort.{png,jpg} (Oslo) og jul-julekort-stavanger.{png,jpg}: ferdig julekort «God jul» (3:2, 2400 × 1600 px) på vinterbildet med himmel.
Utformingen kommer fra «Julekort CleanUnit» i Claude Design (1200 × 800, Fraunces og DM Sans), tegnet her med Chrome uten skjerm i dobbel oppløsning.
Krever nettilgang (skriftene hentes fra Google Fonts) og at verktoy/jul-himmel.py er kjørt.
Kjør: python3 verktoy/jul-julekort.py"""
import subprocess, tempfile
from pathlib import Path
from PIL import Image

UT = Path('jul2026/bilder')
KORT = [('jul-julekort', 'jul-oslo-vinter-himmel'), ('jul-julekort-stavanger', 'jul-stavanger-vinter-himmel')]
B, H, SKALA = 1200, 800, 2
FARGE_TEKST, FARGE_AKSENT = '#0E4A52', '#7A2A5E'

HTML = '''<!doctype html>
<html lang="nb"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&amp;family=DM+Sans:wght@500;700&amp;display=swap">
<style>body{{margin:0}}</style></head><body>
<div style="width:{b}px;height:{h}px;position:relative;overflow:hidden;background-color:#92CFD4;font-family:'DM Sans',sans-serif">
<img src="{bakgrunn}" alt="" style="position:absolute;left:0;top:0;width:{b}px;height:{h}px;object-fit:cover;object-position:center bottom">
<div style="position:absolute;left:0;top:0;width:{b}px;box-sizing:border-box;padding:84px 80px 0 80px;display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center">
<div style="font-size:18px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:{aksent}">CleanUnit ønsker deg</div>
<h1 style="margin:0;font-family:'Fraunces',serif;font-weight:700;font-size:168px;line-height:.95;letter-spacing:-.02em;color:{tekst}">God jul</h1>
<div style="width:72px;height:4px;border-radius:2px;background-color:{aksent}"></div>
<p style="margin:0;max-width:640px;font-size:26px;line-height:1.45;font-weight:500;color:{tekst}">Takk for et godt samarbeid i år. Vi ønsker deg og dine en fredfull juletid og et riktig godt nytt år.</p>
</div></div></body></html>'''

for navn, bakgrunn in KORT:
    with tempfile.TemporaryDirectory() as tmp:
        side = Path(tmp) / 'julekort.html'
        side.write_text(HTML.format(b=B, h=H, bakgrunn=(UT / f'{bakgrunn}.png').resolve().as_uri(), aksent=FARGE_AKSENT, tekst=FARGE_TEKST))
        png = UT / f'{navn}.png'
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
                        f'--screenshot={png.resolve()}', f'--window-size={B},{H}', f'--force-device-scale-factor={SKALA}',
                        '--virtual-time-budget=8000', f'file://{side}'],
                       check=True, capture_output=True)
    im = Image.open(UT / f'{navn}.png').convert('RGB')
    im.save(UT / f'{navn}.png', optimize=True)
    im.save(UT / f'{navn}.jpg', quality=92, optimize=True)
    print(navn, im.size)
