#!/usr/bin/env python3
"""Lager bilder/hode-oslo.{webp,jpg}: utsnitt av Oslo-scenen til sidehodene, med byhus under ballongen og Rådhuset bak.

Ricky 2026-10-14, etter at Stavanger-sidehodet (hode-stavanger.py) ble godkjent: samme grep for Oslo, så man ser hvilken by
man er i også på undersidene. Husene er de hvite og turkise byhusene rett under ballongen i scenen, løftet HUS_LOFT px;
bak står Rådhuset (to firkantede tårn og en lav fløy) som silhuett, tegnet i samme dempede farge som Stavangers.
Oslos svake bakgrunnsskyline flates ut til himmelen først, så den ikke blander seg med Rådhuset.

Kjør fra repo-roten: python3 verktoy/hode-oslo.py"""
from PIL import Image, ImageDraw
import numpy as np
from scipy.ndimage import binary_closing, binary_opening, binary_fill_holes, gaussian_filter

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


KILDE = 'bilder/hero-scene.webp'
RUTE = (1110, 40, 2150, 440)           # x0, y0, x1, y1 i scenen (2172 × 724)
HIMMEL = np.array([0x9A, 0xD2, 0xD5], float)
DELTA = np.array([9.5, 6.0, 7.0])      # hvor mye mørkere scenens silhuetter er per styrkeenhet (målt i Stavanger-scenen)

scene = np.asarray(Image.open(KILDE).convert('RGB')).astype(float)
a = scene[RUTE[1]:RUTE[3], RUTE[0]:RUTE[2]].copy()
hoyde, bredde = a.shape[:2]
hjorner = np.concatenate([a[:10, :10].reshape(-1, 3), a[:10, -10:].reshape(-1, 3), a[:10, 300:310].reshape(-1, 3)])
sky = np.median(hjorner, axis=0)
avstand = np.sqrt(((a - sky) ** 2).sum(axis=2))
vekt = np.clip(1 - (avstand - 6) / 18, 0, 1)[..., None]     # samme terskel som hode-ballong.py: skylinen i bakgrunnen blir himmel
ut_a = a * (1 - vekt) + HIMMEL * vekt

# Husene og skyskraperen (Ricky 2026-10-14: «Oslo er hovedstaden og storbyen, så vis Skyskraperen»): glasstårnet, den hvite
# blokken med skorsteiner og huset med turkist tak står sammen i scenen, og løftes som én gruppe HUS_LOFT px så de står under
# ballongen. Alt som ligger i gruppens rute, og alt under y = TOM_FRA, fjernes fra utsnittet først (trær, lekeplass, vei, og
# gruppen på sin opprinnelige plass), ellers ville de løftede byggene bare blitt en høyere versjon av de nederste.
# Glasstårnet har ruter som nesten har himmelfarge, så omrisset tas fra en polygon (taket skrår) og ikke fra fargeavstand.
HUS = (1146, 145, 1580, 582)           # x0, y0, x1, y1 i scenen
HUS_LOFT = 72
TOM_FRA = 300
TARN = [(1150, 166), (1178, 149), (1318, 178), (1318, 420), (1150, 420)]    # glasstårnets omriss i scenen
yy, xx = np.mgrid[0:hoyde, 0:bredde]
X, Y = xx + RUTE[0], yy + RUTE[1]
BALLONG_X = 1410                        # fra og med denne x og over TOM_FRA ligger ballong og sky: de skal hverken fjernes eller løftes
# Boblen i scenen (1870, 282) ville havnet midt i hoppbakken, så den fjernes også.
tom = ((Y >= TOM_FRA) | (((X - 1870) ** 2 + (Y - 282) ** 2) < 52 ** 2)
       | ((X < HUS[0]) & (Y >= HUS[1])) | ((X >= HUS[0]) & (X < BALLONG_X) & (Y >= HUS[1]) & (Y < HUS[3])))
ut_a = np.where(tom[..., None], HIMMEL, ut_a)

hx0, hy0, hx1, hy1 = HUS
bit = scene[hy0:hy1, hx0:hx1]
obj = np.sqrt(((bit - sky) ** 2).sum(axis=2)) > 48
tl = Image.new('L', (hx1 - hx0, hy1 - hy0), 0)
ImageDraw.Draw(tl).polygon([(x - hx0, y - hy0) for x, y in TARN], fill=255)
obj |= np.asarray(tl) > 0
byy, bxx = np.mgrid[hy0:hy1, hx0:hx1]
obj &= ~((bxx >= BALLONG_X) & (byy < TOM_FRA))
obj = binary_opening(binary_closing(obj, np.ones((5, 5))), np.ones((3, 3)))
obj = binary_fill_holes(obj)
alfa = np.clip(gaussian_filter(obj.astype(float), 0.7) * 1.15, 0, 1)
oy, ox = hy0 - RUTE[1] - HUS_LOFT, hx0 - RUTE[0]
rader = min(bit.shape[0], hoyde - oy)
ut_a[oy:oy + rader, ox:ox + bit.shape[1]] = (ut_a[oy:oy + rader, ox:ox + bit.shape[1]] * (1 - alfa[:rader, :, None]) + bit[:rader] * alfa[:rader, :, None])


# Holmenkollen-bakken bak til høyre (Ricky 2026-10-14: «noe i bakgrunnen»), tegnet etter hans side-bilde av bakken (960 × 720 px;
# koordinatene under er målt i det bildet): dommerlugaren øverst til høyre, et langt tilløp som faller bratt fra tårnet og
# flater ut mot venstre (konkav kurve, ca. 40 px tykt), én bred pilar under, og hoppkanten med en lav skråning videre mot venstre.
# Tidligere utgaver (tårn til venstre, tynne stolper, kuppel) ble avvist: «harpe», så «mer fra siden».
# Samme dempede silhuettfarge som Stavangers Domkirke og plattformer; tegnes bare der pikslene er himmel, så ballong, sky og hus
# står foran.
HK_K, HK_X, HK_BUNN, SS = 0.5, 868, hoyde - 70, 3        # bildepiksel -> utsnittspiksel; lugarens høyre kant og pilarfoten (bildets y 525)
hk = Image.new('L', (bredde * SS, hoyde * SS), 0)
dh = ImageDraw.Draw(hk)
def hp(px, py): return ((HK_X - (806 - px) * HK_K) * SS, (HK_BUNN - (525 - py) * HK_K) * SS)
def hpoly(pts): dh.polygon([hp(*p) for p in pts], fill=255)
hpoly([(738, 172), (806, 172), (806, 206), (738, 206)])                               # dommerlugaren
hpoly([(806, 206), (760, 226), (700, 272), (640, 318), (560, 368), (480, 418), (400, 456), (320, 488), (240, 505), (215, 508),
       (215, 522), (240, 522), (300, 510), (400, 487), (500, 447), (600, 387), (650, 347), (700, 312), (760, 264), (790, 234), (806, 218)])   # tilløpet
hpoly([(612, 340), (680, 330), (680, 900), (612, 900)])                               # den brede pilaren
hpoly([(215, 508), (170, 520), (120, 545), (60, 590), (0, 650), (-60, 730), (-60, 900), (215, 900)])      # skråningen videre mot venstre
hpoly([(215, 545), (400, 525), (560, 505), (700, 470), (806, 430), (1300, 380), (1300, 900), (215, 900)])   # skogkledd åsside under tilløpet
lav = Image.new('L', (bredde * SS, hoyde * SS), 0)
LAV_ALFA = 0.0
hk_alfa = np.asarray(hk.resize((bredde, hoyde), Image.LANCZOS)).astype(float)[..., None] / 255
lav_alfa = np.asarray(lav.resize((bredde, hoyde), Image.LANCZOS)).astype(float)[..., None] / 255 * LAV_ALFA
hk_alfa = np.maximum(hk_alfa, lav_alfa)
sky_aktig = (np.abs(ut_a - HIMMEL).max(2) < 9)[..., None]
ut_a = np.where(sky_aktig, ut_a * (1 - hk_alfa) + (HIMMEL - DELTA * 2.6) * hk_alfa, ut_a)

ut = Image.fromarray(farge_til_alfa(ut_a, HIMMEL), 'RGBA')
ut.save('bilder/hode-oslo.webp', quality=90, alpha_quality=100, method=6)
ut.save('bilder/hode-oslo.png', optimize=True)
print(ut.size, 'sky', sky.round(1))
