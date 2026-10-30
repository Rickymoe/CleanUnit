#!/usr/bin/env python3
"""Lager jul2026/bilder/jul-ballong-oslo|stavanger.{png,jpg} og jul-logo.{png,jpg}: tre julebilder i samme flate stil som
vinterbybildene (himmel #9AD2D5, burgunder #75355D, teal #008789). Logoen er den ekte logo-cleanunit.svg, urørt.
Tegnes som SVG og rasteriseres med Chrome uten skjerm.
Kjør: python3 verktoy/jul-bilder.py"""
import math, random, re, subprocess, tempfile
from pathlib import Path
from PIL import Image

B, H = 1800, 1200
UT = Path('jul2026/bilder')
BURGUNDER, TEAL, TEAL_MORK, HIMMEL = '#75355D', '#008789', '#00595B', '#9AD2D5'


def snofall(seed, n=140, ymax=H):
    r = random.Random(seed)
    return ''.join(
        f'<circle cx="{r.uniform(0, B):.0f}" cy="{r.uniform(0, ymax):.0f}" r="{r.choice([3, 4, 5, 6, 8]):.0f}" fill="#fff" opacity="{r.uniform(.55, .95):.2f}"/>'
        for _ in range(n))


def sky():
    return f'''<defs><linearGradient id="himmel" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#8CCACD"/><stop offset="1" stop-color="#BFE3E4"/></linearGradient></defs>
<rect width="{B}" height="{H}" fill="url(#himmel)"/>
<circle cx="250" cy="200" r="62" fill="#FFE9A0"/>'''


def sky_cloud(x, y, s=1.0):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="#fff">'
            '<circle cx="0" cy="0" r="46"/><circle cx="60" cy="-22" r="58"/><circle cx="125" cy="0" r="46"/>'
            '<rect x="-46" y="0" width="217" height="46" rx="23"/></g>')


def tre(x, y, s=1.0, lys=True):
    """Gran: tre lag med snø på kantene, og lyslenke."""
    lag = [(0, 260, 120), (-70, 190, 150), (-140, 120, 180)]  # (toppy, halvbredde-ish) enkelt
    d = f'<g transform="translate({x} {y}) scale({s})">'
    d += '<rect x="-18" y="-10" width="36" height="50" fill="#5A3B2E"/>'
    for i, (ty, w, hh) in enumerate([(-230, 78, 120), (-150, 105, 130), (-60, 135, 140)]):
        d += f'<path d="M0 {ty-30} L{w} {ty+hh-30} L{-w} {ty+hh-30}Z" fill="{TEAL_MORK if i % 2 else TEAL}"/>'
        d += (f'<path d="M0 {ty-30} L{w*.42:.0f} {ty+hh*.42-30:.0f} Q{w*.2:.0f} {ty+hh*.34-30:.0f} 0 {ty+hh*.46-30:.0f} '
              f'Q{-w*.2:.0f} {ty+hh*.34-30:.0f} {-w*.42:.0f} {ty+hh*.42-30:.0f}Z" fill="#fff"/>')
    d += '<path d="M0 -280 l9 22 24 3 -18 16 5 24 -20 -12 -20 12 5 -24 -18 -16 24 -3z" fill="#FFD54F"/>'
    if lys:
        for (px, py, c) in [(-40, -200, '#FFD54F'), (30, -165, '#fff'), (-55, -120, '#FFD54F'), (50, -95, '#fff'),
                            (-85, -55, '#FFD54F'), (10, -40, '#FFD54F'), (80, -20, '#fff')]:
            d += f'<circle cx="{px}" cy="{py}" r="9" fill="{c}"/>'
    return d + '</g>'


def bakke():
    return f'''<path d="M0 860 Q300 790 620 850 T1250 830 T1800 850 V1200 H0Z" fill="#DCEEF0"/>
<path d="M0 960 Q420 880 900 950 T1800 930 V1200 H0Z" fill="#F4FAFB"/>
<path d="M0 1070 Q500 1010 1000 1060 T1800 1040 V1200 H0Z" fill="#fff"/>'''


def lyslenke(x0, y0, x1, y1, sag, n, seed=1):
    """Lyslenke: kvadratisk kurve med pærer. Returnerer (snor, pærer)."""
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + sag
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append(((1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1,
                    (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1))
    snor = f'<path d="M{x0} {y0} Q{cx} {cy} {x1} {y1}" fill="none" stroke="#3B2A33" stroke-width="3"/>'
    farger = ['#FFD54F', '#FFF3C4', '#FFD54F', '#F6A6C1']
    pærer = ''.join(
        f'<circle cx="{px:.0f}" cy="{py+10:.0f}" r="22" fill="{farger[i % 4]}" opacity=".28"/>'
        f'<circle cx="{px:.0f}" cy="{py+9:.0f}" r="10" fill="{farger[i % 4]}"/>'
        for i, (px, py) in enumerate(pts))
    return snor + pærer


def natt_bakgrunn(seed=11):
    """Nattehimmel med stjerner, måne og tre kuler av snødekte åser; definerer gradientene «natt», «maane», «skinn» og filteret «glod»."""
    r = random.Random(seed)
    stjerner = ''.join(f'<circle cx="{r.uniform(0, B):.0f}" cy="{r.uniform(0, 620):.0f}" r="{r.choice([1.5, 2, 2.5, 3]):.1f}" fill="#fff" opacity="{r.uniform(.35, .9):.2f}"/>' for _ in range(90))
    return f"""<defs><linearGradient id="natt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B222B"/><stop offset="1" stop-color="#215662"/></linearGradient>
<radialGradient id="maane" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".55"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient>
<radialGradient id="skinn" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD98A" stop-opacity=".28"/><stop offset="1" stop-color="#FFD98A" stop-opacity="0"/></radialGradient>
<filter id="glod" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter></defs>
<rect width="{B}" height="{H}" fill="url(#natt)"/>{stjerner}
<circle cx="1480" cy="190" r="190" fill="url(#maane)"/><circle cx="1480" cy="190" r="62" fill="#F7EFD0"/>
<path d="M0 880 Q300 810 620 870 T1250 850 T1800 870 V1200 H0Z" fill="#2B6671"/>
<path d="M0 975 Q420 905 900 970 T1800 950 V1200 H0Z" fill="#BCD6DC"/>
<path d="M0 1075 Q500 1020 1000 1068 T1800 1050 V1200 H0Z" fill="#E4EFF2"/>"""


def ballong(farge=BURGUNDER, natt=False):
    hvit = '#E9EFF2' if natt else '#fff'   # om natten lyses ballongen opp av lysene, ikke av sola
    env = 'M900 130 C1150 130 1260 330 1230 520 C1210 640 1060 770 1012 810 L788 810 C740 770 590 640 570 520 C540 330 650 130 900 130Z'
    gores = ''.join(f'<ellipse cx="900" cy="470" rx="{rx}" ry="420" fill="{f}"/>'
                    for rx, f in [(340, farge), (262, hvit), (184, farge), (106, hvit), (40, farge)])
    lenker = (lyslenke(585, 430, 1215, 430, 95, 12) + lyslenke(600, 560, 1200, 560, 85, 11) +
              lyslenke(655, 680, 1145, 680, 65, 9))
    sno_topp = ('<path d="M690 235 C720 150 810 120 900 120 C990 120 1080 150 1110 235 '
                'C1090 262 1060 240 1035 270 C1010 292 985 256 955 278 C925 300 900 262 870 282 '
                'C840 296 815 258 790 276 C760 292 725 262 690 235Z" fill="#fff"/>'
                '<path d="M700 245 C740 262 790 250 830 272" fill="none" stroke="#CFE6E8" stroke-width="5" opacity=".7"/>')
    snor = ''.join(f'<line x1="{a}" y1="810" x2="{b}" y2="920" stroke="#3B2A33" stroke-width="5"/>'
                   for a, b in [(792, 835), (840, 860), (960, 940), (1008, 965)][:0])
    rep = ('<line x1="800" y1="808" x2="838" y2="922" stroke="#3B2A33" stroke-width="5"/>'
           '<line x1="1000" y1="808" x2="962" y2="922" stroke="#3B2A33" stroke-width="5"/>'
           '<line x1="850" y1="812" x2="852" y2="922" stroke="#3B2A33" stroke-width="4"/>'
           '<line x1="950" y1="812" x2="948" y2="922" stroke="#3B2A33" stroke-width="4"/>')
    kurv = ('<rect x="826" y="920" width="148" height="104" rx="12" fill="#9A6A45"/>'
            + ''.join(f'<line x1="826" y1="{y}" x2="974" y2="{y}" stroke="#7B5236" stroke-width="4"/>' for y in (946, 972, 998))
            + ''.join(f'<line x1="{x}" y1="920" x2="{x}" y2="1024" stroke="#7B5236" stroke-width="4"/>' for x in (863, 900, 937))
            + '<path d="M820 924 C830 898 850 912 870 906 C890 898 905 914 925 906 C945 898 965 910 980 904 C992 912 982 930 974 934 L826 934Z" fill="#fff"/>')
    brenner = '<ellipse cx="900" cy="826" rx="18" ry="34" fill="#FFD54F" opacity=".95"/><ellipse cx="900" cy="832" rx="9" ry="20" fill="#fff"/>'
    skygge = f'<ellipse cx="900" cy="1075" rx="190" ry="20" fill="{"#1E4A55" if natt else "#B9D8DB"}" opacity="{.5 if natt else .7}"/>'
    if natt:
        bakgrunn = natt_bakgrunn(17)
        lenker = f'<g filter="url(#glod)" opacity=".9">{lenker}</g>{lenker}'
        aura = '<ellipse cx="900" cy="500" rx="560" ry="520" fill="url(#skinn)"/><circle cx="900" cy="830" r="130" fill="url(#skinn)"/>'
    else:
        bakgrunn = f'{sky()}{sky_cloud(1330, 210, 1.15)}{sky_cloud(190, 420, .95)}{sky_cloud(1480, 520, .8)}\n{bakke()}'
        aura = ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{B}" height="{H}" viewBox="0 0 {B} {H}">
{bakgrunn}
{tre(260, 1000, 1.25)}{tre(1520, 1010, 1.3)}{tre(430, 1060, .8)}{tre(1370, 1070, .75)}
{skygge}{aura}{rep}{brenner}
<defs><clipPath id="k"><path d="{env}"/></clipPath></defs>
<path d="{env}" fill="{hvit}"/>
<g clip-path="url(#k)">{gores}<ellipse cx="1130" cy="520" rx="150" ry="330" fill="#000" opacity=".07"/></g>
<g clip-path="url(#k)">{sno_topp}</g>{lenker}{kurv}
{snofall(7)}
</svg>'''


def tekst_som_sti(tekst, storrelse, x_midt, y_grunn, farge, vekt=800):
    """Tegner tekst som SVG-sti i Manrope (variabel skrift, instansiert til gitt vekt), så den ikke avhenger av at skriften lastes."""
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    f = instantiateVariableFont(TTFont('fonter/manrope-latin.woff2'), {'wght': vekt})
    gs, cmap, upm = f.getGlyphSet(), f.getBestCmap(), f['head'].unitsPerEm
    k = storrelse / upm
    bredde = sum(f['hmtx'][cmap[ord(c)]][0] for c in tekst) * k
    x = x_midt - bredde / 2
    d = ''
    for c in tekst:
        g = cmap[ord(c)]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, x, y_grunn)))
        d += pen.getCommands()
        x += f['hmtx'][g][0] * k
    return f'<path d="{d}" fill="{farge}"/>'


def logo(hilsen=False):
    kilde = Path('bilder/logo-cleanunit.svg').read_text()
    indre = re.search(r'<svg[^>]*>(.*)</svg>', kilde, re.S).group(1)
    indre = re.sub(r'<title>.*?</title>', '', indre, flags=re.S)
    # Skiltet: 1080 × 400 ved (360, 330). Logoen (626 × 192) skaleres til 880 bred, midtstilt.
    if hilsen:
        logo_svg = (f'<svg x="550" y="352" width="700" height="215" viewBox="0 -40 626 192">{indre}</svg>'
                    + tekst_som_sti('God jul', 100, 900, 702, BURGUNDER))
    else:
        logo_svg = f'<svg x="460" y="{330 + (400 - 270) / 2:.0f}" width="880" height="270" viewBox="0 -40 626 192">{indre}</svg>'
    skilt_topp = ('<path d="M330 352 C330 322 350 312 380 312 L1420 312 C1450 312 1470 322 1470 352 '
                  'C1470 372 1450 366 1425 384 C1400 396 1385 370 1355 388 C1325 404 1305 374 1275 390 '
                  'C1240 404 1220 372 1190 388 C1160 402 1135 372 1100 388 C1065 402 1045 372 1010 388 '
                  'C975 402 950 372 915 388 C880 402 860 372 825 388 C790 402 770 372 735 388 '
                  'C700 402 680 372 645 388 C610 402 585 372 555 388 C520 402 505 372 470 388 '
                  'C440 402 420 372 390 384 C355 372 330 372 330 352Z" fill="#fff"/>')
    stolper = ''.join(f'<rect x="{x}" y="720" width="50" height="320" fill="#7B5236"/>' for x in (470, 1280))
    lenke = lyslenke(380, 745, 1420, 745, 55, 15, 3)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{B}" height="{H}" viewBox="0 0 {B} {H}">
{sky()}{sky_cloud(1400, 160, 1.1)}{sky_cloud(150, 330, .9)}
{bakke()}
{tre(190, 1010, 1.25, True)}{tre(1610, 1010, 1.3, True)}{tre(360, 1070, .75, False)}{tre(1440, 1075, .8, False)}
{stolper}
<rect x="340" y="320" width="1120" height="420" rx="36" fill="#7B5236"/>
<rect x="350" y="330" width="1100" height="400" rx="30" fill="#FFFFFF"/>
{skilt_topp}{logo_svg}{lenke}
<path d="M0 1010 C300 960 560 975 900 985 C1240 975 1500 960 1800 1010 V1200 H0Z" fill="#fff"/>
<path d="M330 1040 C440 962 580 985 670 1015 C780 975 900 995 960 1020 C1080 968 1230 990 1330 1020 C1420 985 1470 1000 1480 1040 Z" fill="#EAF4F6"/>
<path d="M360 1050 C470 990 590 1005 680 1030 C780 998 900 1012 960 1034 C1070 990 1220 1006 1310 1032 C1390 1004 1440 1018 1450 1050 Z" fill="#fff"/>
{snofall(21)}
</svg>'''


def logo_inne(fil):
    kilde = Path(fil).read_text()
    return re.sub(r'<title>.*?</title>', '', re.search(r'<svg[^>]*>(.*)</svg>', kilde, re.S).group(1), flags=re.S)


def logo_kveld():
    """1: kveldsversjon med lys logo under en lyslenke, mørk vinterhimmel."""
    lenke = lyslenke(40, 250, 1760, 250, 200, 30, 5)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{B}" height="{H}" viewBox="0 0 {B} {H}">
{natt_bakgrunn()}
{tre(200, 1030, 1.25)}{tre(1600, 1035, 1.3)}{tre(380, 1085, .8, False)}{tre(1420, 1090, .75, False)}
<ellipse cx="900" cy="560" rx="560" ry="260" fill="url(#skinn)"/>
<svg x="400" y="420" width="1000" height="307" viewBox="0 -40 626 192">{logo_inne('bilder/logo-cleanunit-lys.svg')}</svg>
<g filter="url(#glod)" opacity=".9">{lenke}</g>{lenke}
{snofall(41, 110)}
</svg>"""


def logo_krans():
    """3: grankrans med snø, lys og sløyfe rundt logoen."""
    r = random.Random(5)
    cx, cy = 900, 600
    d = ''
    for lag, steg in enumerate((4, 5, 6)):
        for a in range(0, 360, steg):
            R = (385 if lag == 2 else 405) + r.uniform(-26, 26)
            x, y = cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))
            rot = a + 90 + r.uniform(-30, 30)
            f = r.choice([TEAL_MORK, TEAL, '#00A09E', '#006E70'])
            d += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r.uniform(62, 88):.0f}" ry="{r.uniform(18, 26):.0f}" transform="rotate({rot:.0f} {x:.0f} {y:.0f})" fill="{f}"/>'
    for a in range(180, 360, 6):                           # snø på kransens øvre halvdel
        if r.random() < .62:
            R = 402 + r.uniform(-40, 40)
            x, y = cx + R * math.cos(math.radians(a)), cy + R * math.sin(math.radians(a))
            d += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{r.uniform(20, 34):.0f}" ry="9" transform="rotate({a + 90 + r.uniform(-20, 20):.0f} {x:.0f} {y:.0f})" fill="#fff" opacity=".96"/>'
    farger = ['#FFD54F', '#FFF3C4', '#FFD54F', '#F6A6C1']
    for i in range(26):
        a = i * 360 / 26 + 4
        x, y = cx + 404 * math.cos(math.radians(a)), cy + 404 * math.sin(math.radians(a))
        d += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="24" fill="{farger[i % 4]}" opacity=".3"/><circle cx="{x:.0f}" cy="{y:.0f}" r="10" fill="{farger[i % 4]}"/>'
    for a in (28, 118, 203, 290, 338):
        for dx, dy in ((0, 0), (22, 8), (8, 24)):
            x, y = cx + 412 * math.cos(math.radians(a)) + dx, cy + 412 * math.sin(math.radians(a)) + dy
            d += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="13" fill="{BURGUNDER}"/><circle cx="{x - 4:.0f}" cy="{y - 4:.0f}" r="3.5" fill="#fff" opacity=".6"/>'
    sloyfe = ('<path d="M900 1002 C820 930 730 958 744 1022 C758 1086 852 1056 900 1002Z" fill="#75355D"/>'
              '<path d="M900 1002 C980 930 1070 958 1056 1022 C1042 1086 948 1056 900 1002Z" fill="#75355D"/>'
              '<path d="M880 1018 L832 1128 L876 1108 L896 1140Z" fill="#5E2A4A"/><path d="M920 1018 L968 1128 L924 1108 L904 1140Z" fill="#5E2A4A"/>'
              '<ellipse cx="900" cy="1012" rx="28" ry="26" fill="#5E2A4A"/>')
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{B}" height="{H}" viewBox="0 0 {B} {H}">
{sky()}{sky_cloud(120, 420, .95)}{sky_cloud(1500, 150, 1.1)}
<circle cx="{cx}" cy="{cy}" r="345" fill="#EAF4F6"/><circle cx="{cx}" cy="{cy}" r="332" fill="#fff"/>
<svg x="620" y="510" width="560" height="172" viewBox="0 -40 626 192">{logo_inne('bilder/logo-cleanunit.svg')}</svg>
{d}{sloyfe}{snofall(53, 90)}
</svg>"""


SW_LOGO = 11.8                                      # strektykkelse i logoen
_logo_stier = re.findall(r'<path[^>]* d="([^"]+)"', Path('bilder/logo-cleanunit.svg').read_text())
CLEAN_D, UNIT_D = _logo_stier[0], _logo_stier[1]    # grå sti = CLEAN, turkis sti = UNIT (ordrett fra logoen)
SIFRE = {                                           # 2, 0 og 6 tegnet som streker i logoens tykkelse (se verktoy/jul-julen-logo.py)
    '2': 'M6 103 A19 17.1 0 0 1 44 103 C44 122 26 132 6 144.1 H49',
    '0': 'M25 85.9 A19.1 29.1 0 1 0 25.01 85.9Z',
    '6': 'M5.9 121 A19.1 23.1 0 1 0 44.1 121 A19.1 23.1 0 1 0 5.9 121Z M5.9 121 C5.9 98 16 85.9 31 85.9 C36 85.9 40.5 87.2 44 90',
}


def aar_svg(farge):
    return ''.join(f'<path transform="translate({i * 63} 0)" d="{SIFRE[c]}" fill="none" stroke="{farge}" stroke-width="{SW_LOGO}" stroke-linejoin="miter" stroke-miterlimit="10"/>'
                   for i, c in enumerate('2026'))


def tekst_pa_flate(svg, bbox, flate, maks_h=.52, bredde_andel=.8):
    """Skalerer og midtstiller logo-skrift (gitt bbox i logoens koordinater) på en flate (x, y, w, h)."""
    x0, y0, x1, y1 = bbox
    fx, fy, fw, fh = flate
    sk = min(fw * bredde_andel / (x1 - x0), fh * maks_h / (y1 - y0))
    tx = fx + (fw - (x1 - x0) * sk) / 2 - x0 * sk
    ty = fy + (fh - (y1 - y0) * sk) / 2 - y0 * sk
    return f'<g transform="translate({tx:.1f} {ty:.1f}) scale({sk:.4f})">{svg}</g>'


def pakke(x, y, w, h, farge, mork, bandfarge, tekst):
    """Pakke sett forfra: korpus, lokk med bånd og sløyfe, snø på lokket. Teksten går på forsiden under lokket."""
    lokk_h = 34
    flate = (x, y + lokk_h, w, h - lokk_h)
    cx = x + w / 2
    sloyfe = (f'<g transform="translate({cx} {y - 4})"><ellipse cx="-26" cy="-8" rx="28" ry="15" transform="rotate(-24 -26 -8)" fill="{bandfarge}"/>'
              f'<ellipse cx="26" cy="-8" rx="28" ry="15" transform="rotate(24 26 -8)" fill="{bandfarge}"/>'
              f'<circle cx="0" cy="-2" r="10" fill="{bandfarge}" stroke="{mork}" stroke-opacity=".35" stroke-width="2"/></g>')
    snoe = (f'<path d="M{x - 6} {y - 2} C{x + w * .12} {y - 24} {x + w * .22} {y - 6} {x + w * .32} {y - 18} '
            f'C{x + w * .38} {y - 24} {x + w * .42} {y - 4} {x + w * .46} {y - 2}Z" fill="#fff"/>'
            f'<path d="M{x + w * .6} {y - 2} C{x + w * .68} {y - 20} {x + w * .8} {y - 10} {x + w + 6} {y - 2}Z" fill="#fff"/>')
    return (f'<ellipse cx="{cx}" cy="{y + h + 4}" rx="{w * .56}" ry="12" fill="#B9D3D8" opacity=".55"/>'
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{farge}"/>'
            f'<rect x="{x - 7}" y="{y}" width="{w + 14}" height="{lokk_h}" rx="8" fill="{mork}"/>'
            f'<rect x="{cx - 13}" y="{y}" width="26" height="{lokk_h}" fill="{bandfarge}"/>'
            f'{snoe}{sloyfe}{tekst_pa_flate(*tekst, flate)}')


def gavepakker():
    CLEAN_B, UNIT_B, HELE_B, AAR_B = (3.8, 76.5, 355.1, 153.5), (380.5, 80, 625.2, 153.5), (3.8, 76.5, 625.2, 153.5), (0, 80, 239, 150)
    # én rekke i rekkefølgen Clean, Unit, CleanUnit, 2026; ulik høyde, felles bunn (y 1110)
    d = pakke(305, 970, 270, 140, TEAL, '#006567', '#FFD54F', (f'<path d="{CLEAN_D}" fill="#FFFFFF"/>', CLEAN_B))
    d += pakke(605, 940, 210, 170, BURGUNDER, '#5E2A4A', '#87CAC9', (f'<path d="{UNIT_D}" fill="#BFE8E5"/>', UNIT_B))
    d += pakke(845, 985, 400, 125, '#00595B', '#00403F', '#FFD54F',
               (f'<path d="{CLEAN_D}" fill="#FFFFFF"/><path d="{UNIT_D}" fill="#87CAC9"/>', HELE_B))
    d += pakke(1275, 955, 220, 155, '#87CAC9', '#5FB0AF', BURGUNDER, (aar_svg('#00595B'), AAR_B))
    return d


def juletre(pakker=False):
    """Stort juletre i snøen. Kulene har logoens bobler: stor #87CAC9 (r 25,7), middels #008789 (r 17,8), liten #AED1D1 (r 9)."""
    cx, bunn = 900, 1015
    lag = [(175, 390, 135), (290, 545, 195), (420, 705, 255), (570, 870, 315), (735, bunn, 375)]
    GRONN = ['#14513F', '#1B6650']                                  # dypere grønn enn merkets turkis, så kulene i turkis står frem
    kuletyper = [(30, '#87CAC9'), (21, '#008789'), (11, '#AED1D1')]
    antall = [4, 5, 7, 9, 11]
    r = random.Random(9)
    kuler = []
    for i, (ty, by, w) in enumerate(lag):
        # nedre del av laget, under lagene over (som tegnes foran) og under egen snøhette
        ymin = lag[i - 1][1] + 50 if i else ty + (by - ty) * .52
        forsok = 0
        while sum(1 for k in kuler if k[3] == i) < antall[i] and forsok < 4000:
            forsok += 1
            y = r.uniform(ymin, by - (72 if i == len(lag) - 1 else 24))   # nederste lag: unna snøhaugen
            halv = w * (y - ty) / (by - ty) - 40                       # kanten på laget i den høyden, minus margin
            if halv < 20:
                continue
            x = cx + r.uniform(-halv, halv)
            rad, farge = r.choices(kuletyper, weights=(33, 40, 27))[0]
            if all((x - k[0]) ** 2 + (y - k[1]) ** 2 > (rad + k[2] + 16) ** 2 for k in kuler):
                kuler.append((x, y, rad, i, farge))
    d = ''
    for i in reversed(range(len(lag))):                              # nederste lag først, så de øvre ligger foran
        ty, by, w = lag[i]
        bump = ''.join(f' Q{cx + w - (k + .5) * 2 * w / 5:.0f} {by + 38} {cx + w - (k + 1) * 2 * w / 5:.0f} {by}' for k in range(5))
        d += f'<path d="M{cx} {ty} L{cx + w} {by}{bump}Z" fill="{GRONN[i % 2]}"/>'
        d += (f'<clipPath id="t{i}"><path d="M{cx} {ty} L{cx + w} {by}{bump}Z"/></clipPath>'
              f'<path clip-path="url(#t{i})" d="M{cx + w} {by}{bump}" fill="none" stroke="#fff" stroke-width="28" stroke-linejoin="round"/>')   # snø langs nedre kant
        sw, sy = w * .46, ty + (by - ty) * .46
        d += (f'<path d="M{cx} {ty} L{cx + sw:.0f} {sy:.0f} Q{cx + sw/2:.0f} {sy + 26:.0f} {cx} {sy - 4:.0f} '
              f'Q{cx - sw/2:.0f} {sy + 26:.0f} {cx - sw:.0f} {sy:.0f}Z" fill="#fff"/>')
        for x, y, rad, li, farge in kuler:
            if li == i:
                d += (f'<line x1="{x:.0f}" y1="{y - rad:.0f}" x2="{x:.0f}" y2="{y - rad - 9:.0f}" stroke="#E9C46A" stroke-width="3"/>'
                      f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rad}" fill="{farge}"/>'
                      f'<circle cx="{x - rad * .32:.0f}" cy="{y - rad * .34:.0f}" r="{rad * .2:.1f}" fill="#fff" opacity=".7"/>')
    stjerne = (f'<circle cx="{cx}" cy="150" r="80" fill="#FFE9A0" opacity=".4"/>'
               f'<path transform="translate({cx} 150)" d="M0 -64 l17 42 44 4 -33 29 10 44 -38 -23 -38 23 10 -44 -33 -29 44 -4z" fill="#FFD54F"/>')
    # snøhaugen foran: treet står nedsunket i snøen, uten synlig stamme
    snohaug = (f'<path d="M{cx-520} 1070 C{cx-400} 995 {cx-220} 975 {cx} 985 C{cx+220} 975 {cx+400} 995 {cx+520} 1070Z" fill="#EAF4F6"/>'
               f'<path d="M{cx-470} 1076 C{cx-350} 1012 {cx-190} 996 {cx} 1004 C{cx+190} 996 {cx+350} 1012 {cx+470} 1076Z" fill="#fff"/>')
    tre_gruppe = f'{d}{stjerne}{snohaug}'
    gaver = ''
    if pakker:                                        # treet krympes og løftes, så det blir plass til pakkene foran
        tre_gruppe = f'<g transform="translate(0 -70) translate({cx} {bunn}) scale(.86) translate({-cx} {-bunn})">{tre_gruppe}</g>'
        gaver = gavepakker()
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{B}" height="{H}" viewBox="0 0 {B} {H}">
{sky()}{sky_cloud(1400, 190, 1.15)}{sky_cloud(120, 400, .9)}{sky_cloud(1560, 560, .75)}
{bakke()}
{tre_gruppe}
{snofall(61, 120)}{gaver}
</svg>"""


def eksporter(svg, navn):
    with tempfile.TemporaryDirectory() as tmp:
        sti = Path(tmp) / f'{navn}.svg'
        sti.write_text(svg)
        png = UT / f'{navn}.png'
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars',
                        f'--screenshot={png.resolve()}', f'--window-size={B},{H}', '--virtual-time-budget=3000',
                        '--default-background-color=FFFFFFFF', f'file://{sti}'],
                       check=True, capture_output=True)
    im = Image.open(UT / f'{navn}.png').convert('RGB')
    im.save(UT / f'{navn}.png', optimize=True)
    im.save(UT / f'{navn}.jpg', quality=92, optimize=True)
    print(navn, im.size)


UT.mkdir(parents=True, exist_ok=True)
eksporter(ballong(BURGUNDER), 'jul-ballong-oslo')
eksporter(ballong(TEAL), 'jul-ballong-stavanger')
eksporter(ballong(BURGUNDER, natt=True), 'jul-ballong-oslo-kveld')
eksporter(ballong(TEAL, natt=True), 'jul-ballong-stavanger-kveld')
eksporter(logo(), 'jul-logo')
eksporter(logo(hilsen=True), 'jul-logo-hilsen')
eksporter(logo_kveld(), 'jul-logo-kveld')
eksporter(logo_krans(), 'jul-logo-krans')
eksporter(juletre(), 'jul-juletre')
eksporter(juletre(pakker=True), 'jul-juletre-pakker')
