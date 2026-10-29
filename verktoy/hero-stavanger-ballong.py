# Marit 2026-10-29: Stavanger-ballongen skal ha den mørke grønnfargen fra logoen (#008789, den mørke boblen), også i bybildet,
# så Stavanger-sidene henger sammen med logoen. Oslo beholder burgunder.
# Kjør ETTER verktoy/hero-stavanger-hus.py og hero-stavanger-silhuett.py (de lager hero-stavanger*.jpg/.webp av Oslo-scenene,
# der ballongen fortsatt er burgunder). Skriptet er trygt å kjøre flere ganger: det rører bare burgunder piksler.
# Metode: feltene i ballongen (hue 290–350°, mettet) får logofargen skalert med pikselens lysstyrke relativt til medianen,
# så medianpikselen blir nøyaktig #008789 og skygge/lys i ballongen beholdes. Hvite striper og brun kurv berøres ikke.
# Krever Pillow og numpy. Kjør fra repo-roten: python3 verktoy/hero-stavanger-ballong.py
import os
import numpy as np
from PIL import Image

BILDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bilder')
LOGO_GRONN = np.array([0x00, 0x87, 0x89], float)
RUTE = (1400, 70, 1550, 245)  # x0, y0, x1, y1 rundt ballongen (målt: x 1419–1530, y 89–224)


def smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def omfarg(a):
    x0, y0, x1, y1 = RUTE
    d = a[y0:y1, x0:x1].astype(float)
    p = d / 255
    mx, mn = p.max(2), p.min(2)
    dd = np.maximum(mx - mn, 1e-9)
    r, g, b = p[..., 0], p[..., 1], p[..., 2]
    h = np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4)) * 60
    s = dd / np.maximum(mx, 1e-9)
    burgunder = (h > 290) & (h < 350)
    kjerne = burgunder & (s > 0.2)
    v_median = np.median(mx[kjerne])
    vekt = (smooth(s, 0.12, 0.30) * burgunder)[..., None]
    ny = np.clip(LOGO_GRONN * (mx / v_median)[..., None], 0, 255)
    ut = a.copy()
    ut[y0:y1, x0:x1] = (d * (1 - vekt) + ny * vekt).round().astype('uint8')
    return ut, int(kjerne.sum())


for navn in ('hero-stavanger', 'hero-stavanger-vinter'):
    a = np.asarray(Image.open(os.path.join(BILDER, navn + '.jpg')).convert('RGB'))
    ut, antall = omfarg(a)
    bilde = Image.fromarray(ut)
    bilde.save(os.path.join(BILDER, navn + '.jpg'), quality=90, progressive=True, optimize=True)
    bilde.save(os.path.join(BILDER, navn + '.webp'), quality=82, method=6)
    print(navn, antall, 'ballongpiksler omfarget')
