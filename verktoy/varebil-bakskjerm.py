# Reparerer bakskjermen (den runde mørke flaten mellom baklykten og bakhjulet) på flåte-/parkeringsbilen,
# bilder/varebil-hero.svg. Ricky 2026-10-08: «det er som om det mangler noe av bakskjermen på bilen».
# Årsak: bilen er et 1:1-utklipp (x 380, y 472, 347×145) av heroscenen bilder/hero-scene.jpg, og den opprinnelige
# utklippingen skar bort øvre venstre del av den runde flaten med en skrå kant og lot venstre kant bli hakkete.
# Metode: i et lite område bak hjulet hentes de skifer-grå pikslene (lav lysstyrke og fargemetning, fargetone
# ~185–215°) tilbake fra scenen, mot sky (lys teal) og busk (grønn) som skilles på farge. Alt utenfor området er
# uendret før koding (skriptet teller og stopper hvis noe annet endres). Bildet i SVG-en er et WebP med alfa.
# Krever Pillow, numpy og scipy. Kjør fra repo-roten: python3 -I verktoy/varebil-bakskjerm.py
import base64, io, os, re
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, binary_dilation

ROT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bilder')
SVG = os.path.join(ROT, 'varebil-hero.svg')
OFFSET = (380, 472)                 # utklippets plassering i hero-scene.jpg (målt: gjennomsnittlig avvik 1,2 av 255)
OMRAADE = (0, 62, 42, 125)          # x0, y0, x1, y1 i utklippet: bakskjermen foran hjulet (hjulet starter ca. x 40)

svg = open(SVG, encoding='utf-8').read()
m = re.search(r'(<image[^>]*href="data:image/webp;base64,)([^"]+)(")', svg)
van = np.asarray(Image.open(io.BytesIO(base64.b64decode(m.group(2)))).convert('RGBA')).astype(np.float64)
h, w = van.shape[:2]
scene = np.asarray(Image.open(os.path.join(ROT, 'hero-scene.jpg')).convert('RGB')).astype(np.float64)
kilde = scene[OFFSET[1]:OFFSET[1] + h, OFFSET[0]:OFFSET[0] + w]

r, g, b = kilde[..., 0] / 255, kilde[..., 1] / 255, kilde[..., 2] / 255
mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
d = np.maximum(mx - mn, 1e-9)
sat = (mx - mn) / np.maximum(mx, 1e-9)
hue = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
skifer = (mx < 0.50) & (sat < 0.40) & (hue > 185) & (hue < 220)      # bakskjermens farge: ikke sky (lys), ikke busk (grønn)

yy, xx = np.mgrid[0:h, 0:w]
x0, y0, x1, y1 = OMRAADE
inne = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
kjerne = skifer & inne
# bare det som henger sammen med den eksisterende, dekkende bakskjermen (ikke løse flekker av veien/bakgrunnen)
from scipy.ndimage import label
lab, n = label(kjerne | ((van[..., 3] > 250) & inne))
dekkende = np.unique(lab[(van[..., 3] > 250) & inne & (xx > 20)])
kjerne = kjerne & np.isin(lab, dekkende[dekkende > 0])
kjerne = binary_dilation(kjerne, iterations=1) & inne & ~((mx > 0.62))   # fyll hull og tapp inn kanten, aldri lyse piksler
myk = np.clip(gaussian_filter(kjerne.astype(np.float64), 0.8) * 1.25, 0, 1)
alfa_ny = np.maximum(van[..., 3] / 255, myk * inne)
# farge: kjernen fra scenen; kantpiksler (blandet med sky/busk) får fargen fra nærmeste indre kjerne
inner = kjerne & binary_dilation(~kjerne, iterations=1) == False
vekt = gaussian_filter((kjerne & ~binary_dilation(~kjerne, iterations=1)).astype(np.float64), 1.5)
farge = np.zeros_like(kilde)
for k in range(3):
    farge[..., k] = gaussian_filter(kilde[..., k] * (kjerne & ~binary_dilation(~kjerne, iterations=1)), 1.5) / np.maximum(vekt, 1e-6)
ut = van.copy()
nye = inne & (alfa_ny > van[..., 3] / 255 + 0.02)
ut[..., :3][nye] = np.where((kjerne & ~binary_dilation(~kjerne, iterations=1))[..., None], kilde, farge)[nye]
ut[..., 3] = np.round(alfa_ny * 255)
# rester fra bakgrunnen helt til venstre (teal busk-kant, lys flekk) males over med nærmeste skifergrå
SKIFER_RGB = np.array([72.0, 88.0, 96.0])
rest = inne & (ut[..., 3] > 0) & ~skifer & (xx < 14) & (yy > 95)
trygg = np.isfinite(farge).all(axis=2) & (vekt > 0.02)
ut[..., :3][rest] = np.where(trygg[rest][:, None], farge[rest], SKIFER_RGB)
endret_utenfor = int(((np.abs(ut - van).max(2) > 0.5) & ~inne).sum())
print(f'endret utenfor området: {endret_utenfor} (skal være 0); nye dekkende piksler: {int(nye.sum())}')
assert endret_utenfor == 0
buf = io.BytesIO()
Image.fromarray(np.clip(np.round(ut), 0, 255).astype(np.uint8), 'RGBA').save(buf, 'WEBP', quality=96, alpha_quality=100, method=6)
ny = base64.b64encode(buf.getvalue()).decode()
open(SVG, 'w', encoding='utf-8').write(svg[:m.start(2)] + ny + svg[m.end(2):])
print('skrev', SVG, len(ny), 'tegn base64 (var', len(m.group(2)), ')')
