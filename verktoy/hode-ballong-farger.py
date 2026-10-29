#!/usr/bin/env python3
"""Lager bilder/hode-ballong.{png,webp} (Oslo, burgunder) og bilder/hode-ballong-stavanger.{png,webp} (grønn ballong) til sidehodene.

Ricky 2026-10-15: Marit syntes minibyene på sidehodene ble for travle («vi er litt mer clean»), så sidehodene går tilbake til den
rolige luftballongen. Oslo beholder burgunder; Stavanger får grønn ballong, slik Marit foreslo, så byene skiller seg tydeligere.
Samme utsnitt og samme «farge til alfa» som hode-oslo.py, så himmelen er gjennomsiktig og sidehodets gradient skinner gjennom.
Omfargingen flytter bare fargetonen på de burgunder feltene (hue ca. 321°), lysstyrke og skygger beholdes; kurven og de brune
snorene/kurven (hue ca. 25°) berøres ikke. Minibyene ligger urørt i bilder/hode-oslo.* og hode-stavanger.* (git-tag sidehode-miniby).
Kjør fra repo-roten: python3 verktoy/hode-ballong-farger.py"""
import colorsys
from PIL import Image
import numpy as np

KILDE = 'bilder/hero-scene.webp'
RUTE = (1335, 60, 1940, 310)
HIMMEL = np.array([0x9A, 0xD2, 0xD5], float)
LOGO_GRONN = np.array([0x00, 0x87, 0x89], float)   # den mørke boblen i logoen (Marit 2026-10-29); medianpikselen i feltene blir nøyaktig denne
BURGUNDER = (290 / 360, 1.0)            # fargetone-intervall for ballongens felter og beltet (hue i HSV, 0–1); brunt (ca. 25°) er utenfor


def farge_til_alfa(rgb, bakgrunn):
    p = np.clip(rgb, 0, 255)
    opp = np.where(p > bakgrunn, (p - bakgrunn) / np.maximum(255 - bakgrunn, 1), 0)
    ned = np.where(p < bakgrunn, (bakgrunn - p) / np.maximum(bakgrunn, 1), 0)
    alfa = np.maximum(opp, ned).max(axis=2)
    alfa = np.clip((alfa - 0.045) / (1 - 0.045), 0, 1)
    trygg = np.maximum(alfa, 1e-6)[..., None]
    f = bakgrunn + (p - bakgrunn) / trygg
    f = np.where(alfa[..., None] > 1e-6, f, bakgrunn)
    return np.dstack([np.clip(f, 0, 255), alfa * 255]).round().astype('uint8')


def utsnitt():
    a = np.asarray(Image.open(KILDE).convert('RGB').crop(RUTE)).astype(float)
    hjorner = np.concatenate([a[:10, :10].reshape(-1, 3), a[-10:, :10].reshape(-1, 3), a[:10, -10:].reshape(-1, 3)])
    sky = np.median(hjorner, axis=0)
    avstand = np.sqrt(((a - sky) ** 2).sum(axis=2))
    vekt = np.clip(1 - (avstand - 6) / 18, 0, 1)[..., None]
    return a * (1 - vekt) + HIMMEL * vekt


def til_gronn(a):
    ut = a.copy()
    h, w = a.shape[:2]
    felt = []
    for y in range(h):
        for x in range(w):
            r, g, b = a[y, x] / 255
            hh, s, v = colorsys.rgb_to_hsv(r, g, b)
            if (BURGUNDER[0] <= hh <= BURGUNDER[1] or hh < 8 / 360) and s > 0.15:
                felt.append((y, x, v))
    v_median = np.median([v for _, _, v in felt])
    for y, x, v in felt:
        ut[y, x] = np.clip(LOGO_GRONN * (v / v_median), 0, 255)
    return ut


def lagre(a, navn):
    bilde = Image.fromarray(farge_til_alfa(a, HIMMEL), 'RGBA')
    bilde.save(f'bilder/{navn}.webp', quality=90, alpha_quality=100, method=6)
    bilde.save(f'bilder/{navn}.png', optimize=True)
    print(navn, bilde.size)


oslo = utsnitt()
lagre(oslo, 'hode-ballong')
lagre(til_gronn(oslo), 'hode-ballong-stavanger')
