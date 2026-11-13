#!/usr/bin/env python3
"""Portrettene til «Om oss» og «Kontakt» (Oslo), fra Marits originaler 28.10.2026.

Kjør:  python3 verktoy/portretter.py [ut-mappe]      (standard: bilder/)
Per person: team-<navn>.webp/.jpg (480 px, «Om oss»-kortet) og team-<navn>-liten.webp/.jpg (240 px,
Kontakt-raden, videre utsnitt fordi det vises som 72 px rundt). Monika og de andre sitat-avatarene (Vilma, Thora, Anna, Fabiana): ansatt-<navn>.webp/.jpg
(288 px, sitat-avatarene, 288 px = 3 × 96 px). Originalene er fra Marit (Vilma 02.11.2026, Stavanger 09.11.2026), se SITATFOTO.

Utsnittene er firkanter angitt som (senter-x, topp-y, side) i originalens piksler, målt fra miniatyrer.
Sjekk alltid hårtoppen mot originalens topprader etter å ha endret et utsnitt."""
import glob
import os
import subprocess
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

MAPPE = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/28.10.2026.bilder')
UT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'bilder')

# (fil, {variant: (senter_x, topp_y, side)}, utstørrelse per variant)
PERSONER = {
    'guro':  ('GURO_1_FARGE.jpg',  {'': (1730, 100, 3300), 'liten': (1730, 100, 3456)}),
    'marit': ('MARIT_1_FARGE.jpg', {'': (1710, 330, 3300), 'liten': (1710, 280, 3456)}),
    'mari':  ('MARI_1_FARGE.jpg',  {'': (1780, 0, 3300), 'liten': (1780, 0, 3456)}),
    'age':   ('ÅGE_2_FARGE.jpg',   {'': (1680, 250, 3300), 'liten': (1680, 200, 3456)}),
}
# Monika: Marits forslag 02.11.2026 («mer ansikt»), funnet igjen i originalen ved mønstergjenkjenning: 855 px, x 330, y 169 (nederst i bildet).
MONIKA = ('Monika S.jpeg', (757, 169, 855))
MAPPE_VILMA = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Oslo/02.11.2026.bilder')
MAPPE_STAVANGER = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/09.11.2026.bilder')
MAPPE_STAVANGER_KONTAKT = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/09.11.2026.bilder og doks')
MAPPE_STAVANGER_NY = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/10.11.2026.bilder')   # nye bilder av Thora og Anna (Marit 10.11.2026)
# Sitat-avatarene som ikke er Monika: (mappe, fil, (senter_x, topp_y, side)), 288 px. Vilma (Oslo): litt videre enn bredden (sidene utvides), så hodet blir like stort som Irenes og Monikas.
# Stavanger (Marit 09.11.2026): Thora, Anna og Fabiana. Thoras bilde er et strandbilde i profil med en annen person bak (Marit var usikker på det); utsnittet er så stramt som mulig.
SITATFOTO = {
    'vilma':    (MAPPE_VILMA, 'Vilma.jpeg', (660, 0, 1480)),
    'thora':    (MAPPE_STAVANGER_NY, 'Thora bilde1 (lys).jpg', (724, 89, 784)),   # nytt bilde 10.11. (ser mot kamera; det første var strandbildet i profil), lysjustert i GIMP: se lag_lys_thora(). Utsnitt 784 px = samme ansiktsforhold (0,48) som Fabiana: ansiktsboksen er 376 px (rotert ansiktsgjenkjenning)
    'anna':     (MAPPE_STAVANGER_NY, 'Anna bilde netsiden1.jpeg', (432, 480, 240)),   # nytt bilde 10.11. (hel figur utendørs; lite ansikt i originalen, så utsnittet er ikke strammere enn dette)
    'fabiana':  (MAPPE_STAVANGER, 'Fabianabilde.jpg', (1376, 330, 3100)),
}

# Kontaktpersonene i Stavanger (Marit 09.11.2026): team-<navn>-liten.webp/.jpg (240 px, Kontakt-raden) og team-<navn>.webp/.jpg (480 px, Om oss-kortet), som Oslo-kontaktene. (mappe, fil, rotasjon i grader, luft over hodet i piksler, (senter_x, topp_y, side)). Er luft > 0, gjelder topp_y det forlengede bildet.
# Utsnittene er målt til samme ansiktsforhold (ansiktsboks / utsnitt ca. 0,49) som Oslo-kontaktene. Thords original er lagret liggende, så den roteres 90° med klokka;
# Aleksandras utsnitt er videre enn originalen (sidene utvides).
KONTAKTFOTO = {
    'thord':      (MAPPE_STAVANGER_KONTAKT, 'Thord.jpg', -90, 0, (1234, 581, 1416)),   # Kontakt (240) og Om oss (480)
    'aleksandra': (MAPPE_STAVANGER_KONTAKT, 'Aleksandra.jpg', 0, 420, (1458, 100, 3657)),   # bare Om oss (480), ikke Kontakt (Marit 2026-11-13). Hodetoppen er kuttet i originalen: veggen forlenges 420 px, utsnittet starter 100 px ned (ca. 9 % luft)
}


def lag_lys_thora():
    # Thoras bilde (mørkt webkamerabilde) lysjusteres i GIMP (variant B, Ricky 2026-11-10). Kjører GIMP uten grensesnitt hvis den justerte kopien mangler eller er eldre enn skriptet.
    # Bruker /usr/bin/gimp (apt): snap-versjonen henger uten grensesnitt.
    skript = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'gimp-lys-thora.py')
    ut = os.path.join(MAPPE_STAVANGER_NY, 'Thora bilde1 (lys).jpg')
    if os.path.exists(ut) and os.path.getmtime(ut) >= os.path.getmtime(skript):
        return
    if not os.path.exists('/usr/bin/gimp'):
        raise SystemExit('trenger /usr/bin/gimp (sudo apt install gimp) for å lysjustere Thoras bilde')
    subprocess.run(['/usr/bin/gimp', '-i', '--quit', '--batch-interpreter=python-fu-eval', '-b', f"exec(open({skript!r}).read())"],
                   check=True, timeout=180, capture_output=True)


def finn(navn, mappe=MAPPE):
    treff = glob.glob(os.path.join(mappe, navn))
    if not treff:
        raise SystemExit(f'fant ikke {navn} i {mappe}')
    return Image.open(treff[0]).convert('RGB')


def utvid_sidene(im, side):
    # Et utsnitt bredere enn originalen trenger bakgrunn på sidene: kantene speiles og gjøres uskarpe (som i ansatt-irene.py).
    ekstra = (side - im.width) // 2 + 1
    stor = Image.fromarray(np.pad(np.asarray(im), ((0, 0), (ekstra, ekstra), (0, 0)), mode='reflect'))
    maske = Image.new('L', stor.size, 0)
    tegn = ImageDraw.Draw(maske)
    tegn.rectangle((0, 0, ekstra, stor.height), fill=255)
    tegn.rectangle((stor.width - ekstra, 0, stor.width, stor.height), fill=255)
    return Image.composite(stor.filter(ImageFilter.GaussianBlur(25)), stor, maske.filter(ImageFilter.GaussianBlur(20)))


def glid_maks(a, bredde):
    # Glidende maksimum langs x (bredde i piksler) for en H x W x 3-matrise.
    p = bredde // 2
    pad = np.pad(a, ((0, 0), (p, p), (0, 0)), mode='edge')
    ut = pad[:, 0:a.shape[1]]
    for k in range(1, bredde):
        ut = np.maximum(ut, pad[:, k:k + a.shape[1]])
    return ut


def luft_over_hodet(im, rader):
    # Gir luft over hodet når hodetoppen er kuttet av bildekanten (Aleksandra, Ricky 2026-11-09). Veggen forlenges `rader` piksler oppover:
    # veggfargen måles øverst i bildet BARE utenfor håret, glattes og interpoleres mykt over håret (ellers blir lyse hårpartier og hårskillen til grå striper).
    # De svake loddrette skjøtene i veggpanelet fjernes (bare lyse og svake avvik, så mørkt hår og hårstrå røres ikke). Hår legges ikke til.
    a = np.asarray(im).astype(np.float32)
    W = a.shape[1]
    kol = np.where((a[0:40].mean(2) < 130).any(0))[0]
    h0, h1 = max(kol.min() - 80, 0), min(kol.max() + 80, W - 1)             # hårets bredde øverst, med margin
    xs = np.arange(W)
    utenfor = (xs < h0) | (xs > h1)
    rad0, w, k = a[0:12].mean(0), utenfor.astype(np.float64), np.ones(401)
    glatt = np.stack([np.convolve(rad0[:, c] * w, k, 'same') / np.maximum(np.convolve(w, k, 'same'), 1e-6) for c in range(3)], 1)
    fyll = np.stack([np.interp(xs, xs[utenfor], glatt[utenfor, c]) for c in range(3)], 1)
    topp = np.tile(fyll[None], (rader, 1, 1)) + np.random.default_rng(1).normal(0, 1.0, (rader, W, 1))   # svak støy som originalen
    full = np.vstack([topp, a])
    dil = glid_maks(full, 61)
    l, ld = full.mean(2), dil.mean(2)
    m = ((ld > 190) & ((ld - l) < 45) & ((ld - l) > 2)).astype(np.float32)
    m = np.asarray(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.5))).astype(np.float32)[..., None] / 255
    full = full * (1 - m) + dil * m
    return Image.fromarray(np.clip(full, 0, 255).astype('uint8'))


def utsnitt(im, senter_x, topp, side, px):
    # Utsnittet må ligge innenfor originalen: utenfor blir det svart kant ved siden av lyse klær.
    # Er det bredere enn originalen (side > bredde), utvides sidene med uskarp bakgrunn; senter_x gjelder da originalen.
    if side > im.width and side <= im.height:
        ekstra = (side - im.width) // 2 + 1
        im, senter_x = utvid_sidene(im, side), senter_x + ekstra
    side = int(min(side, im.width, im.height))
    x0 = max(0, min(int(senter_x - side / 2), im.width - side))
    y0 = max(0, min(int(topp), im.height - side))
    boks = (x0, y0, x0 + side, y0 + side)
    return im.crop(boks).resize((px, px), Image.LANCZOS)


def lagre(im, stamme):
    im.save(f'{stamme}.webp', quality=82, method=6)
    im.save(f'{stamme}.jpg', quality=84, optimize=True, progressive=True)


for navn, (fil, varianter) in PERSONER.items():
    im = ImageOps.exif_transpose(finn(fil))
    for v, (sx, ty, s) in varianter.items():
        lagre(utsnitt(im, sx, ty, s, 240 if v else 480), os.path.join(UT, f'team-{navn}{"-" + v if v else ""}'))

fil, (sx, ty, s) = MONIKA
lagre(utsnitt(ImageOps.exif_transpose(finn(fil)), sx, ty, s, 288), os.path.join(UT, 'ansatt-monika'))

lag_lys_thora()
for navn, (mappe, fil, (sx, ty, s)) in SITATFOTO.items():
    lagre(utsnitt(ImageOps.exif_transpose(finn(fil, mappe)), sx, ty, s, 288), os.path.join(UT, f'ansatt-{navn}'))

for navn, (mappe, fil, rot, luft, (sx, ty, s)) in KONTAKTFOTO.items():
    im = ImageOps.exif_transpose(finn(fil, mappe))
    if rot:
        im = im.rotate(rot, expand=True)
    if luft:
        im = luft_over_hodet(im, luft)
    if navn != 'aleksandra':   # Aleksandra står bare på Om oss, ikke i Kontakt-raden
        lagre(utsnitt(im, sx, ty, s, 240), os.path.join(UT, f'team-{navn}-liten'))
    lagre(utsnitt(im, sx, ty, int(s * 0.955), 480), os.path.join(UT, f'team-{navn}'))   # Om oss-kortet: litt strammere utsnitt (som Oslo: 3300 mot 3456)
