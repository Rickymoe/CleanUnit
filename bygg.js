// Bygger fem sider per by fra deler/layout.html + sider/<side>.html + byer.json til dist/.
// Kjøres lokalt (`node bygg.js`) og i deploy-workflowen før kommentar-
// strippingen. Null avhengigheter med vilje — pipelinen skal ikke trenge
// npm install.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const DELTE_MAPPER = ['css', 'js', 'bilder'];

// Sidene hver by får. `id` er nøkkelen i byer.json (sider.<id>), `fil` navnet på sider/<fil>.html,
// `sti` mappa under byens rot (tom = forsiden). Hver side ligger i egen mappe med index.html, så
// URL-ene blir /tjenester/ og /stavanger/tjenester/.
export const SIDER = [
  { id: 'forside', fil: 'forside', sti: '' },
];

// Menyvalgene som er undersider. Nøklene aktiv_<id> må alltid finnes (også for sider som ikke er
// bygget ennå), ellers kaster fyllMal på menyen.
export const NAV_IDER = ['tjenester', 'referanser', 'om_oss', 'miljo'];

// Betingede blokker: {{#nøkkel}}…{{/nøkkel}} tas med bare når data[nøkkel] er en ikke-tom
// streng, {{^nøkkel}}…{{/nøkkel}} bare når den er tom. Brukt for innhold som bare gjelder ett
// kontor (Oslo-teksten fra Marit), så det ikke ligger i Stavanger-siden og blir skjult med CSS.
export function fyllMal(mal, data) {
  mal = mal.replace(/\{\{([#^])([a-z_]+)\}\}([\s\S]*?)\{\{\/\2\}\}/g, (_, tegn, nokkel, innhold) => {
    if (!(nokkel in data)) throw new Error(`Mangler verdi for {{${tegn}${nokkel}}}`);
    return (tegn === '#') === Boolean(data[nokkel]) ? innhold : '';
  });
  return mal.replace(/\{\{([a-z_]+)\}\}/g, (_, nokkel) => {
    if (!(nokkel in data)) throw new Error(`Mangler verdi for {{${nokkel}}}`);
    return data[nokkel];
  });
}

// {{> side}} = sider/<side.fil>.html, {{> navn}} = deler/<navn>.html. Settes inn FØR fyllMal, så
// partials kan inneholde både nøkler og betingede blokker. Linjeskiftet etter markøren spises:
// partialene slutter selv med linjeskift, så utfallet blir byte-likt det som lå inline.
// Partials kan bruke andre partials; fem runder fanger sirkulære referanser.
export function settInnDeler(tekst, les, side) {
  for (let runde = 0; runde < 5; runde++) {
    const ny = tekst.replace(/\{\{>\s*([a-z-]+)\s*\}\}\n?/g, (_, navn) =>
      navn === 'side' ? les(`sider/${side.fil}.html`) : les(`deler/${navn}.html`));
    if (!/\{\{>/.test(ny)) return ny;
    if (ny === tekst) throw new Error('For dype partials (sirkulær?)');
    tekst = ny;
  }
  throw new Error('For dype partials (sirkulær?)');
}

// Alt som varierer per (by × side). `rot` = fra siden til nettstedets rot (css, js, bilder),
// `by_rot` = fra siden til byens forside (menylenker til egne undersider). Stavanger ligger ett nivå
// ned, undersidene ett til: stavanger/tjenester/ har rot ../../ og by_rot ../.
export function sideData(by, side, byer) {
  const egen = by.sider && by.sider[side.id];
  if (!egen) throw new Error(`byer.json: «${by.data.by}» mangler sider.${side.id}`);
  const forside = side.id === 'forside';
  if (!forside && !egen.h1) throw new Error(`byer.json: «${by.data.by}» sider.${side.id} mangler h1`);
  const sidedyp = side.sti ? 1 : 0;
  const rot = '../'.repeat((by.mappe ? 1 : 0) + sidedyp);
  const by_rot = '../'.repeat(sidedyp);
  const andre = byer.find((b) => b !== by);
  const andre_by_hjem = rot + (andre.mappe ? `${andre.mappe}/` : '');
  const data = {
    ...by.data,
    rot,
    by_rot,
    js_rot: rot || './',
    andre_by_hjem,
    andre_by_href: andre_by_hjem + side.sti,
    side_klasse: side.fil,
    side_tittel: egen.tittel,
    side_beskrivelse: egen.beskrivelse,
    side_h1: egen.h1 || by.data.hovedtittel,
    side_url: by.data.og_url + side.sti,
    logo_href: forside ? '#' : by_rot,
    logo_label: forside ? 'Clean Unit, til toppen' : 'Clean Unit, til forsiden',
  };
  for (const id of NAV_IDER) data[`aktiv_${id}`] = id === side.id ? ' aria-current="page"' : '';
  return data;
}

export function byggAlle({ kilde = '.', ut = 'dist' } = {}) {
  const les = (f) => readFileSync(join(kilde, f), 'utf8');
  const layout = les('deler/layout.html');
  const { byer } = JSON.parse(les('byer.json'));
  rmSync(ut, { recursive: true, force: true });
  for (const mappe of DELTE_MAPPER) {
    cpSync(join(kilde, mappe), join(ut, mappe), {
      recursive: true,
      filter: (src) => basename(src) !== '_kilde',
    });
  }
  const skrevet = [];
  for (const by of byer) {
    for (const side of SIDER) {
      const html = fyllMal(settInnDeler(layout, les, side), sideData(by, side, byer));
      const mappe = join(ut, by.mappe, side.sti);
      mkdirSync(mappe, { recursive: true });
      const sti = join(mappe, 'index.html');
      writeFileSync(sti, html);
      skrevet.push(sti);
    }
  }
  return skrevet;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const sti of byggAlle()) console.log('skrev', sti);
}
