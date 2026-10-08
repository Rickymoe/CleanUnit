# Lager Stavanger-scenene (bilder/hero-stavanger*.jpg/.webp) av Oslo-scenene (bilder/hero-scene*.jpg).
# Marit 2026-10-07: «Samme logo og fargebruk som i Oslo, men litt mer burgunder slik at det blir en større forskjell.»
# Samme komposisjon og samme ankere (varebil-logo, sti-start) som Oslo, så ingen CSS-justering per by trengs.
#
# Metode (målt, ikke tegnet på nytt): alle teal-flater på bygningene (tak, skyggesider, vinduer, glasstårnets
# skyggekant) skifter fargetone til Maritts burgunder (#75355D, hue 321°), med lysstyrke og detaljer fra originalen.
# Alt utenfor bygningssonen (x 790–1570, y < 540) er uendret piksel for piksel: himmel, skyline, busker, trær,
# varebil, ballong, barn. Vinterbildets grantrær har samme fargetone som fasadene og holdes utenfor med trekanter.
# Skriptet skriver ut hvor mange piksler som endres utenfor sonen (skal være 0).
# Krever Pillow, numpy og scipy. Kjør fra repo-roten: python3 verktoy/hero-stavanger-burgunder.py
import os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

BILDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bilder')
SONE = (790, 1570, 540)                       # x0, x1, y1 (ovenfor bakkelinja, over buskene)
GRANTRAER = [(1005, 466, 964, 566, 1042, 566), (1125, 463, 1083, 566, 1158, 566), (1440, 468, 1402, 566, 1476, 566)]
BURGUNDER_HUE = 321.0


def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def hsv2rgb(h, s, v):
    c = v * s
    hp = (h % 360) / 60
    x = c * (1 - np.abs(hp % 2 - 1))
    m = v - c
    z = np.zeros_like(h)
    rgb = np.zeros(h.shape + (3,))
    for cond, (r, g, b) in [(hp < 1, (c, x, z)), ((hp >= 1) & (hp < 2), (x, c, z)), ((hp >= 2) & (hp < 3), (z, c, x)),
                            ((hp >= 3) & (hp < 4), (z, x, c)), ((hp >= 4) & (hp < 5), (x, z, c)), (hp >= 5, (c, z, x))]:
        rgb[cond] = np.stack([r, g, b], -1)[cond]
    return rgb + m[..., None]


def trekant(xx, yy, ax, ay, bx, by, cx, cy):
    def side(px, py, qx, qy):
        return (xx - qx) * (py - qy) - (px - qx) * (yy - qy)
    d1, d2, d3 = side(ax, ay, bx, by), side(bx, by, cx, cy), side(cx, cy, ax, ay)
    return (~(((d1 < 0) | (d2 < 0) | (d3 < 0)) & ((d1 > 0) | (d2 > 0) | (d3 > 0)))).astype(np.float64)


def lag_stavanger(kilde, vinter):
    a = np.asarray(Image.open(kilde).convert('RGB')).astype(np.float64) / 255
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    mx, mn = a.max(2), a.min(2)
    d = np.maximum(mx - mn, 1e-9)
    s = (mx - mn) / np.maximum(mx, 1e-9)
    v = mx
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    hoyde, bredde = h.shape
    yy, xx = np.mgrid[0:hoyde, 0:bredde]
    x0, x1, y1 = SONE
    sone = ((xx >= x0) & (xx <= x1) & (yy < y1)).astype(np.float64)
    if vinter:
        trær = np.zeros_like(sone)
        for t in GRANTRAER:
            trær += trekant(xx, yy, *t)
        sone = sone * (1 - np.clip(gaussian_filter(np.clip(trær, 0, 1), 1.5) * 1.5, 0, 1))
    teal = smooth(h, 160, 168) * (1 - smooth(h, 196, 204)) * smooth(s, 0.30, 0.45) * sone
    ny = hsv2rgb(np.full_like(h, BURGUNDER_HUE), np.clip(s * 0.78, 0, 0.62), np.clip(v * 0.80, 0, 1))
    ut = a * (1 - teal[..., None]) + ny * teal[..., None]
    utenfor = int(((np.abs(ut - a).max(2) > 2 / 255) & (sone == 0)).sum())
    print(f'{os.path.basename(kilde)}: endret i sonen {int((np.abs(ut - a).max(2) > 2 / 255).sum())} piksler, utenfor sonen {utenfor} (skal være 0)')
    assert utenfor == 0
    return Image.fromarray((np.clip(ut, 0, 1) * 255 + 0.5).astype(np.uint8))


for kilde, mål, vinter in [('hero-scene', 'hero-stavanger', False), ('hero-scene-vinter', 'hero-stavanger-vinter', True)]:
    bilde = lag_stavanger(os.path.join(BILDER, kilde + '.jpg'), vinter)
    bilde.save(os.path.join(BILDER, mål + '.jpg'), quality=90, progressive=True, optimize=True)
    bilde.save(os.path.join(BILDER, mål + '.webp'), quality=82, method=6)
