# Setter Stavanger-silhuetter inn i bybildet (bilder/hero-stavanger*.jpg): fjerner den svake Oslo-skylinen i bakgrunnen
# og tegner Stavanger i stedet (Domkirken, Valbergtårnet, Sverd i fjell, en oljeplattform, takene i Gamle Stavanger) pluss måker.
# Marit 2026-10-09: «Samme stil og farger, men vise tydelig at det er Stavanger.»
# Rekkefølge: kjør først verktoy/hero-stavanger-hus.py (skriver Stavanger-filene fra Oslo-scenene), så dette.
# Kjør fra repo-roten: python3 verktoy/hero-stavanger-silhuett.py
# Metode (målt, ikke tegnet på nytt): himmelen er jevn, og silhuettene er litt mørkere enn den. Skylinen finnes som blobber
# med fargen nær himmelen; de fylles med himmelfarge og samme korn, og de nye silhuettene tegnes bare der pikslene
# er himmel (bygninger, trær, bil og lekeplass ligger foran, og bobler, sol, skyer og ballong røres ikke).
import os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_opening, binary_dilation, gaussian_filter

BILDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bilder')
UT = sys.argv[1] if len(sys.argv) > 1 else BILDER
SS = 3                      # supersampling for kantene
BUNN = 548                  # bakkenivå bak trær og hus; alt under skjules av forgrunnen uansett
BOBLER = [(456, 277, 35), (527, 328, 19), (1871, 282, 33), (1795, 342, 25)]   # beskyttes (halvgjennomsiktige)


def lag(tegn):
    """Kjører tegn(draw, s) på et SS× stort lag og gir alfa 0..1 i bildets størrelse."""
    lag = Image.new('L', (2172 * SS, 724 * SS), 0)
    d = ImageDraw.Draw(lag)
    tegn(d, SS)
    return np.asarray(lag.resize((2172, 724), Image.LANCZOS)).astype(float) / 255


def poly(d, s, pts, fill=255):
    d.polygon([(x * s, y * s) for x, y in pts], fill=fill)


def rect(d, s, x0, y0, x1, y1):
    d.rectangle([min(x0, x1) * s, min(y0, y1) * s, max(x0, x1) * s, max(y0, y1) * s], fill=255)


def sirkel(d, s, x, y, r):
    d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=255)


def gamle_stavanger(d, s, x0, x1, hoyde=34, tak=24):
    """Rad med hvite trehus: lave vegger med bratte saltak og en pipe i ny og ne."""
    x, i = x0, 0
    while x < x1:
        b = [46, 38, 52, 42][i % 4]
        h = [hoyde, hoyde + 10, hoyde - 6, hoyde + 4][i % 4]
        rect(d, s, x, BUNN - h, x + b, BUNN)
        poly(d, s, [(x - 3, BUNN - h), (x + b / 2, BUNN - h - tak), (x + b + 3, BUNN - h)])
        if i % 3 == 1:
            rect(d, s, x + b * 0.68, BUNN - h - tak * 0.8, x + b * 0.68 + 5, BUNN - h - tak * 0.3)
        x += b + 1
        i += 1


def domkirken(d, s, x):
    """Langt skip med bratt tak og et firkantet vesttårn med kort spir."""
    rect(d, s, x - 70, BUNN - 70, x + 4, BUNN)                       # skipet
    poly(d, s, [(x - 74, BUNN - 70), (x - 33, BUNN - 104), (x + 8, BUNN - 70)])
    rect(d, s, x + 4, BUNN - 150, x + 44, BUNN)                      # vesttårnet
    poly(d, s, [(x + 1, BUNN - 150), (x + 24, BUNN - 188), (x + 47, BUNN - 150)])
    rect(d, s, x + 23, BUNN - 214, x + 25.5, BUNN - 188)             # spiret
    rect(d, s, x + 19, BUNN - 207, x + 29.5, BUNN - 205)             # korset
    rect(d, s, x + 44, BUNN - 82, x + 70, BUNN)                      # sidebygning
    poly(d, s, [(x + 41, BUNN - 82), (x + 57, BUNN - 100), (x + 73, BUNN - 82)])


def valbergtaarnet(d, s, x):
    """Rundt steintårn med tannekrans og en liten utkikkshette."""
    rect(d, s, x - 17, BUNN - 150, x + 17, BUNN)
    rect(d, s, x - 22, BUNN - 164, x + 22, BUNN - 150)
    for k in range(5):
        rect(d, s, x - 22 + k * 10, BUNN - 172, x - 22 + k * 10 + 5.5, BUNN - 164)
    rect(d, s, x - 6, BUNN - 190, x + 6, BUNN - 172)
    poly(d, s, [(x - 9, BUNN - 190), (x, BUNN - 206), (x + 9, BUNN - 190)])
    poly(d, s, [(x - 80, BUNN), (x - 40, BUNN - 38), (x + 40, BUNN - 38), (x + 80, BUNN)])   # haugen


def sverd_i_fjell(d, s, x):
    """Tre sverd som stikker opp av en knaus, det midterste høyest, med kryssfeste."""
    poly(d, s, [(x - 70, BUNN), (x - 52, BUNN - 26), (x - 20, BUNN - 40), (x + 18, BUNN - 36), (x + 52, BUNN - 22), (x + 74, BUNN)])
    for dx, h, tilt in [(-26, 128, -2), (0, 160, 0), (28, 110, 2)]:
        top = BUNN - 34 - h
        poly(d, s, [(x + dx - 3.5, BUNN - 34), (x + dx - 3.5 + tilt * 0.4, top + 14), (x + dx + 3.5 + tilt * 0.4, top + 14), (x + dx + 3.5, BUNN - 34)])
        poly(d, s, [(x + dx + tilt * 0.4 - 9, top + 14), (x + dx + tilt * 0.4 + 9, top + 14), (x + dx + tilt * 0.4 + 9, top + 20), (x + dx + tilt * 0.4 - 9, top + 20)])
        rect(d, s, x + dx + tilt * 0.4 - 2.5, top, x + dx + tilt * 0.4 + 2.5, top + 14)
        sirkel(d, s, x + dx + tilt * 0.4, top - 2, 4.5)


def plattform(d, s, x, skala=1.0):
    """Oljeplattform: tre bein med tverrstag, dekk, bolig, boretårn, kran og fakkel."""
    k = skala
    def X(v): return x + v * k
    def Y(v): return BUNN - v * k
    for lx in (-34, 0, 34):
        poly(d, s, [(X(lx - 5), Y(0)), (X(lx - 3), Y(66)), (X(lx + 3), Y(66)), (X(lx + 5), Y(0))])
    poly(d, s, [(X(-34), Y(8)), (X(0), Y(58)), (X(0), Y(52)), (X(-34), Y(2))])
    poly(d, s, [(X(34), Y(8)), (X(0), Y(58)), (X(0), Y(52)), (X(34), Y(2))])
    rect(d, s, X(-52), Y(82), X(52), Y(66))                         # dekk
    rect(d, s, X(-46), Y(112), X(-18), Y(82))                       # bolig
    rect(d, s, X(-40), Y(124), X(-24), Y(112))
    poly(d, s, [(X(14), Y(82)), (X(20), Y(166)), (X(26), Y(166)), (X(32), Y(82))])   # boretårn
    rect(d, s, X(18), Y(172), X(28), Y(166))
    poly(d, s, [(X(40), Y(82)), (X(50), Y(120)), (X(52), Y(118)), (X(44), Y(82))])   # kran
    rect(d, s, X(46), Y(122), X(78), Y(119))
    rect(d, s, X(58), Y(82), X(60), Y(119))
    rect(d, s, X(-4), Y(98), X(2), Y(82))
    rect(d, s, X(-3), Y(140), X(-1), Y(98))                         # fakkel
    poly(d, s, [(X(-5), Y(152)), (X(-2), Y(140)), (X(1), Y(152)), (X(-2), Y(160))])


PREIK_TOPP = BUNN - 262


def preikestolen(d, s, x):
    """Preikestolen: fjellside som stiger mot et flatt platå og slutter i et loddrett stup; selve «prekestolen» stikker ut som en liten
    plate i kanten. Fjellryggen bak er lavere."""
    t = PREIK_TOPP
    poly(d, s, [(x - 420, BUNN), (x - 330, BUNN - 60), (x - 240, BUNN - 130), (x - 190, t + 70), (x - 150, t + 14), (x - 130, t), (x + 108, t),
                (x + 112, t + 3), (x + 150, t + 3), (x + 152, t + 30), (x + 112, t + 30), (x + 112, BUNN)])
    poly(d, s, [(x + 112, BUNN), (x + 112, BUNN - 150), (x + 190, BUNN - 120), (x + 270, BUNN - 70), (x + 340, BUNN)])


def preikestolen_skygge(d, s, x):
    """Stupets skyggeside: litt mørkere enn resten, så det leses som en loddrett vegg."""
    poly(d, s, [(x + 40, PREIK_TOPP + 30), (x + 112, PREIK_TOPP + 30), (x + 112, BUNN), (x + 40, BUNN)])


def skip(d, s, x, hoyde=1.0):
    """Mastene på et seilskip (tre master med rær, sammenrullede seil og vimpler); skroget skjules av forgrunnen."""
    k = hoyde
    for dx, mh in ((-46, 250), (0, 290), (46, 232)):
        mx_ = x + dx * k
        rect(d, s, mx_ - 1.8, BUNN - mh * k, mx_ + 1.8, BUNN - 20)
        for fy, bredde in ((0.40, 40), (0.58, 34), (0.76, 26)):
            y = BUNN - mh * k * fy - 10
            rect(d, s, mx_ - bredde / 2 * k, y - 1.6, mx_ + bredde / 2 * k, y + 1.6)                 # rå
            rect(d, s, mx_ - (bredde / 2 - 2) * k, y + 1.6, mx_ + (bredde / 2 - 2) * k, y + 6 * k)    # sammenrullet seil
        rect(d, s, mx_ + 1.8, BUNN - mh * k, mx_ + 1.8 + 16 * k, BUNN - mh * k + 5.5 * k)             # vimpel
    for dx1, mh1, dx2, mh2 in ((-46, 250, 0, 290), (0, 290, 46, 232)):
        d.line([((x + dx1 * k) * s, (BUNN - mh1 * k) * s), ((x + dx2 * k) * s, (BUNN - mh2 * k) * s)], fill=255, width=max(1, int(1.2 * s)))
    for dx, mh, ex in ((-46, 250, -110), (46, 232, 112)):
        d.line([((x + dx * k) * s, (BUNN - mh * k) * s), ((x + ex * k) * s, (BUNN - 36) * s)], fill=255, width=max(1, int(1.2 * s)))


def maake(d, s, x, y, b):
    """Én måke sett fra siden: to buer med litt tykkelse."""
    for sign in (-1, 1):
        pts = []
        for t in np.linspace(0, 1, 14):
            px = x + sign * t * b
            py = y - np.sin(t * np.pi * 0.9) * b * 0.32 + t * b * 0.12
            pts.append((px, py))
        for (ax, ay), (bx, by) in zip(pts[:-1], pts[1:]):
            d.line([(ax * s, ay * s), (bx * s, by * s)], fill=255, width=int(b * 0.12 * s))


def stavanger(a, vinter):
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    # himmelen: målt fra et rent felt langt til venstre og høyre (jevn, med litt korn)
    ren = np.concatenate([a[300:520, 20:300].reshape(-1, 3), a[300:520, 1960:2150].reshape(-1, 3)])
    himmel = np.median(ren, axis=0)
    korn = ren.std(axis=0)
    glatt = np.stack([gaussian_filter(a[..., k], 1.5) for k in range(3)], axis=-1)   # kornet skal ikke utløse masken
    avstand = np.abs(glatt - himmel).max(2)
    morkere = (himmel[0] - glatt[..., 0]) > 3.0
    band = (yy > 230) & (yy < 560) & (xx > 470) & (xx < 1950)
    maske = morkere & (avstand < 38) & band
    maske = binary_opening(maske, structure=np.ones((5, 5)))
    maske = binary_dilation(maske, structure=np.ones((9, 9)))
    maske &= (avstand < 60)
    for bx, by, br in BOBLER:
        maske &= (xx - bx) ** 2 + (yy - by) ** 2 > (br + 8) ** 2
    delta = np.median(himmel - a[maske & (avstand > 5)], axis=0)       # hvor mye mørkere silhuettene var
    print(f'{"vinter" if vinter else "sommer"}: himmel {himmel.round(0)}, silhuettene var {delta.round(1)} mørkere, {int(maske.sum())} piksler fylt')
    # fyll: himmelfarge + ekte korn, tatt fra det jevneste 96×96-feltet i de rene områdene og lagt som speilvendte fliser
    best, bestsd = None, 1e9
    for (xa, xb) in ((20, 300), (1960, 2150)):
        for y in range(300, 424, 8):
            for x in range(xa, xb - 96, 8):
                sd = a[y:y + 96, x:x + 96].std(axis=(0, 1)).sum()
                if sd < bestsd:
                    best, bestsd = a[y:y + 96, x:x + 96] - himmel, sd
    flis = np.concatenate([np.concatenate([best, best[:, ::-1]], axis=1), np.concatenate([best[::-1], best[::-1, ::-1]], axis=1)], axis=0)
    fyll = himmel + np.tile(flis, (h // flis.shape[0] + 1, w // flis.shape[1] + 1, 1))[:h, :w]
    ut = a.copy()
    ut[maske] = fyll[maske]
    # nye silhuetter: bare der pikslene er himmel nå, og ikke i boblene
    himmelaktig = (np.abs(ut - himmel).max(2) < 9)
    for bx, by, br in BOBLER:
        himmelaktig &= (xx - bx) ** 2 + (yy - by) ** 2 > (br + 6) ** 2
    langt = lag(lambda d, s: (gamle_stavanger(d, s, 486, 560, 30, 22), valbergtaarnet(d, s, 1488), plattform(d, s, 2085, 0.7)))
    naer = lag(lambda d, s: (domkirken(d, s, 606), preikestolen(d, s, 262), gamle_stavanger(d, s, 696, 770, 38, 26), sverd_i_fjell(d, s, 1985), plattform(d, s, 1745, 1.2), skip(d, s, 1620, 0.8)))
    skygge = lag(lambda d, s: preikestolen_skygge(d, s, 262))
    for alfa, styrke in ((langt, 1.4), (naer, 2.0), (skygge, 2.7)):
        farge = himmel - delta * styrke
        m = (alfa * himmelaktig)[..., None]
        ut = ut * (1 - m) + farge * m
    # måker: lyse, litt mørkere enn skyene
    gull = lag(lambda d, s: [maake(d, s, *p) for p in [(1150, 78, 30), (1216, 100, 22), (1112, 108, 17), (1655, 196, 24), (1716, 224, 17), (390, 160, 20)]])
    m = (gull * himmelaktig)[..., None] * 0.95
    ut = ut * (1 - m) + np.array([240, 248, 248.0]) * m
    return Image.fromarray(np.clip(ut + 0.5, 0, 255).astype(np.uint8))


for navn, vinter in (('hero-stavanger', False), ('hero-stavanger-vinter', True)):
    kilde = Image.open(os.path.join(BILDER, navn + '.jpg')).convert('RGB')
    bilde = stavanger(np.asarray(kilde).astype(float), vinter)
    bilde.save(os.path.join(UT, navn + '.jpg'), quality=90, progressive=True, optimize=True)
    bilde.save(os.path.join(UT, navn + '.webp'), quality=82, method=6)
