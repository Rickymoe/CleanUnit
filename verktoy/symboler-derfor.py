# Genererer de to «Derfor»-symbolene (bilder/ikon-erfaring.svg, bilder/ikon-dette-far-du.svg):
# flate, runde, burgunder (#75355D, Maritts burgunder) med hvit glyf, uten skygge, i samme stil som tjenestesymbolene.
# Var grønne (#008789) til 2026-10-08, da Ricky ba om å prøve burgunder.
# Kjør: python3 verktoy/symboler-derfor.py
import os

BURGUNDER = '#75355D'
STREK = 'fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"'
GLYFER = {
    # kalender med hake (Erfaring)
    'erfaring': '<rect x="16" y="19" width="32" height="28" rx="4"/><path d="M16 29h32M24 15v8M40 15v8"/><path d="M25 38l5 5 9-10"/>',
    # skjold med hake (Dette får du)
    'dette-far-du': '<path d="M32 14l14 5v11c0 9-6 15-14 19-8-4-14-10-14-19V19z"/><path d="M25 32l5 5 9-10"/>',
}

rot = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bilder')
for navn, glyf in GLYFER.items():
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true">'
           f'<circle cx="32" cy="32" r="32" fill="{BURGUNDER}"/><g {STREK}>{glyf}</g></svg>\n')
    with open(os.path.join(rot, f'ikon-{navn}.svg'), 'w') as f:
        f.write(svg)
