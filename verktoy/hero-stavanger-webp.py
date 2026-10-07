# Lager bilder/hero-stavanger*.webp fra jpg-ene (etter hero-stavanger-raster.mjs). Kjør: python3 verktoy/hero-stavanger-webp.py
from PIL import Image
for n in ('hero-stavanger', 'hero-stavanger-vinter'):
    Image.open(f'bilder/{n}.jpg').save(f'bilder/{n}.webp', quality=82, method=6)
