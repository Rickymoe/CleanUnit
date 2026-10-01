// Bygger én side per by fra mal.html + byer.json til dist/.
// Kjøres lokalt (`node bygg.js`) og i deploy-workflowen før kommentar-
// strippingen. Null avhengigheter med vilje — pipelinen skal ikke trenge
// npm install.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

// logovalg: kunde-labb («Velg logo»), ikke lenket fra noen side. Mappen
// er valgfri: byggingen hopper over den hvis den mangler (de andre mappene
// er påkrevd og skal feile høyt).
const DELTE_MAPPER = ['css', 'js', 'bilder', 'logovalg'];

export function fyllMal(mal, data) {
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
    if (mappe === 'logovalg' && !existsSync(join(kilde, mappe))) continue;
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
