# Tegner Stavanger-husene i bybildet (bilder/hero-stavanger*.jpg): Oslo-bygårdene byttes ut med hvite trehus med bratte
# saltak i Gamle Stavanger-stil. Marit 2026-10-09: «Samme stil og farger, men vise tydelig at det er Stavanger.»
# Kilde er Oslo-scenene (bilder/hero-scene.jpg og hero-scene-vinter.jpg); begge versjonene lages (vinter: snø på takene, krans med lys, snøfonn, grantrærne beholdt). Trær, busker og sykkelen står foran og beholdes fra originalen, himmel, ballong, skyer,
# bil, vei og lekeplass røres ikke. Husene tegnes i scenens egne målte farger (burgunder fra Marit, hvit, lys teal) med samme korn.
# Kjør fra repo-roten: python3 verktoy/hero-stavanger-hus.py [utmappe]; deretter verktoy/hero-stavanger-silhuett.py (bakgrunnen).
import os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

BILDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bilder')
UT = sys.argv[1] if len(sys.argv) > 1 else BILDER
SS = 3
BUNN = 574                      # fortauet: husene står her
SONE = (770, 1600, 120, 574)    # x0, x1, y0, y1: området med bygninger i Oslo-scenen
GRAN = [(772, 455, 758, 793, 568), (826, 520, 807, 847, 562), (1006, 478, 974, 1040, 568), (1124, 468, 1084, 1161, 568), (1438, 478, 1404, 1475, 568), (1604, 492, 1579, 1631, 568)]   # grantrær i vinterscenen: apex x, apex y, base x0, base x1, base y
BUSKER = [(770, 890), (1000, 1045), (1120, 1185), (1465, 1540), (1583, 1605)]
GLASS = (1140, 1340, 140, 574)  # glasstårnet i Oslo-scenen er nær himmelfargen og må regnes som bygning

HVIT = (247, 248, 248); SKYGGE = (224, 231, 232)
BURG_L = (137, 62, 108); BURG_M = (117, 53, 93); BURG_M2 = (104, 46, 83); BURG_D = (84, 36, 68)
TEAL_VEGG = (196, 228, 228); ROSE_VEGG = (236, 208, 222); GUL_VEGG = (246, 236, 196); GUL = (247, 209, 80)
RAMME = (250, 250, 250)
SNO = (253, 254, 254); SNO_SKYGGE = (212, 230, 236)
VINTER = False                  # settes i lag_stavanger: snø på takene, krans med lys, snøfonn langs foten


def himmelfarge(a):
    ren = np.concatenate([a[300:520, 20:300].reshape(-1, 3), a[300:520, 1960:2150].reshape(-1, 3)])
    return np.median(ren, axis=0)


def kornflis(a, himmel):
    best, bestsd = None, 1e9
    for (xa, xb) in ((20, 300), (1960, 2150)):
        for y in range(300, 424, 8):
            for x in range(xa, xb - 96, 8):
                sd = a[y:y + 96, x:x + 96].std(axis=(0, 1)).sum()
                if sd < bestsd:
                    best, bestsd = a[y:y + 96, x:x + 96] - himmel, sd
    flis = np.concatenate([np.concatenate([best, best[:, ::-1]], axis=1), np.concatenate([best[::-1], best[::-1, ::-1]], axis=1)], axis=0)
    return flis


def fargetrekk(a):
    mx = a.max(2); mn = a.min(2); d = mx - mn
    s = d / np.maximum(mx, 1e-9)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    dd = np.maximum(d, 1e-9)
    hue = np.where(d == 0, 0, np.where(mx == r, ((g - b) / dd) % 6, np.where(mx == g, (b - r) / dd + 2, (r - g) / dd + 4))) * 60
    return hue, s, mx


def forgrunn(a, himmel):
    """Trær (løv + stamme), busker og sykkelen, hentet fra Oslo-originalen."""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    hue, s, v = fargetrekk(a / 255)
    sone = (xx >= SONE[0]) & (xx <= SONE[1]) & (yy >= SONE[2]) & (yy <= SONE[3])
    lov = ((hue >= 65) & (hue <= 150) & (s > 0.30)) & sone
    lab, n = ndi.label(lov)
    F = np.zeros((h, w), bool)
    for i in range(1, n + 1):
        m = lab == i
        if m.sum() < 400:
            continue
        ys, xs = np.where(m)
        cx, yb = int(np.median(xs)), ys.max()
        F |= m
        if m.sum() > 1500:
            F |= (xx >= cx - 6) & (xx <= cx + 6) & (yy >= yb - 8) & (yy <= BUNN) & (v < 0.55) & (hue >= 60) & (hue <= 215)
    G = ndi.binary_dilation(F, iterations=28)
    F |= ((hue >= 165) & (hue <= 200) & (s > 0.55) & (v < 0.62) & (yy >= 545) & sone & G)
    return ndi.binary_dilation(F, iterations=2) & sone


def forgrunn_vinter(a):
    """Grantrær (med stjerner og lys), busker og snøhetter hentes fra vinter-originalen: fargene til grantrærne er så nær fasadenes
    mørke teal at de velges ut med en trekant per tre, og så på farge inni den."""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    hue, s, v = fargetrekk(a / 255)
    tre = (hue >= 160) & (hue <= 198) & (s > 0.55) & (v < 0.60)
    snoe = (v > 0.93) & (s < 0.12)
    gul = (hue >= 35) & (hue <= 65) & (s > 0.45) & (v > 0.6)
    F = np.zeros((h, w), bool)
    for (ax, ay, bx0, bx1, by) in GRAN:
        # trekant: apex (ax, ay), base (bx0..bx1, by); kantene utvides litt
        u = np.clip((yy - ay) / max(by - ay, 1), 0, 1)
        venstre = ax + (bx0 - ax) * u - 5
        hoyre = ax + (bx1 - ax) * u + 5
        tri = (yy >= ay - 3) & (yy <= by) & (xx >= venstre) & (xx <= hoyre)
        stjerne = ((xx - ax) ** 2 + (yy - (ay - 4)) ** 2 < 16 ** 2) & gul
        F |= (tri & (tre | snoe | gul)) | stjerne
    for (x0, x1) in BUSKER:
        F |= (xx >= x0) & (xx <= x1) & (yy >= 552) & (yy <= BUNN) & tre
    F = ndi.binary_closing(F, structure=np.ones((5, 5)))
    F = ndi.binary_fill_holes(F)
    return ndi.binary_dilation(F, iterations=1) & (xx >= SONE[0]) & (xx <= SONE[1]) & (yy >= SONE[2]) & (yy <= SONE[3])


def bygning_maske(a, himmel):
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    dist = np.abs(a - himmel).max(2)
    sone = (xx >= SONE[0]) & (xx <= SONE[1]) & (yy >= SONE[2]) & (yy <= SONE[3])
    ns = (dist > 22) & sone
    ns |= (xx >= GLASS[0]) & (xx <= GLASS[1]) & (yy >= GLASS[2]) & (yy <= GLASS[3])
    lab, _ = ndi.label(ns)
    stor = np.bincount(lab[lab > 0]).argmax()
    b = lab == stor
    b = ndi.binary_fill_holes(b)
    return ndi.binary_dilation(b, iterations=3) & sone


class Tegner:
    def __init__(self):
        self.lag = Image.new('RGBA', (2172 * SS, 724 * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.lag)

    def poly(self, pts, f):
        self.d.polygon([(x * SS, y * SS) for x, y in pts], fill=tuple(f) + (255,))

    def rect(self, x0, y0, x1, y1, f):
        self.d.rectangle([min(x0, x1) * SS, min(y0, y1) * SS, max(x0, x1) * SS, max(y0, y1) * SS], fill=tuple(f) + (255,))

    def ellipse(self, cx, cy, rx, ry, f):
        self.d.ellipse([(cx - rx) * SS, (cy - ry) * SS, (cx + rx) * SS, (cy + ry) * SS], fill=tuple(f) + (255,))

    def line(self, p, q, f, bredde):
        self.d.line([(p[0] * SS, p[1] * SS), (q[0] * SS, q[1] * SS)], fill=tuple(f) + (255,), width=max(1, int(bredde * SS)))

    def alfa(self):
        return self.lag.resize((2172, 724), Image.LANCZOS)


def mix(f, g, t):
    return tuple(int(round(f[i] * (1 - t) + g[i] * t)) for i in range(3))


def vindu(t, x, y, b, hh, lys):
    t.rect(x - 1.6, y - 1.6, x + b + 1.6, y + hh + 1.6, RAMME)
    glass = GUL if lys else BURG_M2
    t.rect(x, y, x + b, y + hh, glass)
    t.rect(x + b / 2 - 0.9, y, x + b / 2 + 0.9, y + hh, RAMME)
    t.rect(x, y + hh * 0.42, x + b, y + hh * 0.42 + 1.6, RAMME)
    t.rect(x - 3, y + hh + 1.6, x + b + 3, y + hh + 4, RAMME)      # vinduskarm


def hus(t, x, b, etasjer, vegg, tak='gavl', lys=(), dekk=0.0, pipe=None, etg=54, krans=False):
    """Ett trehus med front mot oss. tak: 'gavl' (gavlen mot oss) eller 'side' (mønet på langs, med takkvist)."""
    vh = etasjer * etg
    topp = BUNN - vh
    sk = mix(vegg, SKYGGE, 0.7)
    t.rect(x, topp, x + b, BUNN, vegg)
    t.rect(x + b * 0.9, topp, x + b, BUNN, sk)                                    # skyggesiden
    for yy in range(int(topp) + 7, BUNN - 2, 7):                                  # kledning
        t.rect(x, yy, x + b, yy + 0.9, mix(vegg, SKYGGE, 0.45))
    t.rect(x, BUNN - 3, x + b, BUNN, mix(vegg, (150, 160, 162), 0.35))           # sokkel
    rh = b * (0.62 if tak == 'gavl' else 0.30)
    if tak == 'gavl':
        mid = x + b / 2
        t.poly([(x - 5, topp), (mid, topp - rh), (x + b + 5, topp)], BURG_M)
        t.poly([(mid, topp - rh), (x + b + 5, topp), (mid, topp)], BURG_M2)       # mørk halvdel
        t.poly([(x - 2, topp + 0.5), (mid, topp - rh + 4), (mid, topp - rh + 8), (x + 2, topp + 0.5 + 4)], BURG_L)
        t.line((x - 5, topp), (mid, topp - rh), RAMME, 1.6)
        t.line((mid, topp - rh), (x + b + 5, topp), RAMME, 1.6)
        if VINTER:
            snoetak_gavl(t, x, b, topp, rh)
        t.ellipse(mid, topp - rh * 0.42, 5, 5, RAMME)
        t.ellipse(mid, topp - rh * 0.42, 3.2, 3.2, BURG_M2)
        if pipe is not None:
            px = x + b * pipe
            t.rect(px, topp - rh * 0.78, px + 7, topp - rh * 0.25, BURG_D)
            t.rect(px - 1.5, topp - rh * 0.78 - 3, px + 8.5, topp - rh * 0.78, RAMME)
            if VINTER:
                t.ellipse(px + 3.5, topp - rh * 0.78 - 3, 6.5, 3.4, SNO)
    else:
        t.poly([(x - 6, topp), (x + 12, topp - rh), (x + b - 12, topp - rh), (x + b + 6, topp)], BURG_M)
        t.poly([(x + b * 0.5, topp - rh), (x + b - 12, topp - rh), (x + b + 6, topp), (x + b * 0.5, topp)], BURG_M2)
        t.line((x - 6, topp), (x + 12, topp - rh), RAMME, 1.6)
        t.line((x + 12, topp - rh), (x + b - 12, topp - rh), RAMME, 1.6)
        t.line((x + b - 12, topp - rh), (x + b + 6, topp), RAMME, 1.6)
        if VINTER:
            snoetak_side(t, x, b, topp, rh)
        kx = x + b * 0.5 - 14
        t.rect(kx, topp - rh * 0.95, kx + 28, topp - rh * 0.05, vegg)             # takkvist
        t.poly([(kx - 4, topp - rh * 0.95), (kx + 14, topp - rh * 1.35), (kx + 32, topp - rh * 0.95)], BURG_D)
        vindu(t, kx + 8, topp - rh * 0.8, 12, 12, False)
        if pipe is not None:
            px = x + b * pipe
            t.rect(px, topp - rh - 12, px + 7, topp - rh * 0.5, BURG_D)
            t.rect(px - 1.5, topp - rh - 15, px + 8.5, topp - rh - 12, RAMME)
            if VINTER:
                t.ellipse(px + 3.5, topp - rh - 15, 6.5, 3.4, SNO)
    antall = 2 if b < 100 else 3
    gap = (b * 0.9 - antall * 15) / (antall + 1)
    for e in range(etasjer):
        ytopp = topp + e * etg + 12
        for k in range(antall):
            vx = x + gap * (k + 1) + 15 * k
            if e == etasjer - 1 and k == antall // 2 and antall == 3:
                # inngangsdør midt i første etasje
                t.rect(vx - 2, BUNN - 40, vx + 17, BUNN - 3, RAMME)
                t.rect(vx, BUNN - 38, vx + 15, BUNN - 3, BURG_M)
                t.rect(vx + 2, BUNN - 34, vx + 13, BUNN - 24, BURG_M2)
                t.poly([(vx - 5, BUNN - 40), (vx + 7.5, BUNN - 50), (vx + 20, BUNN - 40)], BURG_D)
                continue
            vindu(t, vx, ytopp, 15, 24, (e, k) in lys)
    if VINTER and krans:
        lyskrans(t, x + 4, x + b - 4, topp + 22)


def snoetak_gavl(t, x, b, topp, rh):
    """Snø langs begge takflatene på et gavltak, med litt overheng ved raftene."""
    mid = x + b / 2
    tykk = 8
    t.poly([(x - 7, topp + 2), (mid, topp - rh - 3), (x + b + 7, topp + 2), (x + b + 1, topp + 3), (mid, topp - rh + tykk + 1), (x - 1, topp + 3)], SNO)
    t.poly([(x - 1, topp + 3), (mid, topp - rh + tykk + 1), (x + b + 1, topp + 3), (x + b - 3, topp + 6), (mid, topp - rh + tykk + 4), (x + 3, topp + 6)], SNO_SKYGGE)
    for ex in (x - 5, x + b + 5):
        t.ellipse(ex, topp + 1, 5, 4, SNO)


def snoetak_side(t, x, b, topp, rh):
    t.poly([(x - 8, topp + 2), (x + 11, topp - rh - 3), (x + b - 11, topp - rh - 3), (x + b + 8, topp + 2), (x + b + 2, topp + 3), (x + b - 12, topp - rh + 6), (x + 12, topp - rh + 6), (x - 2, topp + 3)], SNO)
    for ex in (x - 6, x + b + 6):
        t.ellipse(ex, topp + 1, 5, 4, SNO)


def lyskrans(t, x0, x1, y0):
    """Krans med gule lys over fasaden (som i Oslo-vinterscenen)."""
    n = 9
    for i in range(n + 1):
        u = i / n
        px = x0 + (x1 - x0) * u
        py = y0 + 9 * np.sin(u * np.pi)
        t.ellipse(px, py, 2.1, 2.1, (248, 214, 84))
    for i in range(n * 3):
        u = i / (n * 3)
        px = x0 + (x1 - x0) * u
        py = y0 + 9 * np.sin(u * np.pi)
        t.ellipse(px, py, 0.7, 0.7, (150, 120, 60))


def snofonn(t):
    """Fonn langs foten av husene, så husene står i snøen: bølgende topp, lyseblå underkant."""
    pts = [(770, BUNN + 6)]
    for xx in range(770, 1605, 6):
        pts.append((xx, BUNN - 6 - 3.5 * np.sin(xx / 17.0) - 2.5 * np.sin(xx / 6.3)))
    pts.append((1605, BUNN + 6))
    t.poly(pts, SNO)
    pts2 = [(x_, y_ + 4) for x_, y_ in pts[1:-1]]
    t.poly([(770, BUNN + 6)] + [(x_, y_ + 5) for x_, y_ in pts2] + [(1605, BUNN + 6)], SNO)


def tegn_byen(t):
    # bakre rad: lysere og lavere detaljnivå, så husene i front står frem
    bakgrunnsvegg = (231, 238, 239)
    for (x, b, e, vegg) in [(836, 70, 3, bakgrunnsvegg), (1004, 84, 4, bakgrunnsvegg), (1222, 78, 3, bakgrunnsvegg), (1388, 74, 3, bakgrunnsvegg)]:
        vh = e * 54
        topp = BUNN - vh
        t.rect(x, topp, x + b, BUNN, vegg)
        t.rect(x + b * 0.88, topp, x + b, BUNN, mix(vegg, SKYGGE, 0.8))
        rh = b * 0.6
        t.poly([(x - 4, topp), (x + b / 2, topp - rh), (x + b + 4, topp)], mix(BURG_M, (200, 170, 190), 0.25))
        t.poly([(x + b / 2, topp - rh), (x + b + 4, topp), (x + b / 2, topp)], mix(BURG_M2, (200, 170, 190), 0.25))
        if VINTER:
            snoetak_gavl(t, x, b, topp, rh)
        for ey in range(1, e + 1):
            for kx in (0.28, 0.62):
                t.rect(x + b * kx, topp + ey * 54 - 38, x + b * kx + 12, topp + ey * 54 - 16, mix(BURG_M2, (230, 230, 232), 0.35))
    # fremre rad
    hus(t, 792, 80, 2, HVIT, 'gavl', lys=[(1, 0)], pipe=0.2)
    hus(t, 874, 94, 3, HVIT, 'gavl', lys=[(2, 1), (1, 0)], pipe=0.7, krans=True)
    hus(t, 970, 88, 2, TEAL_VEGG, 'side', lys=[(0, 1)], pipe=0.15)
    hus(t, 1060, 100, 3, HVIT, 'gavl', lys=[(2, 0), (1, 1)], pipe=0.25)
    hus(t, 1162, 92, 3, ROSE_VEGG, 'gavl', lys=[(1, 1)], pipe=0.65, krans=True)
    hus(t, 1256, 98, 2, GUL_VEGG, 'side', lys=[(0, 0), (1, 1)], pipe=0.7)
    hus(t, 1356, 86, 3, HVIT, 'gavl', lys=[(2, 0)], pipe=0.2, krans=True)
    hus(t, 1444, 78, 2, TEAL_VEGG, 'gavl', lys=[(1, 1)], pipe=0.7)
    hus(t, 1524, 62, 2, HVIT, 'gavl', lys=[], pipe=None)


def sykkel(t, a):
    """Sykkelen, tegnet på nytt i scenens flate stil (originalen sitter fast i den gamle fasaden)."""
    mork = (30, 92, 98); lys = (225, 240, 240)
    for cx in (1305, 1360):
        t.ellipse(cx, 565, 15.5, 15.5, mork)
        t.ellipse(cx, 565, 12.5, 12.5, (176, 214, 216))
        t.ellipse(cx, 565, 2.4, 2.4, mork)
    for p, q in [((1305, 565), (1325, 543)), ((1325, 543), (1349, 543)), ((1349, 543), (1360, 565)), ((1325, 543), (1334, 565)), ((1334, 565), (1305, 565)), ((1334, 565), (1349, 543)), ((1349, 543), (1352, 533)), ((1344, 533), (1356, 533)), ((1324, 543), (1322, 536)), ((1316, 536), (1329, 536))]:
        t.line(p, q, mork, 2.6)
    t.line((1308, 562), (1322, 546), lys, 1.1)


def lag_stavanger(kilde, vinter=False):
    global VINTER
    VINTER = vinter
    a = np.asarray(Image.open(os.path.join(BILDER, kilde)).convert('RGB')).astype(float)
    h, w, _ = a.shape
    himmel = himmelfarge(a)
    flis = kornflis(a, himmel)
    korn = np.tile(flis, (h // flis.shape[0] + 1, w // flis.shape[1] + 1, 1))[:h, :w]
    F = forgrunn_vinter(a) if vinter else forgrunn(a, himmel)
    B = bygning_maske(a, himmel) & ~F
    ut = a.copy()
    ut[B] = (himmel + korn)[B]                                  # gamle bygninger bort, himmel inn
    t = Tegner()
    tegn_byen(t)
    if vinter:
        snofonn(t)
    sykkel(t, a)
    lag = np.asarray(t.alfa()).astype(float)
    alfa = (lag[..., 3] / 255)[..., None]
    farge = lag[..., :3] + korn * 0.55                          # litt korn over husene, så de ikke blir for glatte
    ut = ut * (1 - alfa) + farge * alfa
    ut[F] = a[F]                                                # trær og busker foran
    return Image.fromarray(np.clip(ut + 0.5, 0, 255).astype(np.uint8))


if __name__ == '__main__':
    for kilde, mal, vinter in (('hero-scene.jpg', 'hero-stavanger', False), ('hero-scene-vinter.jpg', 'hero-stavanger-vinter', True)):
        bilde = lag_stavanger(kilde, vinter)
        bilde.save(os.path.join(UT, mal + '.jpg'), quality=90, progressive=True, optimize=True)
        bilde.save(os.path.join(UT, mal + '.webp'), quality=82, method=6)
