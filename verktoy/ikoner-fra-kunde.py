# Tjenestemerkene er Clean Units egne (Marits tre PNG-er + de tre fra cleanunit.no/tjenester).
# Skriptet fjerner den lange diagonale skyggen (Marit 2026-10-05: «skyggene kan godt fjernes») ved å
# male skyggefargen om til bakgrunnsfargen. Kilden er flate farger, så det er en ren fargeerstatning;
# kantpiksler som ligger på linja mellom skygge og bakgrunn blandes tilsvarende.
# Kjør: python3 verktoy/ikoner-fra-kunde.py <kildemappe-med-originaler>
import sys, os
from PIL import Image

# navn: (kildefil, skyggefarge, bakgrunnsfarge)
IKONER = {
    'barnehage':       ('barnehage.png',        '78a4a7', '96cdd1'),
    'daglig':          ('dagligRenhold.png',    '5e2a4a', '75355d'),
    'hovedrengjoring': ('hovedrengjøring.png',  '85a4a6', 'a7ced1'),
    'hygiene':         ('dorull.png',           '78a4a7', '96cdd1'),
    'gulv':            ('gulv.png',             '78a4a7', '96cdd1'),
    'vindu':           ('vindu.png',            '713e5d', '8d4d74'),
}
def hex2(h): return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def fjern_skygge(im, skygge, bg, tol=9):
    s, b = hex2(skygge), hex2(bg)
    d = [b[i] - s[i] for i in range(3)]
    dd = sum(x * x for x in d)
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, bl, a = px[x, y]
            if a == 0: continue
            # t = hvor langt langs skygge→bakgrunn pikselen ligger; avstand til linja avgjør om den er en blanding
            v = (r - s[0], g - s[1], bl - s[2])
            t = sum(v[i] * d[i] for i in range(3)) / dd
            if not -0.05 <= t <= 1.05: continue
            avvik = max(abs(v[i] - t * d[i]) for i in range(3))
            if avvik <= tol:
                px[x, y] = (*b, a)
    return im

if __name__ == '__main__':
    kilde = sys.argv[1]
    ut = os.path.join(os.path.dirname(__file__), '..', 'bilder')
    for navn, (fil, skygge, bg) in IKONER.items():
        im = fjern_skygge(Image.open(os.path.join(kilde, fil)).convert('RGBA'), skygge, bg)
        im.save(os.path.join(ut, f'ikon-{navn}-kunde.png'), optimize=True)
        im.save(os.path.join(ut, f'ikon-{navn}-kunde.webp'), quality=90, method=6)
        print('skrev', navn)
