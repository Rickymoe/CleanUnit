# Tegner de fire avatarene ved ansattsitatene på Om oss (bilder/avatar-1..4.svg): flate byster i logoens grønt, grått og
# burgunder, uten ansiktstrekk eller hudtone, så ingen ekte person kan gjenkjennes (Marit 2026-10-09: bilder eller tegninger?).
# Rekkefølgen følger sitatene: Monika S, Urszula, Aneta, Vilma. Kjør: python3 verktoy/ansatte-avatarer.py
HODE = '#D9EAEA'
BUNN = '#E7F4F4'
FIGURER = [  # (hårform, genser, hår)
    ('kort', '#008789', '#00595B'),
    ('langt', '#87CAC9', '#8E9595'),
    ('knute', '#75355D', '#75355D'),
    ('bob', '#00595B', '#B6B6B6'),
]
BAK = {
    'kort': '',
    'langt': 'M18.5 30C18.5 14 25 11 32 11C39 11 45.5 14 45.5 30L48 50L16 50Z',
    'knute': None,
    'bob': 'M18 33C18 15 25 12 32 12C39 12 46 15 46 33L45 40C45 41 19 41 19 40Z',
}
FRONT = {
    'kort': 'M19.5 28C19.5 15 25.5 12 32 12C38.5 12 44.5 15 44.5 28C42 23 38 20 32 20C26 20 22 23 19.5 28Z',
    'langt': 'M20 29C21 18 26 16 32 16C38 16 43 18 44 29C41 23 36 21.5 32 21.5C28 21.5 23 23 20 29Z',
    'knute': 'M19.5 28C19.5 15 25.5 12 32 12C38.5 12 44.5 15 44.5 28C42 23 38 20 32 20C26 20 22 23 19.5 28Z',
    'bob': 'M19.5 30C20 17 25.5 14.5 32 14.5C38.5 14.5 44 17 44.5 30C41.5 22.5 37 20 32 20C27 20 22.5 22.5 19.5 30Z',
}
for i, (form, genser, har) in enumerate(FIGURER, 1):
    bak = f'<circle cx="32" cy="10" r="6" fill="{har}"/>' if form == 'knute' else (f'<path d="{BAK[form]}" fill="{har}"/>' if BAK[form] else '')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-hidden="true"><defs><clipPath id="r"><circle cx="32" cy="32" r="32"/></clipPath></defs>'
           f'<g clip-path="url(#r)"><rect width="64" height="64" fill="{BUNN}"/>{bak}'
           f'<path d="M10 66C10 52 19 45 32 45C45 45 54 52 54 66Z" fill="{genser}"/>'
           f'<rect x="28" y="36" width="8" height="10" rx="3" fill="{HODE}"/><circle cx="32" cy="28" r="12" fill="{HODE}"/>'
           f'<path d="{FRONT[form]}" fill="{har}"/></g></svg>\n')
    open(f'bilder/avatar-{i}.svg', 'w', encoding='utf8').write(svg)
