#!/usr/bin/env python3
"""Lager bilder/hode-ballong.{webp,jpg}: utsnitt av hero-scenen (luftballong, sky, boble) til sidehodene.
Himmelen i utsnittet flates ut til nøyaktig --himmel (#9AD2D5), ellers ligger det en svak lysere rute bak bildet.
Kjør: python3 verktoy/hode-ballong.py"""
from PIL import Image
import numpy as np

KILDE = 'bilder/hero-scene.webp'
RUTE = (1335, 60, 1940, 310)           # x0, y0, x1, y1 i scenen (2172 × 724)
HIMMEL = np.array([0x9A, 0xD2, 0xD5], float)

a = np.asarray(Image.open(KILDE).convert('RGB').crop(RUTE)).astype(float)
hjorner = np.concatenate([a[:10, :10].reshape(-1, 3), a[-10:, :10].reshape(-1, 3), a[:10, -10:].reshape(-1, 3)])
sky = np.median(hjorner, axis=0)       # bildets egen himmelfarge, målt i tre hjørner uten motiv
avstand = np.sqrt(((a - sky) ** 2).sum(axis=2))
vekt = np.clip(1 - (avstand - 6) / 18, 0, 1)[..., None]   # 1 = ren himmel, 0 = motiv
ut = Image.fromarray((a * (1 - vekt) + HIMMEL * vekt).round().astype('uint8'))
ut.save('bilder/hode-ballong.webp', quality=84, method=6)
ut.save('bilder/hode-ballong.jpg', quality=86, optimize=True)
print(ut.size)
