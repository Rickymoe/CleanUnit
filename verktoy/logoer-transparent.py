#!/usr/bin/env python3
"""Gjør den hvite bakgrunnen i referanselogoene på forsiden og Referanser gjennomsiktig (Marit 2026-11-17: «Kan hvit farge i logoene endres til transparent?
Det vil gjøre at mouseover-effekten ser bedre ut. Odeon og Dragaberget har det allerede.»). Gjelder BSN, Kristelig Gymnasium, Kanvas, Medistim, Pioner, Stålverkskroken,
Vitenskapelig høyskole (MF), Breitorget, Storhaug og Union (Medistim ble med samme dag, da Ricky så hvitt mellom bokstavene).

Originalene (hvit bakgrunn) ligger utenfor repoet i CleanUnit.Dokumenter/Oslo/17.11.2026/originale-referanselogoer, og skriptet leser dem derfra og skriver til bilder/ (PNG og tapsfri WebP).
Metode («farge til alfa» mot hvitt): gjennomsiktigheten er hvor langt hver piksel er fra hvitt, og fargen regnes ut igjen slik at logoen er uendret mot hvit bakgrunn og kantene er myke mot farget bakgrunn.
Pioner og Stålverkskroken har hvite flater inne i tegningene (ansikter, øyne) som skal bli stående hvite; der blir bare bakgrunnen koblet til bildekanten gjennomsiktig.

Kjør: python3 verktoy/logoer-transparent.py"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ORIG = Path('/home/ricky/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/17.11.2026/originale-referanselogoer')
UT = Path(__file__).resolve().parent.parent / 'bilder'
ALLE = ['bsn', 'kg', 'kanvas', 'medistim', 'pioner', 'staalverkskroken', 'mf', 'breitorget', 'storhaug', 'union']
BARE_KANT = {'pioner', 'staalverkskroken'}   # hvite flater inni tegningen beholdes
TOL = 12                                      # «nesten hvit» = alle kanaler ≥ 255 − TOL


def til_alfa(im, bare_kant):
    orig = np.asarray(im.convert('RGB')).astype(np.float32)
    alfa = np.clip(((255 - orig) / 255).max(-1), 0, 1)
    s = np.maximum(alfa, 1e-3)[..., None]
    farge = np.clip(255 + (orig - 255) / s, 0, 255)
    ut = np.zeros(orig.shape[:2] + (4,), np.float32)
    if not bare_kant:
        ut[..., :3], ut[..., 3] = farge, alfa * 255
    else:
        hvit = (orig >= 255 - TOL).all(-1)
        lab, _ = ndi.label(hvit)
        kant = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
        bak = np.isin(lab, list(kant))
        rand = ndi.binary_dilation(bak, iterations=1)     # ett piksel inn i kantene: myk overgang
        ut[..., :3], ut[..., 3] = orig, 255
        ut[rand, :3], ut[rand, 3] = farge[rand], alfa[rand] * 255
        ut[bak, 3] = 0
    return Image.fromarray(ut.round().astype(np.uint8), 'RGBA')


for n in ALLE:
    r = til_alfa(Image.open(ORIG / f'logo-{n}.png'), n in BARE_KANT)
    r.save(UT / f'logo-{n}.png', optimize=True)
    r.save(UT / f'logo-{n}.webp', lossless=True, method=6)
    print(n, r.size, (UT / f'logo-{n}.png').stat().st_size, (UT / f'logo-{n}.webp').stat().st_size)
