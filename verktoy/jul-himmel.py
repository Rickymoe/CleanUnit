#!/usr/bin/env python3
"""Lager jul2026/bilder/jul-{oslo,stavanger}-{vinter,kveld}-himmel.{png,jpg}: vinterbybildene med 724 px ekstra himmel
over byen (2172 × 1448), med mer himmel å jobbe med i et julekort.
Byen er uendret nederst; himmelen forlenger bakgrunnen i originalen (flat om dagen, mørkere gradient om kvelden)
og får snøfnugg (dag) eller snøfnugg, stjerner og svake lysglimt (kveld) i samme stil.
Kjør: python3 verktoy/jul-himmel.py"""
import random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

UT = Path('jul2026/bilder')
EKSTRA = 724
SS = 4  # supersampling, for glatte fnugg


def prikker(b, h, seed, rader):
    """Hvite prikker jevnt fordelt. rader = [(antall, radiusvalg, dekning (min, maks), uskarphet)]; ett lag per rad."""
    r = random.Random(seed)
    lag = []
    for n, radier, (a0, a1), uskarp in rader:
        bilde = Image.new('L', (b * SS, h * SS), 0)
        d = ImageDraw.Draw(bilde)
        for _ in range(n):
            x, y = r.uniform(0, b), r.uniform(0, h - 10)  # unna nedre kant, så ingen kuttes i skjøten mot byen
            rad = r.choice(radier)
            a = int(255 * r.uniform(a0, a1))
            d.ellipse([(x - rad) * SS, (y - rad) * SS, (x + rad) * SS, (y + rad) * SS], fill=a)
        bilde = bilde.resize((b, h), Image.LANCZOS)
        lag.append(bilde.filter(ImageFilter.GaussianBlur(uskarp)) if uskarp else bilde)
    return lag


def himmelflate(orig, kveld, seed):
    """Bakgrunn til de nye 724 px: flat om dagen, om kvelden gradienten i originalen forlenget oppover."""
    a = np.array(orig).astype(float)
    b = a.shape[1]
    rng = np.random.default_rng(seed)
    if not kveld:
        farge = np.median(a[:40].reshape(-1, 3), axis=0)
        flate = np.tile(farge, (EKSTRA, b, 1))
        stoy = 1.2  # samme svake støy som originalen
    else:
        rader = np.median(a[:150], axis=1)  # median per rad: stjerner og fnugg påvirker ikke
        y = np.arange(150)
        trend = np.stack([np.polyval(np.polyfit(y, rader[:, k], 1), np.arange(-EKSTRA, 0)) for k in range(3)], axis=1)
        flate = np.tile(trend[:, None, :], (1, b, 1))
        stoy = .8
    return Image.fromarray(np.clip(flate + rng.normal(0, stoy, (EKSTRA, b, 1)), 0, 255).astype('uint8'), 'RGB')


def rens_kant(orig, rader=10):
    """Maler over lyse prikker (stjerner/fnugg) i de øverste radene med himmelfargen ved siden av, uten å røre resten av bildet."""
    a = np.array(orig)
    topp = a[:rader].astype(int)
    himmel = np.median(topp.reshape(-1, 3), axis=0)  # bakgrunnen dominerer, så medianen er himmelfargen
    lys = Image.fromarray(((topp.min(2) > 80) * 255).astype('uint8')).filter(ImageFilter.MaxFilter(7))
    maske = np.array(lys) > 0
    a[:rader][maske] = himmel.astype('uint8')
    return Image.fromarray(a, 'RGB')


def lag_himmel(kilde, ut, seed, kveld=False):
    orig = Image.open(UT / f'{kilde}.png').convert('RGB')
    b, h = orig.size
    himmel = himmelflate(orig, kveld, seed)
    if kveld:
        glimt, stjerner, fnugg = prikker(b, EKSTRA, seed, [
            (40, [5, 6, 7, 8], (.05, .12), 3),            # svake, uskarpe lysglimt
            (230, [1.2, 1.5, 2, 2.5, 3], (.75, 1), 0),    # stjerner
            (90, [2.5, 3, 3.5, 4], (.4, .8), 0),          # snøfnugg
        ])
        for maske in (glimt, stjerner, fnugg):
            himmel.paste((255, 255, 255), mask=maske)
    else:
        (fnugg,) = prikker(b, EKSTRA, seed, [(190, [2.5, 3, 3.5, 4, 5, 6.5], (.55, .95), 0)])
        himmel.paste((255, 255, 255), mask=fnugg)
    if kveld:  # stjerner som er kuttet av bildekanten øverst i originalen ville blitt halve i skjøten
        orig = rens_kant(orig)
    bilde = Image.new('RGB', (b, h + EKSTRA))
    bilde.paste(himmel, (0, 0))
    bilde.paste(orig, (0, EKSTRA))
    bilde.save(UT / f'{ut}.png', optimize=True)
    bilde.save(UT / f'{ut}.jpg', quality=92, optimize=True)
    print(ut, bilde.size)


if __name__ == '__main__':
    lag_himmel('jul-oslo-vinter', 'jul-oslo-vinter-himmel', seed=2026)
    lag_himmel('jul-stavanger-vinter', 'jul-stavanger-vinter-himmel', seed=2027)
    lag_himmel('jul-oslo-kveld', 'jul-oslo-kveld-himmel', seed=2028, kveld=True)
    lag_himmel('jul-stavanger-kveld', 'jul-stavanger-kveld-himmel', seed=2029, kveld=True)
