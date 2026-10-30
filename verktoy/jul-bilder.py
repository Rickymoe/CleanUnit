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


def ballong(farge=BURGUNDER):
    env = 'M900 130 C1150 130 1260 330 1230 520 C1210 640 1060 770 1012 810 L788 810 C740 770 590 640 570 520 C540 330 650 130 900 130Z'
    gores = ''.join(f'<ellipse cx="900" cy="470" rx="{rx}" ry="420" fill="{f}"/>'
                    for rx, f in [(340, farge), (262, '#fff'), (184, farge), (106, '#fff'), (40, farge)])
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
    skygge = f'<ellipse cx="900" cy="1075" rx="190" ry="20" fill="#B9D8DB" opacity=".7"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{B}" height="{H}" viewBox="0 0 {B} {H}">
{sky()}{sky_cloud(1330, 210, 1.15)}{sky_cloud(190, 420, .95)}{sky_cloud(1480, 520, .8)}
{bakke()}
{tre(260, 1000, 1.25)}{tre(1520, 1010, 1.3)}{tre(430, 1060, .8)}{tre(1370, 1070, .75)}
{skygge}{rep}{brenner}
<defs><clipPath id="k"><path d="{env}"/></clipPath></defs>
<path d="{env}" fill="#fff"/>
<g clip-path="url(#k)">{gores}<ellipse cx="1130" cy="520" rx="150" ry="330" fill="#000" opacity=".07"/></g>
<g clip-path="url(#k)">{sno_topp}</g>{lenker}{kurv}
{snofall(7)}
</svg>'''


def logo():
    kilde = Path('bilder/logo-cleanunit.svg').read_text()
    indre = re.search(r'<svg[^>]*>(.*)</svg>', kilde, re.S).group(1)
    indre = re.sub(r'<title>.*?</title>', '', indre, flags=re.S)
    # Skiltet: 1080 × 400 ved (360, 330). Logoen (626 × 192) skaleres til 880 bred, midtstilt.
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
{logo_svg}{skilt_topp}{lenke}
<path d="M0 1010 C300 960 560 975 900 985 C1240 975 1500 960 1800 1010 V1200 H0Z" fill="#fff"/>
<path d="M330 1040 C440 962 580 985 670 1015 C780 975 900 995 960 1020 C1080 968 1230 990 1330 1020 C1420 985 1470 1000 1480 1040 Z" fill="#EAF4F6"/>
<path d="M360 1050 C470 990 590 1005 680 1030 C780 998 900 1012 960 1034 C1070 990 1220 1006 1310 1032 C1390 1004 1440 1018 1450 1050 Z" fill="#fff"/>
{snofall(21)}
</svg>'''


def eksporter(svg, navn):
    with tempfile.TemporaryDirectory() as tmp:
        sti = Path(tmp) / f'{navn}.svg'
        sti.write_text(svg)
        png = UT / f'{navn}.png'
        subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--hide-scrollbars',
                        f'--screenshot={png.resolve()}', f'--window-size={B},{H}',
                        '--default-background-color=FFFFFFFF', f'file://{sti}'],
                       check=True, capture_output=True)
    im = Image.open(UT / f'{navn}.png').convert('RGB')
    im.save(UT / f'{navn}.png', optimize=True)
    im.save(UT / f'{navn}.jpg', quality=92, optimize=True)
    print(navn, im.size)


UT.mkdir(parents=True, exist_ok=True)
eksporter(ballong(BURGUNDER), 'jul-ballong-oslo')
eksporter(ballong(TEAL), 'jul-ballong-stavanger')
eksporter(logo(), 'jul-logo')
