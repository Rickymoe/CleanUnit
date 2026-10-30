#!/usr/bin/env python3
"""Lager jul2026/bilder/jul-oslo-kveld.{jpg,png} og jul-stavanger-kveld.{jpg,png}: vinterbildene (med logo på varebilen)
gjort om til nattbilder. Dagbildet farges blått og mørknes, de gule lysene (vinduer, lyslenker, sola som blir til måne) holdes
lyse og får en myk glød, og det legges på stjerner. Rent bildebehandling, ingen ny tegning.
Utgangspunkt er de blanke dagbildene i bilder/. Logoen på varebilen tegnes inn til slutt i en lys utgave med svak glød, slik at den
er lett å lese mot den mørklagte bilen (plassering som på forsiden, se jul-varebil-logo.py). Kjør: python3 verktoy/jul-by-kveld.py"""
import re, subprocess, tempfile
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

UT = 'jul2026/bilder'
TINT = np.array([0.30, 0.46, 0.62])         # dagfargene ganges med dette: blå natt
BILDER = [('bilder/hero-scene-vinter.jpg', 'jul-oslo-kveld'), ('bilder/hero-stavanger-vinter.jpg', 'jul-stavanger-kveld')]
VENSTRE, TOPP, BREDDE = 0.194, 0.68, 0.055   # logoens plass på varebilen, andeler av bildet (fra CSS .hero__scene-merke)
LYSE_FARGER = {'#3E4A4A': '#FFFFFF', '#008789': '#7FDAD6', '#3AAFAF': '#A6E6E2', '#2FA3A3': '#A6E6E2'}


def lys_logo(bredde_px):
    """Varebil-logoen i lyse farger, rasterisert 4× med gjennomsiktig bakgrunn og nedskalert."""
    svg = Path('bilder/logo-cleanunit-varebil-full.svg').read_text()
    for gammel, ny in LYSE_FARGER.items():
        svg = svg.replace(gammel, ny)
    w = bredde_px * 4
    h = round(w * 244 / 626)
    with tempfile.TemporaryDirectory() as tmp:
        sti = Path(tmp) / 'logo.svg'
        sti.write_text(svg)
        side = Path(tmp) / 'logo.html'
        side.write_text(f'<html><body style="margin:0;background:transparent"><img src="file://{sti}" width="{w}" height="{h}" style="display:block"></body></html>')
        png = Path(tmp) / 'logo.png'
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars', f'--screenshot={png}',
                        f'--window-size={w},{h}', '--default-background-color=00000000', f'file://{side}'], check=True, capture_output=True)
        im = Image.open(png).convert('RGBA')
    return im.resize((bredde_px, round(bredde_px * 244 / 626)), Image.LANCZOS)



def natt(kilde, navn_ut, seed):
    dag = np.asarray(Image.open(kilde).convert('RGB')).astype(np.float64)
    h, w = dag.shape[:2]
    r, g, b = dag[..., 0], dag[..., 1], dag[..., 2]
    lys = np.clip(((r - b) - 60) / 60, 0, 1) * np.clip((r - 190) / 40, 0, 1)      # gule/varme, lyse flater: vinduer, lys, sol
    lys = gaussian_filter(lys, 0.7)[..., None]
    mork = np.clip(dag * TINT, 0, 255)
    mork = mork ** 1.0
    ut = mork * (1 - lys) + np.clip(dag * 1.02, 0, 255) * lys
    glod = sum(gaussian_filter(lys[..., 0], s)[..., None] * k for s, k in ((6, .9), (18, .7), (44, .5)))
    ut = ut + glod * np.array([255, 190, 90]) * .55                              # varm glød rundt lysene
    # nattehimmelen blir litt mørkere øverst
    ut *= (0.72 + 0.28 * np.linspace(0, 1, h)[:, None, None] ** 0.8)
    rng = np.random.default_rng(seed)
    himmel = np.asarray(Image.open(kilde).convert('RGB'))[:, :, 2] > 180      # lys blå himmel i dagbildet
    for _ in range(140):                                                          # stjerner, bare der det er himmel
        x, y = int(rng.uniform(0, w)), int(rng.uniform(0, h * .42))
        if himmel[y, x]:
            rad = rng.choice([1, 1, 2, 2, 3])
            yy, xx = np.ogrid[-rad:rad + 1, -rad:rad + 1]
            m = (xx * xx + yy * yy) <= rad * rad
            y0, y1, x0, x1 = max(y - rad, 0), min(y + rad + 1, h), max(x - rad, 0), min(x + rad + 1, w)
            mm = m[(y0 - y + rad):(y1 - y + rad), (x0 - x + rad):(x1 - x + rad)]
            ut[y0:y1, x0:x1][mm] = np.maximum(ut[y0:y1, x0:x1][mm], 230)
    bilde = Image.fromarray(np.clip(ut, 0, 255).round().astype('uint8')).convert('RGBA')
    logo = lys_logo(round(w * BREDDE))
    pos = (round(w * VENSTRE), round(h * TOPP))
    glod_laget = Image.new('RGBA', bilde.size, (0, 0, 0, 0))
    glod_laget.paste(logo, pos, logo)
    a = gaussian_filter(np.asarray(glod_laget)[..., 3].astype(float), 7) * 1.1
    glod = np.zeros((h, w, 4), 'uint8')
    glod[..., :3] = (255, 240, 200)
    glod[..., 3] = np.clip(a * .55, 0, 255).astype('uint8')
    bilde = Image.alpha_composite(bilde, Image.fromarray(glod))
    bilde.alpha_composite(logo, pos)
    bilde = bilde.convert('RGB')
    bilde.save(f'{UT}/{navn_ut}.png', optimize=True)
    bilde.save(f'{UT}/{navn_ut}.jpg', quality=92, optimize=True)
    print(navn_ut, bilde.size)


for i, (kilde, ut) in enumerate(BILDER):
    natt(kilde, ut, 100 + i)
