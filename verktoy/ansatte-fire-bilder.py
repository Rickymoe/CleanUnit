# Skjærer collagen fra Marit (Ansatte.jpg, 577×348, fire bilder i ulik størrelse) i fire like store ruter
# (bilder/ansatte-1..4.jpg/.webp). Marit 2026-10-09: «4 bilder i samme størrelse så blir det ikke så tydelig hvem de er».
# Kilden er liten, så rutene skaleres 2× (Lanczos); litt mykhet gjør ikke noe her. Kjør: python3 verktoy/ansatte-fire-bilder.py <sti til Ansatte.jpg>
import sys
from PIL import Image
KILDE = sys.argv[1]
W, H = 270, 154
# (venstre, topp) i kollagen; hver rute ligger inne i sitt eget bilde, unna skjøtene
RUTER = [(12, 14), (12, 192), (300, 8), (300, 180)]
im = Image.open(KILDE).convert('RGB')
for i, (x, y) in enumerate(RUTER, 1):
    t = im.crop((x, y, x + W, y + H)).resize((W * 2, H * 2), Image.LANCZOS)
    t.save(f'bilder/ansatte-{i}.jpg', quality=82, optimize=True, progressive=True)
    t.save(f'bilder/ansatte-{i}.webp', quality=80, method=6)
