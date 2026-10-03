// Bygger én side per by fra mal.html + byer.json til dist/.
// Kjøres lokalt (`node bygg.js`) og i deploy-workflowen før kommentar-
// strippingen. Null avhengigheter med vilje — pipelinen skal ikke trenge
// npm install.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const DELTE_MAPPER = ['css', 'js', 'bilder'];

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

export function byggAlle({ kilde = '.', ut = 'dist' } = {}) {
  const mal = readFileSync(join(kilde, 'mal.html'), 'utf8');
  const { byer } = JSON.parse(readFileSync(join(kilde, 'byer.json'), 'utf8'));
  rmSync(ut, { recursive: true, force: true });
  for (const mappe of DELTE_MAPPER) {
    cpSync(join(kilde, mappe), join(ut, mappe), {
      recursive: true,
      filter: (src) => basename(src) !== '_kilde',
    });
  }
  const skrevet = [];
  for (const by of byer) {
    const mal_ut = join(ut, by.mappe);
    mkdirSync(mal_ut, { recursive: true });
    const sti = join(mal_ut, 'index.html');
    writeFileSync(sti, fyllMal(mal, by.data));
    skrevet.push(sti);
  }
  return skrevet;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const sti of byggAlle()) console.log('skrev', sti);
}
