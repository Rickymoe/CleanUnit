# Tegner Stavanger-heroen (bilder/hero-stavanger.svg + hero-stavanger-vinter.svg) i samme flate, naive stil som
# Oslo-scenen: varebil, sol, ballong, skyer og bobler, men med Stavanger-motiver: hvite trehus (Gamle Stavanger)
# med burgunder tak, Domkirken, Sverd i fjell, havnen med seilbåt og oljeplattform, og Preikestolen i det fjerne.
# Varebilen ligger på samme sted som i Oslo-bildet (x 381, y 466 av 2172x724), så logoen på bilsiden
# (.hero__scene-merke) og stistarten i CSS treffer. Kjør: python3 verktoy/hero-stavanger.py
# Rasterisering (jpg/webp) gjøres av verktoy/hero-stavanger-raster.mjs (Playwright/Chromium).
import base64, os, sys

W, H = 2172, 724
HIM = '#9AD2D5'; HIM_V = '#93CED3'
TEAL = '#008789'; TEAL_M = '#87CAC9'; TEAL_L = '#AED1D1'; TEAL_D = '#00595B'
BURG = '#75355D'; BURG_L = '#A5628A'; BURG_D = '#5A2848'
HVIT = '#F7F9FA'; GRA = '#B6B6B6'; GRA_M = '#8E9595'; GUL = '#FFD84A'
dir_ = os.path.dirname(os.path.abspath(__file__))
van = base64.b64encode(open(os.path.join(dir_, '..', 'bilder', 'varebil-hero.svg'), 'rb').read()).decode()

def tre(x, base, h, farge='#7DB84A', stamme='#5B4A3A', vinter=False):
    r = h * .42
    k = '#2F7F78' if vinter else farge
    s = f'<rect x="{x-3}" y="{base-h*.55}" width="6" height="{h*.55}" fill="{stamme}"/>'
    s += f'<circle cx="{x}" cy="{base-h*.68}" r="{r}" fill="{k}"/>'
    s += f'<circle cx="{x-r*.35}" cy="{base-h*.76}" r="{r*.6}" fill="#9BCB5E" opacity="{0 if vinter else .6}"/>'
    if vinter: s += f'<path d="M{x-r} {base-h*.68} Q{x} {base-h*.68-r*1.2} {x+r} {base-h*.68} Q{x} {base-h*.68-r*.5} {x-r} {base-h*.68}Z" fill="{HVIT}"/>'
    return s

def busk(x, base, b, farge=TEAL, vinter=False):
    k = '#2F7F78' if vinter else farge
    s = f'<ellipse cx="{x}" cy="{base-b*.4}" rx="{b}" ry="{b*.5}" fill="{k}"/>'
    s += f'<ellipse cx="{x+b*.5}" cy="{base-b*.3}" rx="{b*.7}" ry="{b*.4}" fill="{"#3C948B" if vinter else "#7DB84A"}"/>'
    if vinter: s += f'<ellipse cx="{x}" cy="{base-b*.8}" rx="{b*.8}" ry="{b*.18}" fill="{HVIT}"/>'
    return s

def vindu(x, y, w, h, lys=False):
    f = GUL if lys else TEAL
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{w/2 if w<14 else 3}" fill="{f}"/>'

def trehus(x, base, b, h, tak_h, tak_farge, vinter=False, vegg=HVIT, lys=(), vind=2):
    # Hvitt trehus med saltak (gavlen mot oss), vinduer i to etasjer og dør.
    s = f'<rect x="{x}" y="{base-h}" width="{b}" height="{h}" fill="{vegg}"/>'
    s += f'<rect x="{x}" y="{base-h}" width="{b*.14}" height="{h}" fill="#E3EAEC"/>'
    s += f'<path d="M{x-8} {base-h} L{x+b/2} {base-h-tak_h} L{x+b+8} {base-h}Z" fill="{tak_farge}"/>'
    if vinter: s += f'<path d="M{x-8} {base-h} L{x+b/2} {base-h-tak_h} L{x+b+8} {base-h} L{x+b+2} {base-h-3} L{x+b/2} {base-h-tak_h+10} L{x-2} {base-h-3}Z" fill="{HVIT}"/>'
    vw, vh = 18, 26
    gap = (b - vind * vw) / (vind + 1)
    i = 0
    for rad in (base-h+18, base-h+h*.5):
        for k in range(vind):
            s += vindu(x + gap + k * (vw + gap), rad, vw, vh, lys=(i in lys))
            i += 1
    s += f'<rect x="{x+b/2-11}" y="{base-38}" width="22" height="38" rx="3" fill="{BURG}"/>'
    return s

def domkirke(x, base, vinter=False):
    s = f'<rect x="{x}" y="{base-120}" width="120" height="120" fill="#D9E3E4"/>'
    s += f'<rect x="{x}" y="{base-120}" width="18" height="120" fill="#C3D1D3"/>'
    s += f'<path d="M{x-6} {base-120} L{x+60} {base-170} L{x+126} {base-120}Z" fill="{TEAL_D}"/>'
    # tårn
    s += f'<rect x="{x+120}" y="{base-210}" width="50" height="210" fill="#E6EDEE"/>'
    s += f'<rect x="{x+120}" y="{base-210}" width="12" height="210" fill="#C3D1D3"/>'
    s += f'<path d="M{x+114} {base-210} L{x+145} {base-300} L{x+176} {base-210}Z" fill="{TEAL_D}"/>'
    s += f'<rect x="{x+143}" y="{base-322}" width="4" height="26" fill="{TEAL_D}"/><rect x="{x+137}" y="{base-314}" width="16" height="4" fill="{TEAL_D}"/>'
    s += f'<rect x="{x+134}" y="{base-186}" width="22" height="46" rx="11" fill="{TEAL}"/>'
    s += f'<rect x="{x+134}" y="{base-120}" width="22" height="40" rx="11" fill="{TEAL}"/>'
    for k in range(3):
        s += f'<rect x="{x+20+k*30}" y="{base-96}" width="16" height="50" rx="8" fill="{TEAL}"/>'
    s += f'<circle cx="{x+60}" cy="{base-130+0}" r="0" fill="none"/>'
    if vinter: s += f'<path d="M{x-6} {base-120} L{x+60} {base-170} L{x+126} {base-120} L{x+120} {base-122} L{x+60} {base-160} L{x} {base-122}Z" fill="{HVIT}"/>'
    return s

def sverd_i_fjell(x, base):
    # Tre sverd (Sverd i fjell) som stikker opp av en haug ved vannet: ett skrått, to loddrette.
    s = f'<path d="M{x-90} {base} Q{x-70} {base-48} {x-20} {base-56} Q{x+40} {base-70} {x+84} {base-40} Q{x+100} {base-22} {x+110} {base}Z" fill="#7F9A9A"/>'
    s += f'<path d="M{x-60} {base} Q{x-30} {base-40} {x+10} {base-46} Q{x+60} {base-50} {x+100} {base}Z" fill="#9BB3B3"/>'
    def sverd(cx, ytopp, ybunn, vinkel):
        return (f'<g transform="rotate({vinkel} {cx} {ybunn})">'
                f'<path d="M{cx-5} {ybunn} L{cx-5} {ytopp+16} L{cx} {ytopp} L{cx+5} {ytopp+16} L{cx+5} {ybunn}Z" fill="#4C6366"/>'
                f'<rect x="{cx-13}" y="{ybunn-34}" width="26" height="5" rx="2" fill="#3A4D50"/></g>')
    s += sverd(x-24, base-190, base-48, -6) + sverd(x+10, base-210, base-52, 2) + sverd(x+44, base-176, base-46, 9)
    return s

def bat_seil(x, base, farge=BURG):
    s = f'<path d="M{x-34} {base} L{x+34} {base} L{x+24} {base+13} L{x-24} {base+13}Z" fill="{farge}"/>'
    s += f'<rect x="{x-1.5}" y="{base-62}" width="3" height="62" fill="#4C6366"/>'
    s += f'<path d="M{x+4} {base-60} L{x+4} {base-6} L{x+36} {base-6}Z" fill="{HVIT}"/>'
    s += f'<path d="M{x-4} {base-52} L{x-4} {base-6} L{x-26} {base-6}Z" fill="{TEAL_L}"/>'
    return s

def plattform(x, base):
    s = f'<g fill="#7FA9AC" opacity=".9">'
    for dx in (-40, -14, 14, 40): s += f'<rect x="{x+dx-3}" y="{base-34}" width="6" height="36"/>'
    s += f'<rect x="{x-58}" y="{base-52}" width="116" height="20"/><rect x="{x-30}" y="{base-74}" width="40" height="22"/>'
    s += f'<rect x="{x+26}" y="{base-96}" width="4" height="44"/><path d="M{x+28} {base-96} L{x+58} {base-62}" stroke="#7FA9AC" stroke-width="3"/></g>'
    return s

def maase(x, y, s=1.0):
    return f'<path transform="translate({x} {y}) scale({s})" d="M-14 0 Q-7 -9 0 0 Q7 -9 14 0" fill="none" stroke="#5B7F82" stroke-width="2.4" stroke-linecap="round"/>'

def sky(x, y, s=1.0):
    return (f'<g transform="translate({x} {y}) scale({s})" fill="{HVIT}"><circle cx="0" cy="0" r="30"/><circle cx="40" cy="-14" r="38"/>'
            f'<circle cx="86" cy="-2" r="30"/><rect x="-30" y="0" width="146" height="30" rx="14"/></g>')

def balloon(x, y):
    s = f'<g><ellipse cx="{x}" cy="{y}" rx="52" ry="62" fill="{BURG}"/>'
    s += f'<path d="M{x-14} {y-61} Q{x-34} {y} {x-16} {y+60} L{x+16} {y+60} Q{x+34} {y} {x+14} {y-61}Z" fill="{HVIT}" opacity=".95"/>'
    s += f'<path d="M{x-6} {y-62} Q{x-8} {y} {x-5} {y+62} L{x+5} {y+62} Q{x+8} {y} {x+6} {y-62}Z" fill="{BURG}"/>'
    s += f'<path d="M{x-18} {y+60} L{x-9} {y+92} M{x+18} {y+60} L{x+9} {y+92}" stroke="#7A5C40" stroke-width="2"/><rect x="{x-12}" y="{y+90}" width="24" height="20" fill="#7A5C40"/></g>'
    return s

def scene(vinter=False):
    himmel = HIM_V if vinter else HIM
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 {W} {H}" width="{W}" height="{H}">']
    o.append(f'<rect width="{W}" height="{H}" fill="{himmel}"/>')
    # sol (vinter: blek)
    if vinter:
        o.append(f'<circle cx="780" cy="140" r="34" fill="#FFE9A8"/>')
    else:
        o.append(f'<g transform="translate(780 140)"><circle r="38" fill="#FDC93C"/><circle r="38" fill="#FFD84A" opacity=".7"/>'
                 + ''.join(f'<rect x="-3" y="-72" width="6" height="22" rx="3" fill="#FFD84A" transform="rotate({a})"/>' for a in range(0, 360, 30)) + '</g>')
    o += [sky(560, 250, .95), sky(1010, 160, 1.1), sky(1330, 250, .9), sky(780, 330, .55)]
    # bobler
    for cx, cy, r in ((470, 275, 34), (545, 325, 18), (1870, 275, 32), (1790, 355, 22)):
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff" opacity=".25"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>')
    # bakgrunn: fjell/Preikestolen og Lysefjord, dempet
    sil = '#86C2C6'; sil2 = '#7DB9BE'
    o.append(f'<path d="M1500 560 L1560 470 L1640 430 L1700 360 L1700 300 L1860 300 L1860 380 L1930 450 L2060 520 L2172 560Z" fill="{sil}"/>')  # Preikestolen
    o.append(f'<path d="M1860 300 L1700 300" stroke="#9AD2D5" stroke-width="3" opacity=".4"/>')
    o.append(f'<path d="M780 560 L840 480 L900 440 L960 470 L1020 420 L1090 470 L1140 560Z" fill="{sil2}" opacity=".8"/>')
    # Valbergtårnet
    o.append(f'<g fill="{sil2}"><rect x="1005" y="372" width="30" height="190"/><rect x="995" y="350" width="50" height="26"/><path d="M1000 350 L1020 322 L1040 350Z"/></g>')
    # oljeplattform ved horisonten
    o.append(plattform(1950, 520))
    # vann (havnen) bak veien
    o.append(f'<rect x="1470" y="505" width="600" height="85" rx="18" fill="#6FB6BE"/><rect x="1470" y="505" width="600" height="10" rx="5" fill="#8CCBD0"/>')
    for k in range(7):
        o.append(f'<path d="M{1500+k*85} {540+(k%3)*10} q14 -7 28 0 t28 0" fill="none" stroke="#B7E1E3" stroke-width="3" stroke-linecap="round"/>')
    o.append(bat_seil(1830, 530)); o.append(bat_seil(2010, 548, TEAL))
    o.append(sverd_i_fjell(1625, 575))
    # bakke langs veien
    base = 575
    # trær og busker til venstre for bilen
    o += [busk(200, base, 38, vinter=vinter), tre(262, base, 105, vinter=vinter), busk(322, base, 30, '#2E9AA0', vinter), tre(190, base, 70, '#5FA33F', vinter=vinter)]
    # hus: Gamle Stavanger
    farger = [BURG, '#B24A56', BURG_L, BURG, '#B24A56']
    hus = [(748, 82, 120, 46, 0), (840, 96, 150, 50, 1), (944, 78, 108, 44, 2), (1034, 100, 170, 52, 3), (1130, 86, 128, 46, 4)]
    for i, (x, b, h, t, f) in enumerate(hus):
        o.append(trehus(x, base, b, h, t, farger[f], vinter, lys=((1, 2) if i % 2 == 0 else (3,)), vind=2))
    # bakre hus bak (kvartal)
    o.append(trehus(1238, base, 76, 96, 40, BURG_D, vinter, vegg='#E8EEF0', vind=2))
    o.append(domkirke(1328, base, vinter))
    o += [tre(1522, base, 90, vinter=vinter), busk(1556, base, 30, vinter=vinter)]
    o += [tre(740, base, 78, vinter=vinter), busk(1285, base, 24, '#2E9AA0', vinter)]
    # fotgjenger/barn med paraply? — rolig: en sykkel er i Oslo; her fiskekasser/ mast ved kaikanten
    o.append(f'<rect x="1700" y="560" width="190" height="12" fill="#8F6F52"/>')
    for x in (1710, 1790, 1870): o.append(f'<rect x="{x}" y="570" width="8" height="12" fill="#6E533D"/>')
    # vei
    o.append(f'<rect x="170" y="586" width="1830" height="46" fill="#4B5558"/><rect x="170" y="586" width="1830" height="6" fill="#6B777A"/>')
    for k in range(24):
        o.append(f'<rect x="{200+k*76}" y="612" width="40" height="5" rx="2" fill="#E8EEEF"/>')
    # ballong og måker
    o.append(balloon(1700, 150))
    o += [maase(1230, 150, 1.2), maase(1280, 175, .9), maase(1960, 210, 1.1), maase(1020, 250, .8)]
    if vinter:
        o.append(f'<path d="M170 586 Q420 580 700 586 T1300 586 T2000 586 L2000 592 L170 592Z" fill="{HVIT}" opacity=".9"/>')
    # varebil (samme posisjon som i Oslo-bildet)
    o.append(f'<image x="381" y="466" width="347" height="154" xlink:href="data:image/svg+xml;base64,{van}"/>')
    if vinter:
        import random
        random.seed(5)
        for _ in range(110):
            o.append(f'<circle cx="{random.randint(20, W-20)}" cy="{random.randint(20, 520)}" r="{random.choice((2,2,3,4))}" fill="#fff" opacity=".85"/>')
    o.append('</svg>')
    return '\n'.join(o)

for navn, v in (('hero-stavanger', False), ('hero-stavanger-vinter', True)):
    sti = os.path.join(dir_, '..', 'bilder', '_kilde', navn + '.svg')
    os.makedirs(os.path.dirname(sti), exist_ok=True)
    open(sti, 'w').write(scene(v))
    print('skrev', sti)
