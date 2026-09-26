#!/usr/bin/env python3
# Lager bilder/dekning-nett.png — det utydelige veinett-teppet bak teksten i
# heroen (og i footeren, som bruker samme fil).
#
# HVORFOR EKTE DATA. Teppet er tegnet av ekte gater hentet fra OpenStreetMap,
# ikke av et generert mønster. Å syntetisere et veinett viste seg å ikke gå:
# en generert flate kan få riktig tetthet, men aldri den lokale logikken et
# ekte nett har — gater som bøyer rundt terreng, blindveier som ender der de
# skal, en ringvei som faktisk går gjennom. Det er den uregelmessigheten øyet
# kjenner igjen som «et sted», og den lot seg ikke dikte opp.
#
# FORENKLINGEN er det som gjør lånet greit: bare `highway`-linjer. Ingen
# etiketter, ingen farger, ingen vann, ingen grøntområder, ingen jernbane, og
# ingen kappe på motorveien (kappen er et veiskilt-grep, ikke et nett-grep).
# Bredden følger vegklassen. Resultatet er så abstrakt at det ikke peker på
# noe bestemt sted — det kunne like gjerne vært Kina eller Grønland.
#
# KJØR:  python3 verktoy/veinett-teppe.py
# Skriver bilder/dekning-nett.png og .webp. Krever numpy, scipy og Pillow.
# Datakilden ligger i verktoy/veinett-data.txt (se den for hvordan den ble
# hentet), så kjøringen gir samme bilde hver gang og trenger ikke nett.

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROT = Path(__file__).resolve().parent.parent
N = 1400                 # ferdig størrelse, i px
SS = 2                   # tegnes i dobbel oppløsning og skaleres ned — mykere streker
W = N * SS
TEAL = (14, 124, 123)

M_PER_GRAD_LAT = 111320.0
BREDDE_M = 2600.0        # hvor stort område teppet dekker, i meter

# Bredde i px og styrke per vegklasse. Bredden er BETYDNING, ikke meter —
# samme forenkling et papirkart gjør når det skal ned i målestokk.
#
# Styrkeforholdet er bevisst 1:2,2 mellom største og minste (48 mot 22), ikke
# 1:6: ved 1:6 forsvant lokalveiene, og da sto bare motorveiene igjen — altså
# akkurat de fire-fem lange linjene teppet skulle bort fra. Breddene er
# samtidig dempet i toppen (motorvei 4,6 -> 3,3) av samme grunn.
KLASSER = {
    'motorway':     (3.3, 48),
    'trunk':        (3.3, 48),
    'primary':      (3.2, 44),
    'secondary':    (2.5, 38),
    'tertiary':     (2.2, 32),
    'unclassified': (1.9, 28),
    'residential':  (1.9, 28),
    'living_street': (1.7, 25),
    'pedestrian':   (1.4, 22),
}
STYRKE = 1.5      # hvor sterkt hele teppet leser; ganges på ETTER toningen,
                   # så taket treffer sentrum og ikke kanten
ALFA_TAK = 58


def toning():
    """Alfa ut mot kantene — målt fra det forrige teppet (p95 per radiusbånd).

    Uten denne ville bildet hatt en hard firkantet kant midt i heroen. Med den
    fader nettet ut i bakgrunnen av seg selv, og .hero__kart-vannmerke trenger
    ingen mask-image i CSS-en for å skjule kanten.
    """
    y, x = np.mgrid[0:N, 0:N]
    r = np.hypot(x - N / 2, y - N / 2) / (N / 2)
    return np.interp(r, [0, .35, .5, .65, .8, 1.0, 1.06], [.89, .87, .83, .72, .60, .47, 0])


def les(fil=None):
    """Leser den kompakte datafila: én linje per vei, «klasse|x,y;x,y;…».

    Koordinatene er lon/lat med 5 desimaler (~1 m) — mer enn nok for et
    teppe som skal ses på 1 150 px, og det holder fila liten.
    """
    fil = fil or ROT / 'verktoy' / 'veinett-data.txt'
    ut = []
    for linje in Path(fil).read_text(encoding='utf-8').splitlines():
        if not linje or linje.startswith('#'):
            continue
        klasse, rest = linje.split('|', 1)
        punkter = []
        for par in rest.split(';'):
            lon, lat = par.split(',')
            punkter.append((float(lon), float(lat)))
        ut.append((klasse, punkter))
    return ut


def tetthetssenter(veier):
    """Finner det utsnittet av BREDDE_M som har mest vei i seg.

    Å bare ta midtpunktet av alle veipunktene legger utsnittet midt i
    gjennomsnittet — og i dette området er gjennomsnittet en åsside med nesten
    ingen gater. Her måles det i stedet hvor mye VEI som ligger i hvert vindu,
    med stikkprøver hver 25. meter langs hver vei (så en lang motorvei teller
    mer enn en kort stikkvei), og vinduet med mest vei vinner.
    """
    from scipy.ndimage import uniform_filter

    prøver, vekter = [], []
    for klasse, g in veier:
        pts = np.array([til_meter(lon, lat) for lon, lat in g], float)
        if len(pts) < 2:
            continue
        seg = np.hypot(*np.diff(pts, axis=0).T)
        s = np.concatenate([[0.0], np.cumsum(seg)])
        if s[-1] < 25:
            continue
        t = np.arange(0.0, s[-1], 25.0)
        prøver.append(np.column_stack([np.interp(t, s, pts[:, 0]),
                                       np.interp(t, s, pts[:, 1])]))
        vekter.append(np.full(len(t), KLASSER[klasse][0]))

    alle = np.vstack(prøver)
    vekt = np.concatenate(vekter)
    rutenett = 100.0
    x0, y0 = alle[:, 0].min(), alle[:, 1].min()
    nx = int((alle[:, 0].max() - x0) / rutenett) + 2
    ny = int((alle[:, 1].max() - y0) / rutenett) + 2
    bilde, _, _ = np.histogram2d(
        alle[:, 0], alle[:, 1], bins=(nx, ny),
        range=((x0, x0 + nx * rutenett), (y0, y0 + ny * rutenett)), weights=vekt)
    jevnet = uniform_filter(bilde, size=max(1, int(round(BREDDE_M / rutenett))),
                            mode='constant')
    i, j = np.unravel_index(np.argmax(jevnet), jevnet.shape)
    return (x0 + (i + .5) * rutenett, y0 + (j + .5) * rutenett)


M_PER_GRAD_LON = M_PER_GRAD_LAT * np.cos(np.radians(59.94))


def til_meter(lon, lat, origo=None):
    # origo=None gir absolutte meter (brukes til å finne tetthetssenteret);
    # ellers måles alt fra origo
    o_lon, o_lat = origo if origo else (0.0, 0.0)
    return ((lon - o_lon) * M_PER_GRAD_LON, -(lat - o_lat) * M_PER_GRAD_LAT)


def tegn(fil=None):
    veier = les()
    cx, cy = tetthetssenter(veier)
    skala = N / BREDDE_M

    def til_px(lon, lat):
        x, y = til_meter(lon, lat)
        return ((x - cx) * skala + N / 2) * SS, ((y - cy) * skala + N / 2) * SS

    lag = {k: Image.new('L', (W, W), 0) for k in KLASSER}
    teg = {k: ImageDraw.Draw(v) for k, v in lag.items()}

    for klasse, g in veier:
        bredde, _ = KLASSER[klasse]
        px = [til_px(lon, lat) for lon, lat in g]
        # Hver vei tegnes i ETT kall med joint='curve', så svinger blir runde.
        # Endepunktene får en prikk: uten den løser nettet seg opp i hårfine
        # spisser der to veier møtes i samme punkt med ulik bredde.
        for ende in (0, -1):
            p = px[ende]
            r = bredde * SS / 2
            teg[klasse].ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)
        teg[klasse].line(px, fill=255, width=max(1, int(bredde * SS)), joint='curve')

    def ned(img):
        return np.asarray(img.resize((N, N), Image.LANCZOS), float) / 255

    # ned() gir 0-1, og alfa-tabellen er allerede i alfa-enheter — ingen
    # 255-skalering. STYRKE kommer ETTER toningen: legger man den inn i
    # tabellen i stedet, metter taket hele sentrum og bildet blir grumsete.
    kjerner = np.maximum.reduce([ned(lag[k]) * a for k, (_, a) in KLASSER.items()])
    alfa = np.clip(kjerner * toning() * STYRKE, 0, ALFA_TAK)

    rgba = np.zeros((N, N, 4), np.uint8)
    rgba[..., 0], rgba[..., 1], rgba[..., 2] = TEAL
    rgba[..., 3] = np.round(alfa).astype(np.uint8)
    bilde = Image.fromarray(rgba, 'RGBA')

    fil = fil or ROT / 'bilder' / 'dekning-nett.png'
    bilde.save(fil, optimize=True)
    bilde.save(Path(fil).with_suffix('.webp'), quality=88, method=6)
    a = rgba[..., 3]
    print(f'skrev {fil} og .webp | {len(veier)} veier'
          f' | alfa maks {a.max()} | piksler > 8: {(a > 8).mean() * 100:.1f} %')


if __name__ == '__main__':
    if len(sys.argv) > 1:
        tegn(sys.argv[1])
    else:
        tegn()
