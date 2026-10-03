# Genererer de seks tjenestemerkene (bilder/ikon-*.svg): flate, runde, i fargene fra
# cleanunit.no (aqua + plomme). Kjør: python3 verktoy/symboler.py
# SKYGGE=False (Marit, 2026-10-02: «Skyggene i symboler kan godt fjernes»): symbolene tegnes
# uten den lange diagonale skyggen. Skyggekoden er beholdt (hver konvekse del feid langs en
# retning, klippet til sirkelen) så den kan slås på igjen med SKYGGE=True.
import math, os

# Farger fra Maritts palett, uten burgunder (Ricky 2026-10-03: «alle ikonene må få nye farger som
# passer inn i fargepaletten», så «den røde fargen passer ikke inn»): grønn mellom #87CAC9, grønn lys
# #AED1D1, grønn mørk #008789 og grå #B6B6B6. Variabelnavnene PLUM* er historiske (de var plomme):
# PLUM = grønn mørk (bakgrunn og kropper), PLUM_D/PLUM_DD = mørkere trinn (teal-mørk #00595B),
# PLUM_L = lysere trinn, LILAC = svært lys grønn flate. GREY er logoens C-grå.
AQUA='#87CAC9'; AQUA_D='#008789'; AQUA_L='#AED1D1'
PLUM='#008789'; PLUM_D='#00595B'; PLUM_DD='#004244'; PLUM_L='#5FB3B2'
MINT='#B6B6B6'; MINT_D='#8E9595'; WHITE='#F4F7F8'; LILAC='#D3E6E6'; GREY='#8E9595'
HIGHLIGHT=WHITE      # skiveglans (hvit, så alle seks symbolene har hvitt, Ricky 2026-10-03)
# Aksentene står på to ulike bunner: på lys aqua-bakgrunn grå, på mørk grønn bakgrunn lys grønn.
def tema(aqua_bunn):
    global MINT, MINT_D
    MINT, MINT_D = ('#B6B6B6', '#8E9595') if aqua_bunn else ('#AED1D1', '#87CAC9')
SKYGGE=False        # lang diagonal skygge på/av (av etter Marits ønske)
DIR=(1,1)           # skyggeretning (ned mot høyre)
LEN=150

def circ(cx,cy,r,n=28):
    return [(cx+r*math.cos(2*math.pi*i/n), cy+r*math.sin(2*math.pi*i/n)) for i in range(n)]
def ell(cx,cy,rx,ry,n=28):
    return [(cx+rx*math.cos(2*math.pi*i/n), cy+ry*math.sin(2*math.pi*i/n)) for i in range(n)]
def rect(x0,y0,x1,y1): return [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
def rot(pts,cx,cy,deg):
    a=math.radians(deg); c,s=math.cos(a),math.sin(a)
    return [(cx+(x-cx)*c-(y-cy)*s, cy+(x-cx)*s+(y-cy)*c) for x,y in pts]
def bar(x0,y0,x1,y1,w):  # tykk linje mellom to punkter
    dx,dy=x1-x0,y1-y0; L=math.hypot(dx,dy); nx,ny=-dy/L*w/2,dx/L*w/2
    return [(x0+nx,y0+ny),(x1+nx,y1+ny),(x1-nx,y1-ny),(x0-nx,y0-ny)]

def hull(points):
    pts=sorted(set((round(x,3),round(y,3)) for x,y in points))
    if len(pts)<=2: return pts
    def cross(o,a,b): return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[]
    for p in pts:
        while len(lo)>=2 and cross(lo[-2],lo[-1],p)<=0: lo.pop()
        lo.append(p)
    up=[]
    for p in reversed(pts):
        while len(up)>=2 and cross(up[-2],up[-1],p)<=0: up.pop()
        up.append(p)
    return lo[:-1]+up[:-1]

def sweep(pts):
    d=math.hypot(*DIR); dx,dy=DIR[0]/d*LEN,DIR[1]/d*LEN
    return hull(list(pts)+[(x+dx,y+dy) for x,y in pts])

def path(pts): return 'M'+' L'.join(f'{x:.1f} {y:.1f}' for x,y in pts)+'Z'

def badge(name,bg,shadow,parts,casts=None):
    """parts: [(pts,fill)] i tegnerekkefølge. casts: hvilke deler som kaster skygge (alle som standard)."""
    casts=range(len(parts)) if casts is None else casts
    sh=''.join(f'<path d="{path(sweep(parts[i][0]))}"/>' for i in casts) if SKYGGE else ''
    body=''.join(f'<path d="{path(p)}" fill="{f}"/>' for p,f in parts)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-hidden="true" data-navn="{name}">
<defs><clipPath id="k-{name}"><circle cx="100" cy="100" r="98"/></clipPath></defs>
<circle cx="100" cy="100" r="98" fill="{bg}"/>
<g clip-path="url(#k-{name})">{f'<g fill="{shadow}">{sh}</g>' if SKYGGE else ''}
{body}</g></svg>'''

icons={}

tema(True)
# 1. Barnehagerenhold — bøtte med skum og to leke-klosser (aqua)
icons['barnehage']=badge('barnehage',AQUA,AQUA_D,[
  ([(58,98),(124,98),(116,162),(66,162)],PLUM),                    # bøtte
  (rect(54,92,128,102),PLUM_D),                                    # kant
  (circ(72,90,10),WHITE),(circ(90,83,13),WHITE),(circ(108,90,11),WHITE),(circ(82,76,8),WHITE),(circ(100,74,8),'#E6F2F3'),
  (rect(126,124,160,158),LILAC),                                   # kloss
  (rect(126,124,160,134),'#C3DCDC'),
  (circ(143,146,7),PLUM_L),
  (rect(140,92,172,124),MINT),                                     # kloss 2
  (rect(140,92,172,102),MINT_D),
],casts=[0,1,7,9])

tema(False)
# 2. Daglig renhold — sprayflaske og kluter (plomme)
icons['daglig']=badge('daglig',PLUM,PLUM_DD,[
  (rect(66,86,104,162),WHITE),                                     # flaske
  (rect(66,86,104,98),LILAC),
  (rect(76,68,94,86),MINT),                                        # hals
  ([(76,56),(118,56),(118,68),(94,72),(76,72)],MINT_D),           # hode
  (rect(118,58,132,66),MINT),                                      # dyse
  (rect(110,142,170,154),AQUA),                                    # kluter
  (rect(106,130,166,142),AQUA_L),
  (rect(110,118,170,130),AQUA),
  (circ(142,98,4),MINT),(circ(154,88,3),MINT),(circ(146,78,3),MINT)  # sprut
],casts=[0,3,5,6,7])

tema(True)
# 3. Hovedrengjøring — bøtte med verktøy som stikker opp (aqua)
icons['hoved']=badge('hoved',AQUA,AQUA_D,[
  (bar(92,112,70,52,7),GREY),                                      # børstehåndtak (bak bøtta)
  ([(52,34),(88,28),(94,46),(58,52)],MINT),                        # børstehode
  (bar(104,112,104,46,7),PLUM_D),                                  # rakelhåndtak
  (rect(82,40,126,50),MINT_D),                                     # rakelblad
  (rect(114,66,134,114),WHITE),                                    # sprayflaske
  (rect(114,66,134,74),LILAC),
  ([(116,54),(146,54),(146,64),(126,68),(116,68)],MINT),          # spray-hode
  ([(62,110),(138,110),(128,170),(72,170)],PLUM),                  # bøtte (smalere)
  (rect(58,104,142,116),PLUM_D),                                   # kant
  (rect(80,130,120,138),WHITE),                                    # bånd
],casts=[0,1,2,3,4,6,7,8])

tema(False)
# 4. Hygieneartikler — dispenser med dråpe (plomme)
icons['hygiene']=badge('hygiene',PLUM,PLUM_DD,[
  (rect(64,52,136,128),WHITE),                                     # dispenser
  (rect(64,52,136,66),LILAC),
  (rect(104,74,116,110),PLUM_L),                                   # spalte
  ([(64,128),(136,128),(128,142),(72,142)],MINT),                  # tut
  (hull(circ(100,164,10)+[(100,144)]),AQUA),                       # dråpe
],casts=[0,3,4])

tema(True)
# 5. Gulvbehandling — gulvmaskin og glans (aqua)
icons['gulv']=badge('gulv',AQUA,AQUA_D,[
  (ell(100,150,58,13),MINT),                                       # skive
  (ell(100,146,58,10),HIGHLIGHT),
  (rect(84,98,116,146),PLUM),                                      # motor
  (rect(84,98,116,108),PLUM_D),
  (bar(108,100,140,34,7),PLUM_D),                                  # skaft
  (rect(128,28,154,38),PLUM_D),                                    # tverrhåndtak
  (bar(30,150,42,140,4),WHITE),(bar(36,170,52,160,4),WHITE),(bar(160,140,172,150,4),WHITE),
  ([(52,96),(56,104),(64,108),(56,112),(52,120),(48,112),(40,108),(48,104)],WHITE),     # glans-stjerne
  ([(150,90),(153,96),(160,99),(153,102),(150,108),(147,102),(140,99),(147,96)],WHITE), # glans-stjerne
],casts=[0,2,4,5])

tema(False)
# 6. Vinduspuss — vindu og rakel (plomme)
icons['vindu']=badge('vindu',PLUM,PLUM_DD,[
  (rect(54,44,146,134),WHITE),                                     # ramme
  (rect(62,52,138,126),AQUA),                                      # glass
  (rect(98,52,102,126),WHITE),(rect(62,86,138,90),WHITE),
  (rect(66,56,84,60),AQUA_L),(rect(66,64,74,68),AQUA_L),          # refleks
  (rect(80,118,150,130),MINT),                                     # rakel
  (rect(110,130,120,162),LILAC),
],casts=[0,6,7])

# 7. Teppe- og møbelrens — sofa på et teppe med frynser og glans (mørk grønn)
tema(False)
icons['teppe']=badge('teppe',PLUM,PLUM_DD,[
  (rect(34,132,166,160),AQUA),                                     # teppe
  (rect(46,132,54,160),WHITE),(rect(70,132,78,160),WHITE),(rect(94,132,102,160),AQUA_L),
  (rect(118,132,126,160),WHITE),(rect(142,132,150,160),WHITE),     # striper
  (rect(30,138,34,154),AQUA_L),(rect(166,138,170,154),AQUA_L),     # frynser
  (rect(58,64,142,104),WHITE),                                     # ryggstø
  (rect(58,64,142,74),LILAC),
  (rect(44,88,66,128),AQUA_L),(rect(134,88,156,128),AQUA_L),       # armlener
  (rect(62,102,138,128),WHITE),                                    # sete
  (rect(62,102,138,108),LILAC),
  (rect(54,128,62,138),PLUM_D),(rect(138,128,146,138),PLUM_D),     # føtter
  ([(160,60),(164,70),(174,74),(164,78),(160,88),(156,78),(146,74),(156,70)],AQUA_L),   # glans-stjerne
],casts=[0,7,10,13])

HER=os.path.dirname(os.path.abspath(__file__))
UT=os.path.join(HER,'..','bilder')
FILNAVN={'barnehage':'ikon-barnehage','daglig':'ikon-daglig','hoved':'ikon-hovedrengjoring','hygiene':'ikon-hygiene','gulv':'ikon-gulv','vindu':'ikon-vindu','teppe':'ikon-teppe'}
for n,svg in icons.items():
    open(os.path.join(UT,FILNAVN[n]+'.svg'),'w').write(svg)

cells=''.join(f'<figure><div class="stor">{s}</div><div class="rad"><div class="m72">{s}</div><div class="m44">{s}</div></div><figcaption>{n}</figcaption></figure>' for n,s in icons.items())
open(os.path.join('/tmp','symboler-ark.html'),'w').write(f'''<!doctype html><meta charset="utf-8"><style>
body{{margin:0;padding:28px;background:#F4F8F8;font:14px system-ui}}
.rutenett{{display:grid;grid-template-columns:repeat(3,260px);gap:34px 40px}}
figure{{margin:0}} .stor svg{{width:260px;height:260px;display:block}}
.rad{{display:flex;gap:16px;align-items:center;margin-top:10px}}
.m72 svg{{width:72px;height:72px;display:block}} .m44 svg{{width:44px;height:44px;display:block}}
figcaption{{margin-top:6px;color:#3a5656;font-weight:600}}
</style><div class="rutenett">{cells}</div>''')
print('ok', list(icons))
