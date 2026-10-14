#!/usr/bin/env python3
"""Lager bilder/hode-stavanger.{webp,jpg}: utsnitt av Stavanger-scenen til sidehodene (Ricky 2026-10-14).

Marit (14.10): på undersidene ser man ikke hvilken by man er på, siden sidehodet bare har ballongen. Ricky: «skal vi vise
byen bak luftballongen?». Utsnittet tar ballongen, skyen og silhuettene bak byen (oljeplattformer og kraner), men IKKE husene: de maskeres bort
med himmelfarge (venstre del under ballongen), så det ikke blir en hel by med for mange detaljer (se hode-ballong.py).

Himmelen flates ut til --himmel (#9AD2D5) som i hode-ballong.py, men med en mye smalere terskel: silhuettene er bare
ca. 25 over himmelen i hver kanal, og Oslo-skriptets terskel (6–24) ville ha flatet de lyseste bort.

Kjør fra repo-roten (etter hero-stavanger-hus.py og hero-stavanger-silhuett.py): python3 verktoy/hode-stavanger.py"""
from PIL import Image
import numpy as np

def farge_til_alfa(rgb, bakgrunn):
    """GIMPs «farge til alfa»: hver piksel p skrives som F over bakgrunnen B med minst mulig dekning, p = a·F + (1 − a)·B. Himmelen
    blir gjennomsiktig og motivene beholder fargen sin, så sidehodets egen bakgrunn (som er en gradient og ikke flat himmelfarge)
    skinner gjennom. En flat himmel i bildet ga et synlig rektangel med annen form enn bandet rundt (Ricky 2026-10-14)."""
    p = np.clip(rgb, 0, 255)
    opp = np.where(p > bakgrunn, (p - bakgrunn) / np.maximum(255 - bakgrunn, 1), 0)
    ned = np.where(p < bakgrunn, (bakgrunn - p) / np.maximum(bakgrunn, 1), 0)
    alfa = np.maximum(opp, ned).max(axis=2)
    alfa = np.clip((alfa - 0.045) / (1 - 0.045), 0, 1)       # bildestøy i himmelen (under ca. 4,5 %) skal ikke bli et synlig slør
    trygg = np.maximum(alfa, 1e-6)[..., None]
    f = bakgrunn + (p - bakgrunn) / trygg
    f = np.where(alfa[..., None] > 1e-6, f, bakgrunn)
    return np.dstack([np.clip(f, 0, 255), alfa * 255]).round().astype('uint8')


KILDE = 'bilder/hero-stavanger.webp'
RUTE = (1340, 40, 2100, 436)           # x0, y0, x1, y1 i scenen (2172 × 724)
HIMMEL = np.array([0x9A, 0xD2, 0xD5], float)

scene = np.asarray(Image.open(KILDE).convert('RGB')).astype(float)
a = scene[RUTE[1]:RUTE[3], RUTE[0]:RUTE[2]].copy()
hjorner = np.concatenate([a[:10, -10:].reshape(-1, 3), a[:10, :10].reshape(-1, 3), a[:10, 300:310].reshape(-1, 3)])
sky = np.median(hjorner, axis=0)
# Skyen flyttes mot høyre (Ricky 2026-10-14) så den ikke dekker kirketårnet: omrisset (alt som er lysere enn himmelen i
# skyens rute) klippes ut, plassen fylles med himmel, og skyen limes inn SKY_DX px til høyre.
from scipy.ndimage import binary_fill_holes as _fyll, gaussian_filter as _gf
SKY_RUTE = (176, 170, 340, 240)      # x0, y0, x1, y1 i utsnittet (fuglene ligger over y 170)
SKY_DX = 85
sx0, sy0, sx1, sy1 = SKY_RUTE
rute = a[sy0:sy1, sx0:sx1]
sky_maske = _fyll(np.sqrt(((rute - sky) ** 2).sum(axis=2)) > 14)
sky_alfa = np.clip(_gf(sky_maske.astype(float), 0.7) * 1.15, 0, 1)[..., None]
sky_bit = rute.copy()
a[sy0:sy1, sx0:sx1] = rute * (1 - sky_alfa) + sky * sky_alfa
a[sy0:sy1, sx0 + SKY_DX:sx1 + SKY_DX] = a[sy0:sy1, sx0 + SKY_DX:sx1 + SKY_DX] * (1 - sky_alfa) + sky_bit * sky_alfa
avstand = np.sqrt(((a - sky) ** 2).sum(axis=2))
vekt = np.clip(1 - (avstand - 3) / 7, 0, 1)[..., None]
# Husene i Gamle Stavanger ligger nederst til venstre i utsnittet (x < ca. 1595 i scenen, y > ca. 320). Alt i dette hjørnet
# under ballongkurven og skyen fylles med himmelfarge; kanten fjæres så det ikke blir en skarp skjøt mot plattformene.
from scipy.ndimage import gaussian_filter
hoyde, bredde = a.shape[:2]
yy, xx = np.mgrid[0:hoyde, 0:bredde]
X, Y = xx + RUTE[0], yy + RUTE[1]
fyll = (((X < 1523) & (Y >= 265)) | ((X >= 1493) & (X < 1523) & (Y >= 242)) | ((X >= 1523) & (X < 1568) & (Y >= 276))).astype(float)
fyll = np.clip(gaussian_filter(fyll, 5) * 1.0, 0, 1)
fyll[:, 1568 - RUTE[0]:] = np.clip(1 - (xx[:, 1568 - RUTE[0]:] - (1568 - RUTE[0])) / 12.0, 0, 1) * fyll[:, 1568 - RUTE[0]:]
ut_a = a * (1 - vekt) + HIMMEL * vekt
ut_a = ut_a * (1 - fyll[..., None]) + HIMMEL * fyll[..., None]
# Husene (Ricky 2026-10-14: «vis noen hus under ballongen, de husene som brukes for den byen»): de tre hvite trehusene med
# burgunder tak lengst til høyre i Gamle Stavanger, løftet HUS_LOFT px så de står rett under ballongen. Omrisset tas fra
# scenen som «alt som ikke er himmel eller silhuett» (avstand til himmelen > 48), fylt for hull og fjæret, og limes bare der
# det er objekt, så silhuettene bak ikke følger med.
from scipy.ndimage import binary_closing, binary_opening, binary_fill_holes
HUS = (1350, 352, 1578, 548)          # x0, y0, x1, y1 i scenen
HUS_LOFT = 78
hx0, hy0, hx1, hy1 = HUS
bit = scene[hy0:hy1, hx0:hx1]
obj = np.sqrt(((bit - sky) ** 2).sum(axis=2)) > 48
obj = binary_opening(binary_closing(obj, np.ones((5, 5))), np.ones((3, 3)))
obj = binary_fill_holes(obj)
alfa = np.clip(gaussian_filter(obj.astype(float), 0.7) * 1.15, 0, 1)
oy, ox = hy0 - RUTE[1] - HUS_LOFT, hx0 - RUTE[0]
rader = min(bit.shape[0], hoyde - oy)                    # nederste del klippes av utsnittet
ut_a[oy:oy + rader, ox:ox + bit.shape[1]] = (ut_a[oy:oy + rader, ox:ox + bit.shape[1]] * (1 - alfa[:rader, :, None]) + bit[:rader] * alfa[:rader, :, None])
# Silhuettene er bare ca. 25 over himmelen og forsvinner i et lite sidehode: kontrasten mot himmelen økes (KONTRAST ×), og
# bare for piksler som er mørkere enn himmelen i silhuett-sonen, så ballong, sky og bobler røres ikke.
KONTRAST = 1.9
sil = ((a[..., 0] < sky[0] - 8) & (a[..., 0] > sky[0] - 60) & (X >= 1568) & (Y >= 280)).astype(float)
ut_a = np.where(sil[..., None] > 0, HIMMEL + (ut_a - HIMMEL) * KONTRAST, ut_a)
# Domkirken bak husene og ballongen (Ricky 2026-10-14: Preikestolen ble for dominerende, «hva om vi legger til kirketårnet i
# stedet?»). Samme form som domkirken() i hero-stavanger-silhuett.py (langt skip med bratt tak, firkantet vesttårn med spir
# og kors, sidebygning), skalert KIRKE_K, med tårnet like til høyre for ballongen. Fargen er himmelen minus samme «delta» som
# scenens silhuetter (ca. 9,5 / 6 / 7 per styrkeenhet). Tegnes bare der pikslene er himmel, så hus, ballong, sky og kraner
# står foran.
from PIL import ImageDraw
DELTA = np.array([9.5, 6.0, 7.0])
KIRKE_K, KIRKE_X, KIRKE_BUNN, SS = 1.55, 190, hoyde + 60, 3

def kirke_lag():
    lag = Image.new('L', (bredde * SS, hoyde * SS), 0)
    d = ImageDraw.Draw(lag)
    def pt(dx, h): return ((KIRKE_X + dx * KIRKE_K) * SS, (KIRKE_BUNN - h * KIRKE_K) * SS)
    def rekt(x0, h0, x1, h1):
        (ax, ay), (bx, by) = pt(x0, h0), pt(x1, h1)
        d.rectangle([min(ax, bx), min(ay, by), max(ax, bx), max(ay, by)], fill=255)
    rekt(-70, 70, 4, -60)                                                   # skipet
    d.polygon([pt(-74, 70), pt(-33, 104), pt(8, 70)], fill=255)
    rekt(4, 150, 44, -60)                                                   # vesttårnet
    d.polygon([pt(1, 150), pt(24, 188), pt(47, 150)], fill=255)
    rekt(23, 214, 25.5, 188)                                                # spiret
    rekt(19, 207, 29.5, 205)                                                # korset
    rekt(44, 82, 70, -60)                                                   # sidebygning
    d.polygon([pt(41, 82), pt(57, 100), pt(73, 82)], fill=255)
    return np.asarray(lag.resize((bredde, hoyde), Image.LANCZOS)).astype(float)[..., None] / 255

kirke = kirke_lag()
sky_aktig = (np.abs(ut_a - HIMMEL).max(2) < 9)[..., None]
ut_a = np.where(sky_aktig, ut_a * (1 - kirke) + (HIMMEL - DELTA * 3.0) * kirke, ut_a)
ut = Image.fromarray(farge_til_alfa(ut_a, HIMMEL), 'RGBA')
ut.save('bilder/hode-stavanger.webp', quality=90, alpha_quality=100, method=6)
ut.save('bilder/hode-stavanger.png', optimize=True)
print(ut.size, 'sky', sky.round(1))
