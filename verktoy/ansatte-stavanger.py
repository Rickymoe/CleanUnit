#!/usr/bin/env python3
"""Fire like store ruter (4:5, 540 × 675 px) til «Ansatte»-remsen på Om oss for Stavanger (Marit 2026-11-13: «kan de 4 bildene settes sammen til en collage som vi gjorde i Oslo»).
Kilden er Thords fire arbeidsbilder (CleanUnit.Dokumenter/Stavanger/13.11.2026: DSC_1243, 1349, 1365 1, 1454 1). Ut: bilder/ansatte-sta-1..4.jpg og .webp.

Personvern: bilde 1 (barnehage) har en liten tavle med portrettbilder til venstre, og bilde 2 (barnehage) en vegg med portretter og en tavle med håndskrevne navn.
Begge portrettveggene ligger utenfor utsnittet. Tavlen med navn bak personen i bilde 2 gjøres uskarp (bare bakgrunnen; personen holdes skarp med en manuelt tegnet maske).

Kjør: python3 verktoy/ansatte-stavanger.py"""
import os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

MAPPE = Path(os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/13.11.2026'))
UT = Path(__file__).resolve().parent.parent / 'bilder'
B, H = 540, 675
# (fil, venstre%, topp%, bredde%) – høyden følger av 4:5. Prosent av det oppsatte (EXIF-roterte) bildet.
RUTER = [
    ('DSC_1243.JPG', 30, 8, 70),      # mopping i barnehage: portrett-tavlen til venstre er utenfor
    ('DSC_1349.JPG', 36, 6, 60),      # vogn og CLEANUNIT-skjorte: portrettveggen til venstre er utenfor, navnetavlen bak hodet gjøres uskarp
    ('DSC_1365 1.JPG', 35.5, 0, 53),  # Odeon: kvinnen med vogna
    ('DSC_1454 1.JPG', 28, 22, 72),   # vask av vask: ansikt, klut og sprayflaske
]


def last(fil):
    return ImageOps.exif_transpose(Image.open(MAPPE / fil).convert('RGB'))


def uskarp_bak_person(im, boks_pst, hode_pst, kropp_pst, sigma=45, kant=14):
    """Gjør bakgrunnen uskarp inne i boksen (prosent av bildet), men holder personen skarp. Personen er en manuelt tegnet maske: hode = ellipse (midt x, midt y, radius x, radius y),
    kropp = rektangel (venstre, topp, høyre, bunn), alt i prosent, med myk kant. Manuell maske, fordi automatisk utskilling (GrabCut) tok med deler av tavlen som «person»."""
    W, Hh = im.size
    maske = Image.new('L', (W, Hh), 0)
    d = ImageDraw.Draw(maske)
    cx, cy, rx, ry = hode_pst
    d.ellipse([(cx - rx) / 100 * W, (cy - ry) / 100 * Hh, (cx + rx) / 100 * W, (cy + ry) / 100 * Hh], fill=255)
    x0, y0, x1, y1 = kropp_pst
    d.rectangle([x0 / 100 * W, y0 / 100 * Hh, x1 / 100 * W, y1 / 100 * Hh], fill=255)
    person = np.asarray(maske.filter(ImageFilter.GaussianBlur(kant))).astype(np.float32) / 255.0
    boks = Image.new('L', (W, Hh), 0)
    bx0, by0, bx1, by1 = boks_pst
    ImageDraw.Draw(boks).rectangle([bx0 / 100 * W, by0 / 100 * Hh, bx1 / 100 * W, by1 / 100 * Hh], fill=255)
    boks = np.asarray(boks.filter(ImageFilter.GaussianBlur(kant))).astype(np.float32) / 255.0
    unsk = np.asarray(im.filter(ImageFilter.GaussianBlur(sigma))).astype(np.float32)
    vekt = (boks * (1 - person))[..., None]
    ut = np.asarray(im).astype(np.float32) * (1 - vekt) + unsk * vekt
    return Image.fromarray(np.clip(ut, 0, 255).astype(np.uint8))


for i, (fil, l, t, bredde) in enumerate(RUTER, 1):
    im = last(fil)
    if fil == 'DSC_1349.JPG':
        im = uskarp_bak_person(im, boks_pst=(57, 0, 98, 41), hode_pst=(68.5, 15, 8.5, 7), kropp_pst=(53, 21, 85.5, 41))
    W, Hh = im.size
    bw = W * bredde / 100
    bh = bw * H / B
    x0, y0 = W * l / 100, Hh * t / 100
    x0 = min(max(0, x0), W - bw)
    y0 = min(max(0, y0), Hh - bh)
    rute = im.crop((int(x0), int(y0), int(x0 + bw), int(y0 + bh))).resize((B, H), Image.LANCZOS)
    rute.save(UT / f'ansatte-sta-{i}.jpg', quality=82, optimize=True, progressive=True)
    rute.save(UT / f'ansatte-sta-{i}.webp', quality=80, method=6)
    print(f'ansatte-sta-{i}', rute.size, fil)
