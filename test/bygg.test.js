import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fyllMal, byggAlle, settInnDeler, sideData, SIDER } from '../bygg.js';

test('fyllMal erstatter nøkler', () => {
  assert.equal(fyllMal('a {{by}} b {{by}}', { by: 'Oslo' }), 'a Oslo b Oslo');
});

test('fyllMal kaster på manglende nøkkel', () => {
  assert.throws(() => fyllMal('{{by}}', {}), /Mangler verdi for \{\{by\}\}/);
});

test('fyllMal godtar tom streng som verdi', () => {
  assert.equal(fyllMal('x{{rot}}y', { rot: '' }), 'xy');
});

test('byggAlle kjører', () => {
  rmSync('test/ut', { recursive: true, force: true });
  byggAlle({ kilde: '.', ut: 'test/ut' });
});

test('settInnDeler setter inn {{> side}} og navngitte partials (også nestet)', () => {
  const filer = { 'sider/forside.html': 'S[{{> kontakt}}]\n', 'deler/kontakt.html': 'K\n' };
  const les = (f) => { if (!(f in filer)) throw new Error(`ENOENT ${f}`); return filer[f]; };
  assert.equal(settInnDeler('a\n{{> side}}\nb', les, { fil: 'forside' }), 'a\nS[K\n]\nb');
});

test('settInnDeler kaster på ukjent partial og på sirkulære partials', () => {
  const les = (f) => { if (f === 'deler/a.html') return '{{> a}}'; throw new Error(`ENOENT ${f}`); };
  assert.throws(() => settInnDeler('{{> finnesikke}}', les, { fil: 'forside' }), /ENOENT deler\/finnesikke\.html/);
  assert.throws(() => settInnDeler('{{> a}}', les, { fil: 'forside' }), /For dype partials/);
});

const TEST_BYER = [
  { mappe: '', data: { by: 'Oslo', og_url: 'https://x.test/CleanUnit/', andre_by_navn: 'Stavanger', hovedtittel: 'HT' },
    sider: { forside: { tittel: 'F', beskrivelse: 'B' }, tjenester: { tittel: 'T', beskrivelse: 'B', h1: 'Tjenester' } } },
  { mappe: 'stavanger', data: { by: 'Stavanger', og_url: 'https://x.test/CleanUnit/stavanger/', andre_by_navn: 'Oslo', hovedtittel: 'HT' },
    sider: { forside: { tittel: 'F', beskrivelse: 'B' }, tjenester: { tittel: 'T', beskrivelse: 'B', h1: 'Tjenester' } } },
];
const FORSIDE = { id: 'forside', fil: 'forside', sti: '' };
const TJENESTER = { id: 'tjenester', fil: 'tjenester', sti: 'tjenester/' };

test('sideData: rot-dybde og lenker for alle fire kombinasjonene (Stavanger-underside = dybde 2)', () => {
  const [oslo, stav] = TEST_BYER;
  const tilfeller = [
    [oslo, FORSIDE,    { rot: '',        by_rot: '',    js_rot: './',      andre_by_hjem: 'stavanger/', andre_by_href: 'stavanger/',            logo_href: '#',    side_url: 'https://x.test/CleanUnit/' }],
    [oslo, TJENESTER,  { rot: '../',     by_rot: '../', js_rot: '../',     andre_by_hjem: '../stavanger/', andre_by_href: '../stavanger/tjenester/', logo_href: '../', side_url: 'https://x.test/CleanUnit/tjenester/' }],
    [stav, FORSIDE,    { rot: '../',     by_rot: '',    js_rot: '../',     andre_by_hjem: '../',        andre_by_href: '../',                   logo_href: '#',    side_url: 'https://x.test/CleanUnit/stavanger/' }],
    [stav, TJENESTER,  { rot: '../../',  by_rot: '../', js_rot: '../../',  andre_by_hjem: '../../',      andre_by_href: '../../tjenester/',       logo_href: '../', side_url: 'https://x.test/CleanUnit/stavanger/tjenester/' }],
  ];
  for (const [by, side, forventet] of tilfeller) {
    const d = sideData(by, side, TEST_BYER);
    for (const [k, v] of Object.entries(forventet)) assert.equal(d[k], v, `${by.data.by}/${side.id}: ${k}`);
  }
});

test('sideData: aria-current bare på gjeldende side, og h1/tittel kommer fra byer.json', () => {
  const d = sideData(TEST_BYER[0], TJENESTER, TEST_BYER);
  assert.equal(d.aktiv_tjenester, ' aria-current="page"');
  assert.equal(d.aktiv_referanser, '');
  assert.equal(d.aktiv_om_oss, '');
  assert.equal(d.aktiv_miljo, '');
  assert.equal(d.side_h1, 'Tjenester');
  assert.equal(sideData(TEST_BYER[0], FORSIDE, TEST_BYER).side_h1, 'HT');
  assert.equal(sideData(TEST_BYER[0], FORSIDE, TEST_BYER).aktiv_tjenester, '');
});

test('sideData: kaster når byer.json mangler siden, eller en underside mangler egen h1', () => {
  const uten = [{ ...TEST_BYER[0], sider: { forside: TEST_BYER[0].sider.forside } }, TEST_BYER[1]];
  assert.throws(() => sideData(uten[0], TJENESTER, uten), /mangler sider\.tjenester/);
  const utenH1 = [{ ...TEST_BYER[0], sider: { forside: { tittel: 'F', beskrivelse: 'B' }, tjenester: { tittel: 'T', beskrivelse: 'B' } } }, TEST_BYER[1]];
  assert.throws(() => sideData(utenH1[0], TJENESTER, utenH1), /mangler h1/);
});

test('SIDER: forsiden først, unike id-er, unike stier', () => {
  assert.equal(SIDER[0].id, 'forside');
  assert.equal(SIDER[0].sti, '');
  assert.equal(new Set(SIDER.map((s) => s.id)).size, SIDER.length);
  assert.equal(new Set(SIDER.map((s) => s.sti)).size, SIDER.length);
});

const les = (f) => readFileSync(f, 'utf8');

// Alle ti sider: [by, bygg-mappe] × fem sider (id → mappe under byen).
const BYER_UT = [['Oslo', 'test/ut'], ['Stavanger', 'test/ut/stavanger']];
const STIER = { forside: '', tjenester: 'tjenester/', referanser: 'referanser/', om_oss: 'om-oss/', miljo: 'miljo/' };
const alleSider = () => BYER_UT.flatMap(([by, mappe]) =>
  Object.entries(STIER).map(([id, sti]) => ({ by, id, fil: `${mappe}/${sti}index.html` })));
const sideFil = (by, id) => alleSider().find((s) => s.by === by && s.id === id).fil;
// All tekst en by viser (de fem sidene limt sammen) — for tester som bryr seg om at innholdet finnes,
// ikke hvilken side det står på.
const heleBy = (by) => alleSider().filter((s) => s.by === by).map((s) => les(s.fil)).join('\n');

test('Bygget: ti sider finnes, ingen ufylte plassholdere', () => {
  assert.equal(alleSider().length, 10);
  for (const s of alleSider()) {
    assert.ok(existsSync(s.fil), `${s.fil} mangler`);
    assert.doesNotMatch(les(s.fil), /\{\{/, `${s.fil}: ufylt plassholder`);
  }
});

test('Hver side: nøyaktig én H1, unike id-er, egen title/description, canonical = og:url', () => {
  const titler = [], beskrivelser = [];
  for (const s of alleSider()) {
    const h = les(s.fil);
    assert.equal((h.match(/<h1[\s>]/g) || []).length, 1, `${s.fil}: antall H1`);
    const ider = [...h.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ider.filter((x, i) => ider.indexOf(x) !== i), [], `${s.fil}: dupliserte id-er`);
    assert.ok(ider.includes('innhold') && ider.includes('kontakt'), `${s.fil}: mangler #innhold eller #kontakt`);
    const tittel = h.match(/<title>([^<]+)<\/title>/)?.[1];
    const besk = h.match(/<meta name="description" content="([^"]+)"/)?.[1];
    assert.ok(tittel && besk, `${s.fil}: title/description`);
    assert.equal(h.match(/og:title" content="([^"]+)"/)?.[1], tittel, `${s.fil}: og:title`);
    assert.equal(h.match(/og:description" content="([^"]+)"/)?.[1], besk, `${s.fil}: og:description`);
    const kanon = h.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    assert.ok(kanon, `${s.fil}: canonical mangler`);
    assert.equal(kanon, h.match(/og:url" content="([^"]+)"/)?.[1], `${s.fil}: canonical ≠ og:url`);
    if (s.by === 'Oslo') assert.ok([...besk].length <= 155, `${s.fil}: Oslo-description er ${[...besk].length} tegn`);
    titler.push(tittel); beskrivelser.push(besk);
  }
  assert.equal(new Set(titler).size, 10, 'title må være unik per side');
  assert.equal(new Set(beskrivelser).size, 10, 'description må være unik per side');
});

// Fanger feil rot-dybde (stavanger/tjenester/ = ../../), døde menylenker og andre-by-lenker til
// sider som ikke finnes, og ankre (#kontakt) som mangler i målsiden.
test('Alle interne lenker, bilder, stilark og import løser seg fra hver side', () => {
  for (const s of alleSider()) {
    const h = les(s.fil);
    const sideUrl = new URL(s.fil.replace('test/ut/', ''), 'https://t.test/');
    const refs = [...h.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)].map((m) => m[1])
      .concat([...h.matchAll(/from '([^']+)'/g)].map((m) => m[1]));
    assert.ok(refs.length > 20, `${s.fil}: fant bare ${refs.length} referanser — regexen er blind`);
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
      const u = new URL(ref, sideUrl);
      let sti = decodeURIComponent(u.pathname).slice(1);
      if (sti === '' || sti.endsWith('/')) sti += 'index.html';
      const mal = `test/ut/${sti}`;
      assert.ok(existsSync(mal), `${s.fil}: «${ref}» → ${mal} finnes ikke`);
      if (u.hash.length > 1) {
        assert.match(les(mal), new RegExp(`\\sid="${u.hash.slice(1)}"`), `${s.fil}: «${ref}» — ankeret finnes ikke i ${mal}`);
      }
    }
  }
});

test('Toppmeny: ekte lenker til de fire undersidene, aria-current på gjeldende side, Kontakt = #kontakt, andre by ↗ til samme underside', () => {
  const forventet = [['tjenester', 'Tjenester', 'tjenester/'], ['referanser', 'Referanser', 'referanser/'], ['om_oss', 'Om oss', 'om-oss/'], ['miljo', 'Miljø', 'miljo/']];
  for (const s of alleSider()) {
    const h = les(s.fil);
    const nav = h.slice(h.indexOf('<header class="side-nav"'), h.indexOf('</header>'));
    const lenker = [...nav.matchAll(/<a class="side-nav__lenke" href="([^"]+)"([^>]*)>([^<]+)</g)];
    assert.deepEqual(lenker.map((m) => m[3]), ['Tjenester', 'Referanser', 'Om oss', 'Miljø', 'Kontakt'], `${s.fil}: menyrekkefølgen`);
    const dybde = s.id === 'forside' ? '' : '../';
    forventet.forEach(([id, , sti], i) => {
      assert.equal(lenker[i][1], `${dybde}${sti}`, `${s.fil}: href for ${id}`);
      assert.equal(lenker[i][2], id === s.id ? ' aria-current="page"' : '', `${s.fil}: aria-current for ${id}`);
    });
    assert.equal(lenker[4][1], '#kontakt');
    assert.equal(lenker[4][2], '', `${s.fil}: Kontakt skal aldri ha aria-current`);
    const andre = s.by === 'Oslo' ? 'Stavanger' : 'Oslo';
    const by = nav.match(/class="side-nav__by" href="([^"]+)">([^<]+) </);
    assert.equal(by[2], andre, `${s.fil}: andre by`);
    const sti = STIER[s.id];
    const mal = s.by === 'Oslo' ? `test/ut/stavanger/${sti}index.html` : `test/ut/${sti}index.html`;
    assert.ok(existsSync(mal), `${s.fil}: andre-by-målet ${mal} finnes ikke`);
    assert.equal((nav.match(/<a class="side-nav__kontakt knapp knapp--omriss" href="#kontakt">Kontakt<\/a>/g) || []).length, 1, `${s.fil}: én Kontakt-knapp i raden (mobil)`);
    assert.ok(nav.indexOf('side-nav__kontakt') < nav.indexOf('side-nav__bryter'), `${s.fil}: knappen står før hamburgeren i tabrekkefølgen`);
  }
});

test('Undersider: .side-hode med synlig H1, og ingen hero, sti-start eller vinter-scene', () => {
  for (const s of alleSider().filter((x) => x.id !== 'forside')) {
    const h = les(s.fil);
    assert.match(h, /<div class="side-hode[ "][\s\S]*?<h1>[^<]+<\/h1>/, `${s.fil}: side-hode med H1`);
    assert.doesNotMatch(h, /class="visually-hidden">[^<]*<\/h1>/, `${s.fil}: H1 skal være synlig`);
    assert.doesNotMatch(h, /<header class="hero">|hero__sti-start|hero__scene/, `${s.fil}: heroen hører bare hjemme på forsiden`);
    assert.match(h, new RegExp(`<body class="by--${s.by.toLowerCase()} side--[a-z-]+">`), `${s.fil}: body-klasse`);
  }
  for (const s of alleSider().filter((x) => x.id === 'forside')) {
    assert.match(les(s.fil), /<header class="hero">/, `${s.fil}: forsiden har heroen`);
  }
});

test('Undersider: logoen er en vanlig lenke til byens forside, ikke «til toppen»', () => {
  for (const s of alleSider()) {
    const h = les(s.fil);
    const logo = h.match(/<a class="side-nav__logo" href="([^"]*)" aria-label="([^"]*)"/);
    if (s.id === 'forside') { assert.deepEqual([logo[1], logo[2]], ['#', 'Clean Unit, til toppen']); }
    else { assert.deepEqual([logo[1], logo[2]], ['../', 'Clean Unit, til forsiden'], s.fil); }
  }
});

test('main.js: sideNav kaster ikke på ikke-hash-lenker, og logoen navigerer normalt uten hero', () => {
  const js = les('js/main.js');
  assert.doesNotMatch(js, /querySelector\(a\.getAttribute\('href'\)\)/, 'scrollspyen slår opp ikke-hash-lenker som selektorer');
  assert.doesNotMatch(js, /aria-current', 'true'/, 'scrollspyen skal være borte');
  const logoKlikk = js.slice(js.indexOf("querySelector('.side-nav__logo').addEventListener"));
  assert.match(logoKlikk.slice(0, 260), /if \(!document\.querySelector\('\.hero'\)\) return/, 'logo-klikket må la nettleseren navigere når det ikke er noen hero');
});

test('main.js: hver init-funksjon verner mot manglende elementer', () => {
  const js = les('js/main.js');
  for (const [fn, vern] of [
    ['function logoAnimer', /if \(!logo\) return/],
    ['function overskriftVask', /if \(!overskrifter\.length\) return/],
    ['function kortReveal', /if \(!kort\.length\) return/],
    ['function flaateInn', /if \(reduksjon \|\| !flaate\) return/],
    ['function glansSveip', /if \(reduksjon \|\| !kort\) return/],
    ['function stiNedover', /if \(!rad \|\| !linje \|\| !hero \|\| !footer\) return/],
  ]) {
    const start = js.indexOf(fn);
    assert.ok(start > -1, fn);
    assert.match(js.slice(start, start + 1200), vern, `${fn}: vernet mangler`);
  }
  const personvern = js.slice(js.indexOf('// Personvern-modal'));
  const guard = personvern.indexOf('if (privacyBtn && privacyPanel)');
  assert.ok(guard > -1 && guard < personvern.indexOf('privacyPanel.querySelector'), 'personvern: null-sjekken må komme FØR querySelector');
});

test('CSS: .side-hode, himmel-på-himmel-vern og aria-current="page"', () => {
  const css = les('css/style.css');
  assert.match(css, /\n\.side-hode \{[^}]*linear-gradient\(to bottom, var\(--base\) 0, var\(--himmel\) 5rem, var\(--himmel\) calc\(100% - 3rem\), var\(--hode-ned, var\(--flate\)\) 100%\)/);
  assert.match(css, /\.side-hode--ned-base \{ --hode-ned: var\(--base\); \}/);
  assert.match(css, /\.side-hode \+ section \{ padding-top: var\(--s-6\); \}/);
  assert.equal((css.match(/\.side-nav__lenke\[aria-current="page"\]/g) || []).length, 2, 'desktop- og mobilregelen');
  assert.doesNotMatch(css, /aria-current="true"/);
});

// Den løse } som lå på linje 1184 (inne i en programmatisk erstatning 2026-10-03) er fjernet
// sammen med regelen den drepte — se css/style.css. Denne testen er vernet mot at det skjer igjen.
test('CSS: klammene balanserer og går aldri negativt (fanger løs } etter programmatisk erstatning)', () => {
  const css = les('css/style.css')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  let dybde = 0, linje = 1;
  for (const tegn of css) {
    if (tegn === '\n') linje++;
    if (tegn === '{') dybde++;
    if (tegn === '}') dybde--;
    assert.ok(dybde >= 0, `løs } på linje ${linje} (etter kommentar- og strengstripping)`);
  }
  assert.equal(dybde, 0, 'ubalanserte klammer: ${ uten }');
});

// Kroppen til initSider() alene. Uten dette er «kalles X fra initSider()»
// en test som ikke kan feile: mønsteret /x\(\)/ matcher også selve
// definisjonen `function x()`, så den består selv om kallet er borte.
// (Oppdaget 2026-09-30 ved å bryte hvert vern og se om testene feilet —
// glansSveip-kallet lot seg fjerne uten at noen test sa fra.)
const initKropp = (js) => js.slice(js.indexOf('export function initSider'), js.indexOf('\n}', js.indexOf('export function initSider')));

test('Oslo: egen tittel, eget telefonnummer, lenke til Stavanger i footeren', () => {
  const h = les('test/ut/index.html');
  assert.match(h, /<title>Clean Unit – renhold i Oslo<\/title>/);
  assert.match(h, /<body class="by--oslo side--forside">/);
  assert.match(h, /href="tel:\+4721555680">Ring oss – 21 55 56 80/);
  assert.match(h, /class="kontakt__bylenke" href="stavanger\/">Gå til Clean Unit Stavanger →/);
  assert.match(h, /<h1 class="visually-hidden">Renhold i Oslo, Asker og Bærum<\/h1>/);
  assert.doesNotMatch(h, /hero__tittel/);
  assert.match(h, /og:url" content="https:\/\/rickymoe\.github\.io\/CleanUnit\/"/);
  assert.doesNotMatch(h, /anmeldelser på Google/);
});

test('Stavanger: egen tittel, eget telefonnummer, lenke til Oslo i footeren', () => {
  const h = les('test/ut/stavanger/index.html');
  assert.match(h, /<title>Clean Unit – renhold i Stavanger<\/title>/);
  assert.match(h, /<body class="by--stavanger side--forside">/);
  assert.match(h, /href="tel:\+4790065009">Ring oss – 900 65 009/);
  assert.match(h, /class="kontakt__bylenke" href="\.\.\/">Gå til Clean Unit Oslo →/);
  assert.match(h, /<h1 class="visually-hidden">Renhold i Stavanger<\/h1>/);
  assert.doesNotMatch(h, /hero__tittel/);
  assert.match(h, /og:url" content="https:\/\/rickymoe\.github\.io\/CleanUnit\/stavanger\/"/);
  assert.doesNotMatch(h, /anmeldelser på Google/);
  assert.doesNotMatch(h, /Clean Unit har i dag over 100 ansatte, fordelt på kontoret i Nydalen/);
});

// Heroen er en scene (Marits illustrasjon, modernisert, 2026-10-03): varebil, by, sol og ballong i ett
// bilde. Den erstattet bybakgrunnen, solen og rutebåndet med varebilen og de fire kundetypene.
test('Hero: scene med rekkevidde-linje, uten de gamle rutebåndet, bybakgrunnen og solen', () => {
  for (const [f, linje] of [['test/ut/index.html', 'Vi rengjør i hele Oslo, Asker og Bærum\\.'], ['test/ut/stavanger/index.html', 'Vi rengjør i Stavanger og omegn\\.']]) {
    const h = les(f);
    assert.match(h, new RegExp(`<p class="hero__rekkevidde">${linje}</p>`), f);
    assert.match(h, /<div class="hero__scene">/, f);
    const scene = f.includes('stavanger') ? 'hero-stavanger' : 'hero-scene';
    assert.match(h, new RegExp(`bilder/${scene}\\.webp`), f);
    assert.match(h, new RegExp(`<img class="hero__scene-bilde" src="[^"]*bilder/${scene}\\.jpg" alt=""`), f);
    assert.match(h, /class="hero__sti-start"/, `${f}: stien trenger startpunktet sitt`);
    assert.match(h, /<picture class="hero__scene-vinter">[\s\S]*?bilder\/hero-(scene|stavanger)-vinter\.jpg/, `${f}: vinterscenen mangler`);
    assert.match(h, /classList\.add\("vinter"\)/, `${f}: sesongbyttet mangler i <head>`);
    assert.doesNotMatch(h, /hero__(rute|stopp|by|sol)/, `${f}: rester av den gamle heroen`);
  }
  for (const fil of ['hero-scene.webp', 'hero-scene.jpg', 'hero-scene-vinter.webp', 'hero-scene-vinter.jpg', 'hero-stavanger.webp', 'hero-stavanger.jpg', 'hero-stavanger-vinter.webp', 'hero-stavanger-vinter.jpg', 'logo-cleanunit-varebil.svg']) {
    assert.ok(existsSync(`test/ut/bilder/${fil}`), `bilder/${fil} mangler i bygget`);
  }
});

// Marit 2026-10-07: «Ingen strek på bilen – kun logo, gjerne litt lenger ned for luft over». Turkisbuen er malt ut av
// rasterbildene (hero-scene*, varebil-hero.svg, og Stavanger-scenene som tegnes av den), logoen står lavere (68 %).
// Selve bildeinnholdet kan ikke testes uten bildebibliotek, så testen låser det som kan måles: logoposisjonen, at
// varebil-hero.svg beholder størrelsen (hjullinja i CSS regner med 347×154,4 og rasteret 347×145) og at logoen i den
// fulgte med nedover (y 9,0 → 20,2 = +1,55 % av 724).
test('Varebil: logoen står lavere (68 %), og varebil-hero.svg beholder størrelse og logo-posisjon', () => {
  const css = les('css/style.css');
  assert.match(css, /\.hero__scene-merke \{ position: absolute; left: 19\.4%; top: 68%; width: 5\.5%;/, 'logoen på varebilen skal stå på top: 68 %');
  assert.doesNotMatch(css, /top: 66\.45%/, 'den gamle logoposisjonen (66,45 %) skal være borte');
  const svg = les('bilder/varebil-hero.svg');
  assert.match(svg, /viewBox="0 0 347 154\.4" width="347" height="154"/, 'varebil-hero.svg må beholde størrelsen (hjullinja i CSS)');
  assert.match(svg, /<image width="347" height="145" /, 'rasteret skal fortsatt være 347×145');
  assert.match(svg, /<svg x="41\.4" y="20\.2" width="119\.5" height="46\.6"/, 'logoen i varebil-hero.svg skal stå 11,2 enheter lavere (y 20,2)');
  const raster = Buffer.from(svg.match(/base64,([A-Za-z0-9+\/=]+)/)[1], 'base64');
  assert.equal(raster.toString('latin1', 0, 4), 'RIFF');
  assert.equal(raster.toString('latin1', 8, 12), 'WEBP');
  assert.equal(raster.toString('latin1', 12, 16), 'VP8X', 'rasteret skal ha alfa (VP8X)');
  assert.equal(raster.readUIntLE(24, 3) + 1, 347, 'rasterbredden');
  assert.equal(raster.readUIntLE(27, 3) + 1, 145, 'rasterhøyden');
});

// Glansen (Ricky 2026-09-30): den faste refleksen i vindusglasset er fjernet 2026-10-08 (blekte teksten), tørkesveipet er beholdt (Ricky likte animasjonen).
// Testene under holder begge deler.
test('Vindusvask-kortet har vindusrammen og tørkesveipet, men ingen fast refleks (::before fjernet 2026-10-08)', () => {
  const css = les('css/style.css');
  assert.match(css, /\.kort--vindu \{\s*box-shadow:\s*inset 0 0 0 2px var\(--teal\)/, 'vindusrammen skal bli stående');
  assert.doesNotMatch(css, /\.kort--vindu::before/, 'den faste refleksen skal ikke komme tilbake');
  assert.match(css, /\.kort--vindu::after \{/, 'tørkesveipet finnes');
  for (const el of ['img', 'h3', 'p', 'details']) {
    assert.match(css, new RegExp(`\\.kort--vindu > ${el}[,\\s{][\\s\\S]*?z-index: 1; \\}`), `${el} på vinduskortet løftes over sveipet så det ikke vaskes ut`);
  }
  assert.match(css, /--glans-sveip: \.95;/, 'sveipets styrke er definert');
});

test('Glans: sveipet går én gang, og bare når bevegelse er greit', () => {
  const js = les('js/main.js');
  assert.match(initKropp(js), /glansSveip\(reduksjon\)/, 'glansSveip kalles ikke fra initSider()');
  const kropp = js.slice(js.indexOf('function glansSveip'), js.indexOf('function glansSveip') + 900);
  assert.match(kropp, /if \(reduksjon \|\| !kort\) return/, 'sveipet gates ikke på redusert bevegelse');
  // Uten disconnect ville sveipet gått på nytt hver gang kortet kom inn i
  // bildet igjen — altså en løkke, som er nøyaktig det vi valgte bort.
  assert.match(kropp, /observer\.disconnect\(\)/, 'sveipet kobles ikke fra etter første gang');
  const css = les('css/style.css');
  // Klassen settes ved sidelast, men medie-queryen leses fortløpende: slår
  // brukeren på redusert bevegelse etter at siden er lastet, er det CSS-en og
  // ikke JS-en som må stoppe sveipet.
  assert.match(css, /prefers-reduced-motion: reduce\) \{\s*\.kort--vindu\.glans-sveip::after \{ animation: none; \}/,
    'CSS-en fanger ikke redusert bevegelse satt etter sidelast');
});

// Veinett-teppet (dekning-nett) lever bare i footeren, og det gamle navngitte Oslo-kartet med
// kontor-markører skal ikke komme tilbake i heroen.
test('Hero: scenen er bakgrunnen, uten veinett-teppe og navngitt bykart', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f);
    const start = h.indexOf('<header class="hero">');
    const hero = h.slice(start, h.indexOf('</header>', start));
    assert.match(hero, /<div class="hero__scene">/, f);
    assert.doesNotMatch(hero, /dekning-nett/, f);
    assert.doesNotMatch(h, /hero__kart-vannmerke/, f);
    assert.doesNotMatch(h, /hero-kart-vannmerke/, f);
    // Ingen gamle by-knapper igjen i heroen
    assert.doesNotMatch(h, /hero__knapp--(oslo|stavanger)/, f);
  }
});

test('byggAlle kopierer delte filer og lager Stavanger-siden', () => {
  assert.ok(existsSync('test/ut/css/style.css'));
  assert.ok(existsSync('test/ut/js/main.js'));
  assert.ok(existsSync('test/ut/bilder/dekning-nett.webp'));
  assert.ok(existsSync('test/ut/bilder/bil.png'));
  assert.ok(existsSync('test/ut/stavanger/index.html'));
});

test('Stavanger-siden peker til delte filer via ../', () => {
  const html = readFileSync('test/ut/stavanger/index.html', 'utf8');
  assert.match(html, /href="\.\.\/css\/style\.css"/);
  assert.match(html, /from '\.\.\/js\/main\.js'/);
  assert.doesNotMatch(html, /(src|srcset|href)="bilder\//);
});

// Flåten (2026-09-26): fire like biler på én vei under vekst-avsnittet.
// Bevisst uten tall — «nesten hundre ansatte» er ikke bekreftet av
// Marit/Christopher (siden sier 55 i dag), og et tall ville blitt feil.
test('Flåten i «Om oss»: fire like biler, uten tall og uten tekst', () => {
  for (const f of [sideFil('Oslo', 'om_oss'), sideFil('Stavanger', 'om_oss')]) {
    const h = les(f)
    assert.match(h, /<div class="flaate" aria-hidden="true">/, f)
    assert.equal((h.match(/class="flaate__bil"/g) || []).length, 4, `${f}: antall biler`);
    assert.match(h, /<div class="flaate__vei">/, f)
    const start = h.indexOf('<div class="flaate"')
    const blokk = h.slice(start, h.indexOf('</div>\n', h.indexOf('flaate__vei', start)))
    assert.doesNotMatch(blokk, /ansatte|hundre|biler/i, `${f}: flåten skal ikke påstå et antall`)
  }
})

// Flåten kjører inn (2026-09-26). Bilene ruller inn fra venstre, så de må
// ligge i et spor som klipper — ellers ruller de innover teksten ved siden av
// på smale skjermer. Veilinja skal ligge UTENFOR sporet, ellers blir den
// klippet av bilenes bevegelse i stedet for å tegnes ferdig først.
test('Flåten: bilene ligger i et klippende spor, veilinja utenfor', () => {
  for (const f of [sideFil('Oslo', 'om_oss'), sideFil('Stavanger', 'om_oss')]) {
    const h = les(f)
    const start = h.indexOf('<div class="flaate"')
    const blokk = h.slice(start, h.indexOf('</div>\n', h.indexOf('flaate__vei', start)))
    assert.match(blokk, /<div class="flaate__spor">/, f)
    assert.ok(blokk.indexOf('flaate__spor') < blokk.indexOf('flaate__bil'), `${f}: sporet åpnes før bilene`)
    assert.ok(
      blokk.indexOf('</div>', blokk.lastIndexOf('flaate__bil')) < blokk.indexOf('flaate__vei'),
      `${f}: sporet lukkes før veilinja`
    )
  }
})

// Hjul-mot-veilinje-geometrien står ett sted (--flaate-heng) og brukes fire
// steder. Endrer man én av dem uten de andre, står bilene og svever over
// veien igjen — det skjedde da padding ble prøvd direkte på .flaate.
test('Flåten: alle fire stedene bruker samme heng-mål', () => {
  const css = les('css/style.css')
  assert.match(css, /--flaate-heng: calc\(0\.027 \* var\(--flaate-b\)\)/)
  const regel = (sel) => {
    const s = css.indexOf(sel)
    return css.slice(s, css.indexOf('}', s))
  }
  assert.match(regel('.flaate__bil {'), /margin-bottom: calc\(-1 \* var\(--flaate-heng\)\)/)
  assert.match(regel('.flaate__spor {'), /padding-bottom: var\(--flaate-heng\)/)
  assert.match(regel('.flaate__vei {'), /bottom: var\(--flaate-heng\)/)
  assert.match(regel('.flaate {'), /margin-bottom: calc\(-1 \* var\(--flaate-heng\)\)/)
})

test('Flåten: skjules bare bak html.js, og vises igjen ved reduced motion', () => {
  const css = les('css/style.css')
  // Uten JS skal flåten stå ferdig parkert — ingen opacity: 0 i layout-regelen
  const layout = css.slice(css.indexOf('.flaate__bil {'), css.indexOf('}', css.indexOf('.flaate__bil {')))
  assert.doesNotMatch(layout, /opacity/)
  assert.match(css, /html\.js \.flaate__bil \{ opacity: 0; transform: translateX\(var\(--flaate-ut\)\); \}/)
  // Startstreken må være minst én plass bak egen plass (egen bredde + ett
  // mellomrom), ellers kjører bilene oppå hverandre mens de ruller inn
  assert.match(css, /--flaate-ut: calc\(-100% - var\(--flaate-gap\) - \.5rem\)/)
  assert.match(css, /html\.js \.flaate--inne \.flaate__bil \{/)
  assert.match(css, /html\.js \.flaate__bil \{ opacity: 1; transform: none; animation: none; \}/)
  assert.match(css, /html\.js \.flaate__vei \{ clip-path: none; transition: none; \}/)
  // På smal skjerm står bil 3 og 4 skjult, men de står fortsatt i køen: uten
  // omkartleggingen ventet de to synlige på at to usynlige biler kjørte inn
  // først (0,9 s dødtid). Regelen må ligge etter indeks-reglene, ellers vinner de.
  const indeksSiste = css.lastIndexOf('--flaate-i: 3')
  const omkart = css.indexOf('nth-child(2) { --flaate-i: 0; }')
  assert.ok(omkart > indeksSiste, 'omkartleggingen for smal skjerm må stå etter indeks-reglene')
  assert.match(css, /@media \(max-width: 48rem\) \{\s*html\.js \.flaate__bil:nth-child\(2\)/)
  assert.match(css, /--flaate-varighet: \.74s/)
  // og main.js må faktisk koble den på, ellers står bilene utenfor sporet
  assert.match(les('js/main.js'), /flaateInn\(reduksjon\)/)
})

test('tjenester/: Oslo har sju tjenestekort med «Les mer», Stavanger seks, begge med vindusrammen og vask-overskriften', () => {
  for (const [by, antall, navn] of [
    ['Oslo', 7, ['Fast daglig renhold', 'Renhold av barnehager', 'Hovedrengjøring', 'Teppe- og møbelrens', 'Gulvvedlikehold', 'Vindusvask', 'Hygieneartikler']],
    ['Stavanger', 6, ['Fast daglig renhold', 'Barnehagerenhold', 'Hovedrengjøring', 'Hygieneartikler', 'Gulvbehandling', 'Vinduspuss']],
  ]) {
    const h = les(sideFil(by, 'tjenester'));
    assert.equal((h.match(/class="tjeneste-kort[\s"]/g) || []).length, antall, `${by}: antall tjenestekort`);
    assert.equal((h.match(/<details class="tjeneste-mer">/g) || []).length, antall, `${by}: «Les mer» på hvert kort`);
    for (const t of navn) assert.match(h, new RegExp(`<h3>${t}</h3>`), `${by}: ${t}`);
    assert.match(h, /class="tjeneste-kort kort--vindu"/, `${by}: vindusrammen`);
    assert.ok(h.includes('<div class="vask-boks"><h2 data-vask>Renhold tilpasset deres arbeidssted</h2></div>'), `${by}: vask-overskriften`);
    assert.match(h, /<section class="stopp--tjenester" id="tjenester">/, by);
    assert.doesNotMatch(h.slice(h.indexOf('id="tjenester"'), h.indexOf('</section>', h.indexOf('id="tjenester"'))), /class="eyebrow"/, `${by}: eyebrowen er H1 nå`);
  }
});

test('referanser/: Oslo har seks sitatkort (BSN, Dr. Brandt, Kanvas, KG, Medistim, Stålverkskroken), Stavanger fire, uten NVH, på --base-hodet', () => {
  for (const [by, antall, navn] of [
    ['Oslo', 6, ['BSN – Boligstiftelsen Nydalen', 'Mariann<br>Dr. Brandt', 'Roy Kristensen Bakland<br>Utforskeren Kanvas-Barnehage', 'Kristelig Gymnasium', 'Medistim', 'Stålverkskroken barnehage']],
    ['Stavanger', 4, ['Roy Kristensen Bakland<br>Utforskeren Kanvas-Barnehage', 'Kristelig Gymnasium', 'Medistim', 'Stålverkskroken barnehage']],
  ]) {
    const h = les(sideFil(by, 'referanser'));
    assert.equal((h.match(/class="sitat-kort"/g) || []).length, antall, `${by}: antall sitatkort`);
    for (const t of navn) assert.ok(h.includes(t), `${by}: mangler «${t}»`);
    assert.ok(!/NVH|logo-nvh|Cecilie|Beck-Hansen/.test(h), `${by}: NVH og Cecilie skal være borte`);
    assert.match(h, /<div class="side-hode side-hode--ned-base">/, `${by}: hodet toner ned til --base`);
    assert.ok(h.includes('<div class="vask-boks"><h2 data-vask>Dette sier kundene våre</h2></div>'), by);
  }
  assert.ok(les(sideFil('Oslo', 'referanser')).includes('over 100 kunder i Oslo og omegn'), 'Oslo: ledeteksten');
  assert.ok(!les(sideFil('Oslo', 'referanser')).includes('rundt 100 kunder'), 'Oslo: det gamle tallet er borte');
  assert.ok(!les(sideFil('Stavanger', 'referanser')).includes('Boligstiftelsen Nydalen'), 'Stavanger: ingen Oslo-sitater');
});
test('Overskriften er Maritts «Renhold tilpasset deres arbeidssted» og den gamle teksten er borte overalt', () => {
  for (const by of ['Oslo', 'Stavanger']) {
    for (const side of ['forside', 'tjenester']) {
      const h = les(sideFil(by, side));
      assert.ok(h.includes('<h2 data-vask>Renhold tilpasset deres arbeidssted</h2>'), `${by}/${side}: ny overskrift`);
      assert.ok(!h.includes('stedet du driver'), `${by}/${side}: gammel overskrift`);
    }
  }
});
test('referanser/: Stålverkskroken-kortet har egen logo (png + webp finnes) i Oslo og Stavanger', () => {
  for (const by of ['Oslo', 'Stavanger']) {
    const fil = sideFil(by, 'referanser');
    const h = les(fil);
    const kort = h.split('<li class="sitat-kort">').find((k) => k.includes('Stålverkskroken barnehage'));
    assert.ok(kort, `${by}: Stålverkskroken-kortet`);
    const m = kort.match(/<img [^>]*class="sitat-logo" src="((?:\.\.\/)*bilder\/logo-staalverkskroken\.png)" alt="" width="640" height="193">/);
    assert.ok(m, `${by}: sitat-logo-bildet i kortet`);
    assert.match(kort, /<source srcset="(?:\.\.\/)*bilder\/logo-staalverkskroken\.webp" type="image\/webp">/, `${by}: webp-kilde`);
    const absolutt = join(dirname(fil), m[1]);
    assert.ok(existsSync(absolutt), `${by}: ${m[1]} finnes ikke`);
    assert.ok(existsSync(absolutt.replace(/\.png$/, '.webp')), `${by}: webp finnes ikke`);
  }
});
test('CSS: referanser-siden har --base-bakgrunn (aldri himmel rett under himmel-hodet)', () => {
  assert.match(les('css/style.css'), /\.side--referanser \.stopp--referanser \{ background: var\(--base\); \}/);
});
test('om-oss/: «Om oss», flåten og «Jobb hos oss» (åpen søknad, ansattsitater) står på samme side', () => {
  for (const [by, sitater] of [['Oslo', 4], ['Stavanger', 4]]) {
    const h = les(sideFil(by, 'om_oss'));
    assert.match(h, /<section class="stopp--om" id="om-oss">/, by);
    assert.match(h, /<section class="stopp--jobb" id="jobb-hos-oss">/, by);
    assert.ok(h.indexOf('id="om-oss"') < h.indexOf('id="jobb-hos-oss"'), `${by}: rekkefølgen`);
    const jobb = h.slice(h.indexOf('id="jobb-hos-oss"'));
    assert.equal((jobb.match(/class="sitat-kort"/g) || []).length, sitater, `${by}: ansattsitater`);
    assert.match(jobb, /For å søke jobb: <a href="mailto:jobb@cleanunit\.no">jobb@cleanunit\.no<\/a>/, `${by}: jobbsøkere`);
    assert.match(h, /<div class="flaate" aria-hidden="true">/, `${by}: flåten`);
    assert.match(h, /<p class="eyebrow">Jobb hos oss<\/p>/, `${by}: «Jobb hos oss» beholder eyebrow`);
    assert.doesNotMatch(h.slice(h.indexOf('id="om-oss"'), h.indexOf('id="jobb-hos-oss"')), /class="eyebrow"/, `${by}: «Om oss»-eyebrowen er H1 nå`);
  }
  assert.ok(les(sideFil('Oslo', 'om_oss')).includes('Marit Byfuglien'));
  assert.ok(les(sideFil('Stavanger', 'om_oss')).includes('To kontorer, samme standard'));
});
test('miljo/: fire detaljkort på hvit flate (aldri himmel under himmel-hodet), id=miljo', () => {
  for (const by of ['Oslo', 'Stavanger']) {
    const h = les(sideFil(by, 'miljo'));
    assert.match(h, /<section class="stopp--tillit" id="miljo">/, by);
    assert.equal((h.match(/<article class="miljo-kort">/g) || []).length, 4, `${by}: antall miljø-kort`);
    for (const t of ['Miljøfyrtårn siden 2011', 'Medlem av Virke og med tariffavtale', 'Offentlig godkjent renholdsbedrift', 'Hvorfor vi velger bort underleverandører']) {
      assert.ok(h.includes(`<h3>${t}</h3>`), `${by}: ${t}`);
    }
    assert.ok(h.includes('<div class="vask-boks"><h2 data-vask>Godkjent, ansvarlig og til stede</h2></div>'), by);
    assert.doesNotMatch(h.slice(h.indexOf('id="miljo"'), h.indexOf('</section>', h.indexOf('id="miljo"'))), /class="eyebrow"/, `${by}: eyebrowen er H1 nå`);
  }
});
test('CSS: miljø-siden er hvit, og scroll-margin-listen kjenner #miljo', () => {
  const css = les('css/style.css');
  assert.match(css, /\.side--miljo \.stopp--tillit \{ background: var\(--flate\); \}/);
  assert.match(css, /#miljo\b[^{]*\{ scroll-margin-top: 3\.75rem; \}/);
});

// Vaskesveipet (Ricky 2026-10-05): hver overskrift ligger i .vask-boks, ellers måler observeren mot en
// klippet h2 og sveipet kjører aldri. Per side: overskriftene som skal ha data-vask. Kontakt-h2 står
// på alle sider (delt partial) og legges til under.
const KONTAKT_H2 = { Oslo: 'Trenger dere en ny renholdsleverandør?', Stavanger: 'Hva koster renhold for dere?' };
const VASK = {
  Oslo: {
    forside: ['Renhold tilpasset deres arbeidssted'], tjenester: ['Renhold tilpasset deres arbeidssted'],
    referanser: ['Dette sier kundene våre'],
    om_oss: ['Fra to personer med hver sin mopp', 'Renholderne er våre viktigste medarbeidere'],
    miljo: ['Godkjent, ansvarlig og til stede'],
  },
  Stavanger: {
    forside: ['Renhold tilpasset deres arbeidssted'], tjenester: ['Renhold tilpasset deres arbeidssted'],
    referanser: ['Dette sier kundene våre'],
    om_oss: ['To kontorer, samme standard', 'Renholderne er våre viktigste medarbeidere'],
    miljo: ['Godkjent, ansvarlig og til stede'],
  },
};test('Vaskesveipet: riktige overskrifter per side, hver i .vask-boks', () => {
  for (const s of alleSider()) {
    const h = les(s.fil);
    const forventet = [...VASK[s.by][s.id], KONTAKT_H2[s.by]];
    assert.equal((h.match(/<h2 data-vask/g) || []).length, forventet.length, `${s.fil}: antall h2 med data-vask`);
    for (const tekst of forventet) {
      assert.ok(h.includes(`<div class="vask-boks"><h2 data-vask>${tekst}</h2></div>`), `${s.fil}: «${tekst}» mangler sveip i .vask-boks`);
    }
  }
});

// Stien anker til eyebrow-en i hver seksjon (js/main.js). Endres id-ene eller
// eyebrow-klassen, forsvinner nodene i stillhet — derfor denne testen.
test('Forsiden: tre tjenestekort uten «Les mer», én «Se alle tjenester →» under kortene, og ingen sitater', () => {
  for (const [by, navn] of [
    ['Oslo', ['Fast daglig renhold', 'Barnehagerenhold', 'Temporært renhold og hygieneartikler']],
    ['Stavanger', ['Fast daglig renhold', 'Barnehagerenhold', 'Temporært renhold og hygieneartikler']],
  ]) {
    const h = les(sideFil(by, 'forside'));
    const sek = h.slice(h.indexOf('id="tjenester"'), h.indexOf('</section>', h.indexOf('id="tjenester"')));
    assert.equal((sek.match(/class="tjeneste-kort[\s"]/g) || []).length, 3, `${by}: tre kort`);
    assert.doesNotMatch(h, /<details/, `${by}: forsiden har ingen «Les mer»`);
    // Ricky 2026-10-06: ÉN lenke UNDER de tre kortene, ikke én lenke på hvert kort.
    const lenker = sek.match(/<a class="tekst-lenke" href="tjenester\/">Se alle tjenester →<\/a>/g) || [];
    assert.equal(lenker.length, 1, `${by}: nøyaktig én «Se alle tjenester →»`);
    const kortSlutt = sek.lastIndexOf('</ul>');
    const lenke = sek.indexOf('Se alle tjenester →');
    assert.ok(lenke > kortSlutt, `${by}: lenken står etter kortene`);
    assert.ok(lenke < sek.indexOf('</div>', kortSlutt), `${by}: lenken står inne i .wrap`);
    assert.equal((sek.slice(0, kortSlutt).match(/class="tekst-lenke"/g) || []).length, 0, `${by}: ingen lenke inne i kortene`);
    navn.forEach((t, i) => assert.ok(sek.indexOf(`<h3>${t}</h3>`) > (i ? sek.indexOf(`<h3>${navn[i - 1]}</h3>`) : -1), `${by}: ${t} i rekkefølge`));
    assert.doesNotMatch(h, /class="sitat-kort"|<blockquote/, `${by}: forsiden viser ikke sitater`);
    assert.ok(h.includes('<div class="vask-boks"><h2 data-vask>Renhold tilpasset deres arbeidssted</h2></div>'), by);
  }
});

test('Forsiden: kunderaden lenker til referanser/ (Oslo 6 logoer, Stavanger 4), i riktig rekkefølge', () => {
  for (const [by, logoer] of [
    ['Oslo', ['logo-bsn', 'logo-kg', 'logo-kanvas', 'logo-medistim', 'logo-pioner', 'logo-staalverkskroken']],
    ['Stavanger', ['logo-kanvas', 'logo-kg', 'logo-medistim', 'logo-staalverkskroken']],
  ]) {
    const h = les(sideFil(by, 'forside'));
    const start = h.indexOf('<section class="stopp--kunder" id="kunder">');
    assert.ok(start > -1, `${by}: #kunder`);
    const sek = h.slice(start, h.indexOf('</section>', start));
    assert.match(sek, /<a class="kunde-rad" href="referanser\/" tabindex="-1" aria-hidden="true">/, `${by}: raden er lenke`);
    assert.match(sek, /<a class="tekst-lenke" href="referanser\/">Se hva kundene sier →<\/a>/, `${by}: synlig tekstlenke`);
    // Rot-prefikset er valgfritt: Stavanger-forsiden ligger i /stavanger/, så logoene der
    // står som ../bilder/… Vi fanger hele src-en og løser den fra SIDENS mappe, så testen
    // fanger feil rot-dybde (en ../ for mye eller for lite) og ikke bare logonavnet.
    const stier = [...sek.matchAll(/<img [^>]*src="((?:\.\.\/)?bilder\/(logo-[a-z]+)\.png)"/g)].map((m) => ({ sti: m[1], navn: m[2] }));
    const funnet = stier.map((x) => x.navn);
    assert.deepEqual(funnet, logoer, `${by}: logoene`);
    assert.match(sek, /<p class="eyebrow">Referanser<\/p>/, `${by}: eyebrow (stien ankrer til den)`);
    assert.equal((sek.match(/loading="lazy"/g) || []).length, logoer.length, `${by}: alle logoer lazy`);
    const navnTekst = [...sek.matchAll(/<span class="kunde-rad__navn">([^<]+)<\/span>/g)].map((m) => m[1]);
    assert.deepEqual(navnTekst, [], `${by}: alle logoer finnes, så ingen kunde skal være tekstnavn ennå`);
    assert.equal(funnet.length + navnTekst.length, logoer.length, `${by}: hver kunde står i raden som logo eller som navn`);
    const mappe = dirname(sideFil(by, 'forside'));
    for (const { sti } of stier) {
      const absolutt = join(mappe, sti);
      assert.ok(existsSync(absolutt), `${by}: ${sti} finnes ikke fra ${mappe}`);
      assert.ok(existsSync(absolutt.replace(/\.png$/, '.webp')), `${by}: ${sti} mangler .webp`);
    }
  }
});

test('Forsiden: rekkefølge derfor → tjenester → kunder → kontakt, og kunderaden har hvitt kort på --base', () => {
  for (const by of ['Oslo', 'Stavanger']) {
    const h = les(sideFil(by, 'forside'));
    const pos = ['id="derfor"', 'id="tjenester"', 'id="kunder"', 'id="kontakt"'].map((x) => h.indexOf(x));
    assert.ok(pos.every((p, i) => p > -1 && (i === 0 || p > pos[i - 1])), `${by}: rekkefølgen ${pos}`);
  }
  const css = les('css/style.css');
  assert.match(css, /\.stopp--kunder \{ padding-block: var\(--seksjon-y\); background: var\(--base\); \}/);
  assert.match(css, /\.kunde-rad \{[^}]*background: var\(--flate\)/, 'logoene har hvit bakgrunn i filene: raden må ha hvitt kort');
  assert.match(css, /\.kunde-rad img \{[^}]*object-fit: contain/);
  assert.match(css, /\.tekst-lenke \{[^}]*min-height: 2\.75rem/, '44 px trykkflate');
});

test('Stien: nodene speiler forsidens seksjoner, hver finnes med anker, og bare forsiden har stien', () => {
  const js = les('js/main.js');
  const liste = js.slice(js.indexOf('const STI_SEKSJONER'), js.indexOf('function stiNedover'));
  const ider = [...liste.matchAll(/sel: '#([a-z-]+)'/g)].map((m) => m[1]);
  assert.deepEqual(ider, ['derfor', 'tjenester', 'kunder', 'kontakt'], 'sti-nodene');
  for (const by of ['Oslo', 'Stavanger']) {
    const h = les(sideFil(by, 'forside'));
    for (const [id, anker] of [['derfor', 'derfor-kort'], ['tjenester', 'eyebrow'], ['kunder', 'eyebrow'], ['kontakt', 'eyebrow']]) {
      const start = h.indexOf(`id="${id}"`);
      assert.ok(start > -1, `${by}: mangler #${id}`);
      assert.match(h.slice(start, h.indexOf('</section>', start)), new RegExp(`class="${anker}"`), `${by}: #${id} mangler .${anker} (stien ankrer til den)`);
    }
    assert.match(h, /class="hero__sti-start"/, `${by}: stien trenger startpunktet sitt`);
  }
  for (const s of alleSider().filter((x) => x.id !== 'forside')) {
    assert.doesNotMatch(les(s.fil), /hero__sti-start/, `${s.fil}: undersider har ingen sti`);
  }
  assert.match(js, /document\.querySelector\('\.hero__sti-start'\)/, 'stiNedover finner ikke startpunktet');
});
const MARIT_DERFOR = 'Clean Unit har levert profesjonelt renhold siden 2007, og vi leverer i dag renhold til over 100 kunder i Oslo og omegn. Vi tilbyr faste renholdere, rask kommunikasjon og systematisk kvalitetsoppfølging. Vi benytter ikke underleverandører i det daglige renholdet.';
const derforSeksjon = (by) => {
  const h = les(sideFil(by, 'forside'));
  const start = h.indexOf('id="derfor"');
  return h.slice(start, h.indexOf('</section>', start));
};

const derforKort = (d) => [...d.matchAll(/<div class="derfor-kort">([\s\S]*?)<\/div>/g)].map((m) => m[1]);
const sjekkKort = (kort, ikon, overskrift, f) => {
  const m = kort.match(/^<img class="derfor-kort__ikon" src="((?:\.\.\/)*bilder\/(ikon-[a-z-]+\.svg))" alt="" width="60" height="60" loading="lazy" decoding="async"><h3>([^<]*)<\/h3><p>([^<]*)<\/p>$/);
  assert.ok(m, `${f}: kortet har ikke formen symbol + h3 + ett avsnitt`);
  assert.equal(m[2], ikon, f);
  assert.equal(m[3], overskrift, f);
  assert.ok(existsSync(`bilder/${ikon}`), `${f}: bilder/${ikon} finnes ikke`);
  assert.match(les(`bilder/${ikon}`), /fill="#75355D"/, `${f}: symbolet er ikke burgunder (Ricky 2026-10-08)`);
  return m[4];
};

test('Derfor (Oslo): to kort med burgunder symbol + h3 + ett avsnitt, avsnittene er Marits eksakte tekst', () => {
  const d = derforSeksjon('Oslo');
  const kort = derforKort(d);
  assert.equal((d.match(/class="derfor-kort"/g) || []).length, 2);
  assert.equal(kort.length, 2);
  assert.equal((d.match(/<p>/g) || []).length, 2);
  assert.equal((d.match(/<h3>/g) || []).length, 2);
  const tekster = [sjekkKort(kort[0], 'ikon-erfaring.svg', 'Erfaring', 'Oslo 1'), sjekkKort(kort[1], 'ikon-dette-far-du.svg', 'Dette får du', 'Oslo 2')];
  assert.equal(tekster.join(' '), MARIT_DERFOR, 'Marits tekst står ikke ordrett');
  assert.doesNotMatch(d, /75355D|burgunder/i);
  assert.doesNotMatch(d, /<li|derfor-liste/);
  for (const g of ['Fast renholder', 'Rask kommunikasjon', 'Tett oppfølging']) assert.ok(!d.includes(`>${g}<`), g);
});

test('Derfor (Stavanger): ett kort med burgunder skjold-symbol + «Dette får du» + teksten, uten Oslo-påstander, UTKAST står i kilden', () => {
  const d = derforSeksjon('Stavanger');
  const kort = derforKort(d);
  assert.equal((d.match(/class="derfor-kort"/g) || []).length, 1);
  assert.equal(kort.length, 1);
  assert.equal((d.match(/<p>/g) || []).length, 1);
  assert.match(d, /derfor-rad--en/);
  const tekst = sjekkKort(kort[0], 'ikon-dette-far-du.svg', 'Dette får du', 'Stavanger');
  assert.equal(tekst, 'Vi tilbyr faste renholdere, rask kommunikasjon og systematisk kvalitetsoppfølging. Vi benytter ikke underleverandører i det daglige renholdet.');
  assert.doesNotMatch(d, /siden 2007|Oslo og omegn|rundt 100|over 100 kunder|Erfaring|75355D|burgunder/i);
  assert.ok(les('sider/forside.html').includes('<!-- UTKAST: Stavangers egen tekst venter på Marit (år, antall kunder, område) -->'));
});

test('CSS: Derfor-kortenes overskrift er --teal-mork og CSS-en har ingen burgunder i kortreglene', () => {
  const css = les('css/style.css');
  assert.match(css, /\.derfor-kort h3 \{ color: var\(--teal-mork\); \}/);
  const kort = css.match(/\n\.derfor-kort \{[^}]*\}/)[0];
  assert.match(kort, /background: #fff;/, 'hvit bakgrunn');
  assert.doesNotMatch(kort, /border:/, 'kortene har ingen ramme (rammen gjelder heroknappene)');
  assert.match(css, /\.derfor-kort p \{ color: var\(--tekst\);/, 'vanlig brødtekstfarge');
  const regler = css.split('\n').filter((l) => /^\.derfor-/.test(l)).join('\n');
  assert.doesNotMatch(regler, /75355D|burgunder/i);
});

test('CSS: scroll-margin-listen følger forsidens og undersidenes ids', () => {
  assert.match(les('css/style.css'), /#derfor, #tjenester, #kunder, #miljo, #jobb-hos-oss, #kontakt \{ scroll-margin-top: 3\.75rem; \}/);
});
test('Footer-vannmerket er samme veinett-teppe som heroen', () => {
  const css = les('css/style.css')
  // Let etter REGELEN, ikke første gang selectoren nevnes: en kommentar et helt
  // annet sted i fila kan godt omtale .side-footer::before, og da leste denne
  // testen kommentaren i stedet for regelen.
  const regel = /\n\.side-footer::before\s*\{/
  const start = css.search(regel)
  assert.ok(start > -1, 'finner ikke .side-footer::before-regelen i css/style.css')
  const blokk = css.slice(start, css.indexOf('}', start))
  assert.match(blokk, /dekning-nett\.webp/)
  assert.match(blokk, /mix-blend-mode: screen/)
  // Oslo-kartet skal ikke lenger brukes noe sted i CSS-en
  assert.doesNotMatch(css, /hero-kart-vannmerke/)
})

// Kontakt (tilbudsskjemaet er fjernet på kundens ønske: e-post og telefon i stedet).
// Kontakt-e-posten og jobb-e-posten står ÉN gang, i byer.json (felles); alt annet leser dem derfra.
const KONTAKT_EPOST = 'post@cleanunit.no';

test('Skjemaet er borte: ingen form, Formspree, skjemastil eller skjema-JS noe sted', () => {
  for (const f of ['deler/layout.html', 'deler/kontakt.html', 'sider/forside.html', 'sider/om-oss.html', 'byer.json',
    'test/ut/index.html', 'test/ut/stavanger/index.html', 'test/ut/om-oss/index.html', 'test/ut/stavanger/om-oss/index.html']) {
    assert.doesNotMatch(les(f), /<form|formspree|FORMSPREE|tilbud-skjema|tilbud-varsel|skjema-/i, `${f}: rester av skjemaet`);
  }
  const css = les('css/style.css'), js = les('js/main.js'), y = les('.github/workflows/deploy.yml');
  assert.doesNotMatch(css, /tilbud-skjema|skjema-(felt|rad|varsel|feil|kvittering|notat|valgfri)/, 'skjemastil i CSS');
  assert.doesNotMatch(js, /tilbudSkjema|formspree|FORMSPREE/i, 'skjema-JS');
  assert.doesNotMatch(y, /formspree|FORMSPREE/i, 'Formspree i deploy.yml');
  assert.doesNotMatch(y, /secrets\./, 'deploy.yml trenger ikke lenger secrets');
});

test('deploy.yml: strippingen treffer alle ti sider', () => {
  const y = les('.github/workflows/deploy.yml');
  assert.match(y, /find dist -name '\*\.html'/, 'stripping går over alle html-filer');
  assert.match(y, /-eq 10/, 'totalt antall sider kontrolleres');
});

test('Kontakt-blokken har én kilde: delt partial, ikke inline i noen side', () => {
  const kontakt = les('deler/kontakt.html');
  assert.equal((kontakt.match(/<section class="stopp--kontakt" id="kontakt">/g) || []).length, 1);
  assert.match(les('deler/layout.html'), /\{\{> side\}\}\n\{\{> kontakt\}\}\n<\/main>/, 'layouten setter inn kontakt etter siden');
  for (const f of ['sider/forside.html']) {
    assert.doesNotMatch(les(f), /id="kontakt"/, `${f}: kontakt skal ikke ligge inline`);
  }
});

test('Kontakt: bylenken peker til den andre byens forside fra enhver side', () => {
  assert.doesNotMatch(les('byer.json'), /bylenke/, 'de gamle bylenke-nøklene skal være borte');
  assert.match(les('deler/kontakt.html'), /class="kontakt__bylenke" href="\{\{andre_by_hjem\}\}">Gå til Clean Unit \{\{andre_by_navn\}\} →/);
});

test('Kontakt: e-post og telefon samlet ett sted (byer.json), uten hardkodede kopier i malene', () => {
  const { felles, byer } = JSON.parse(les('byer.json'));
  assert.equal(felles.kontakt_epost, KONTAKT_EPOST);
  assert.equal(felles.jobb_epost, 'jobb@cleanunit.no');
  for (const f of ['sider/forside.html', 'sider/om-oss.html', 'deler/kontakt.html']) {
    assert.doesNotMatch(les(f), /post@cleanunit|jobb@cleanunit/, `${f}: adressen skal komme fra {{kontakt_epost}}/{{jobb_epost}}`);
  }
  assert.equal(byer[0].data.telefon_visning, '21 55 56 80');
  assert.match(felles._merknad, /Bekreftet av Ricky 2026-10-07/);
  assert.doesNotMatch(felles._merknad, /IKKE BEKREFTET/);
});

test('Kontakt: Kontakt er menyvalg i headeren; hero har to knapper (telefon og e-post) på alle forsider', () => {
  for (const s of alleSider()) {
    const h = les(s.fil);
    assert.match(h, /class="side-nav__lenke" href="#kontakt">Kontakt</, `${s.fil}: menyvalget Kontakt peker på #kontakt`);
    assert.match(h, /<a class="side-nav__lenke" href="#kontakt">/, s.fil);
    if (s.id !== 'forside') continue;
    const i = h.indexOf('<div class="hero__knapper">');
    const knapper = h.slice(i, h.indexOf('</div>', i));
    assert.ok(!knapper.includes('Kontakt oss på'), `${s.fil}: den gamle tekstlinja skal være borte fra heroen`);
    assert.doesNotMatch(h, /hero__kontakt/, `${s.fil}: hero__kontakt er fjernet`);
    const lenker = knapper.match(/<a [^>]*>/g) || [];
    assert.equal(lenker.length, 2, `${s.fil}: heroen skal ha nøyaktig to handlinger`);
    assert.equal((knapper.match(/class="knapp/g) || []).length, 2, `${s.fil}: to knapper`);
    assert.match(lenker[0], /class="knapp knapp--omriss" href="tel:\+47\d+"/, `${s.fil}: telefonknappen først`);
    assert.match(knapper, new RegExp(`href="tel:\\+47\\d+">Ring oss – ${s.by === 'Oslo' ? '21 55 56 80' : '900 65 009'}`), `${s.fil}: «Ring oss» med byens telefon`);
    assert.equal(lenker[1], `<a class="knapp knapp--omriss" href="mailto:${KONTAKT_EPOST}">`, `${s.fil}: e-postknappen er omriss-knapp`);
    assert.match(knapper, />Send e-post<\/a>/, `${s.fil}: e-postknappen heter bare «Send e-post» (Ricky 2026-10-07), uten adressen`);
    assert.equal(KONTAKT_EPOST, 'post@cleanunit.no');
    const kontakt = h.slice(h.indexOf('id="kontakt"'));
    assert.ok(kontakt.includes(`mailto:${KONTAKT_EPOST}`), `${s.fil}: e-posten står også i Kontakt-seksjonen`);
  }
});

test('Kontakt: seksjonen fortsetter bakgrunnsvekslingen, uten skjema', () => {
  const css = les('css/style.css');
  assert.match(css, /\n\.stopp--kontakt \{ padding-block: var\(--seksjon-y\); background: var\(--teal-lys\); \}/);
  assert.match(css, /\.kontakt__knapper \{/, 'knapperaden på kontaktkortet mangler');
  assert.doesNotMatch(css, /kontakt__direkte/, 'gammel toppboks-CSS');
  // hidden-attributtet må faktisk skjule.
  assert.match(css, /\[hidden\] \{ display: none; \}/);
});

test('Stavanger: samme grønne palett som Oslo, eget bybilde og dempede symboler, Oslo uendret', () => {
  const css = les('css/style.css');
  assert.doesNotMatch(css, /\.by--stavanger[^{]*\{[^}]*--teal/, 'Stavanger skal ikke overstyre fargetokenene');
  assert.doesNotMatch(css, /\.by--stavanger[^{]*\{[^}]*(5A2848|F5EBF1|--burgunder)/, 'ingen burgunder tema for Stavanger');
  assert.match(css, /\.by--stavanger \.tjeneste-kort__ikon \{/);
  assert.doesNotMatch(css, /\.by--oslo \{[^}]*--teal:/);
  assert.match(les('test/ut/stavanger/index.html'), /name="theme-color" content="#00595B"/);
  assert.match(les('test/ut/index.html'), /name="theme-color" content="#00595B"/);
  assert.doesNotMatch(les('test/ut/stavanger/index.html'), /hero-scene/, 'Stavanger skal ikke bruke Oslo-scenen');
  assert.doesNotMatch(les('test/ut/index.html'), /hero-stavanger/, 'Oslo skal ikke bruke Stavanger-scenen');
});

// side_h1 er navnet byer.json og undersidemalene bruker. Den gamle nøkkelklassen [a-z_] slapp
// den gjennom urørt — {{side_h1}} havnet ordrett i den bygde HTML-en uten at noe feilet.
test('fyllMal: nøkler med siffer fylles, og ukjente nøkler kaster fortsatt', () => {
  assert.equal(fyllMal('<h1>{{side_h1}}</h1>', { side_h1: 'Tjenester' }), '<h1>Tjenester</h1>');
  assert.throws(() => fyllMal('{{side_h2}}', { side_h1: 'Tjenester' }), /Mangler verdi for \{\{side_h2\}\}/);
  assert.equal(fyllMal('a{{#oslo1}}X{{by}}{{/oslo1}}b', { oslo1: '1', by: 'Oslo' }), 'aXOslob');
  assert.throws(() => fyllMal('{{#oslo1}}X{{/oslo1}}', {}), /Mangler verdi for \{\{#oslo1\}\}/);
});

test('fyllMal: betingede blokker tas med bare når nøkkelen har verdi', () => {
  assert.equal(fyllMal('a{{#oslo}}X{{by}}{{/oslo}}b', { oslo: '1', by: 'Oslo' }), 'aXOslob');
  assert.equal(fyllMal('a{{#oslo}}X{{by}}{{/oslo}}b', { oslo: '', by: 'Oslo' }), 'ab');
  assert.throws(() => fyllMal('{{#oslo}}X{{/oslo}}', {}), /Mangler verdi for \{\{#oslo\}\}/);
});

test('Maritts innhold (Oppsett ny nettside) står på Oslo-siden: sju tjenester, referanser, team, miljøblokker og kontaktpersoner', () => {
  const h = heleBy('Oslo');
  for (const t of ['Fast daglig renhold', 'Renhold av barnehager', 'Hovedrengjøring', 'Teppe- og møbelrens',
    'Gulvvedlikehold', 'Vindusvask', 'Hygieneartikler']) {
    assert.match(h, new RegExp(`<h3>${t}</h3>`), `tjeneste: ${t}`);
  }
  for (const t of ['BSN – Boligstiftelsen Nydalen', 'Dr. Brandt', 'Marit Byfuglien', 'Mari Pedersen',
    'Guro Klingenberg Schei', 'Miljøfyrtårn siden 2011',
    'Medlem av Virke og med tariffavtale', 'Offentlig godkjent renholdsbedrift', 'Hvorfor vi velger bort underleverandører',
    'Trenger dere en ny renholdsleverandør?']) {
    assert.ok(h.includes(t), `mangler «${t}»`);
  }
  for (const [tlf] of [['+4797195993'], ['+4747298445']]) assert.ok(h.includes(`href="tel:${tlf}"`), tlf);
  assert.ok(h.includes('For å søke jobb: <a href="mailto:jobb@cleanunit.no">'), 'jobbsøkere sendes til jobb@');
  assert.match(h, /<div class="om-foto-rad" hidden>/, 'fotoplassholderen skal fortsatt være skjult');
});

test('Stavanger-siden får ikke Oslo-kontorets tekster, men beholder sine egne', () => {
  const h = heleBy('Stavanger');
  for (const t of ['Marit Byfuglien', 'Guro Klingenberg', 'tjeneste-grid--sju', 'Boligstiftelsen Nydalen']) {
    assert.ok(!h.includes(t), `Oslo-teksten «${t}» lekker inn i Stavanger-siden`);
  }
  assert.ok(h.includes('Hva koster renhold for dere?'));
  assert.ok(h.includes('To kontorer, samme standard'));
});

// Task 10: sikkerhetsnettet mot at en senere endring gjør Stavanger til en kopi av Oslo.
// Testene måler SYNLIG innhold: kommentaren i tilbudsskjema-blokken nevner begge kontorenes
// e-postadresser med vilje (den dokumenterer hvorfor byene har hvert sitt Formspree-skjema, og
// Actions stripper kommentarer før publisering). Ricky 2026-10-06: kommentaren skal stå urørt,
// så kommentarer fjernes før letingen i stedet for å svekke kilden.
const synlig = (h) => h.replace(/<!--[\s\S]*?-->/g, '');

test('Stavanger: ingen Oslo-tekster på noen av de fem sidene, men egne tekster og eget kontor', () => {
  const h = synlig(heleBy('Stavanger'));
  for (const t of ['Marit Byfuglien', 'Mari Pedersen', 'Guro Klingenberg', 'Boligstiftelsen Nydalen', 'Dr. Brandt', 'logo-pioner', 'logo-bsn',
    'rundt 100 kunder', 'over 100 kunder i Oslo', 'over 70 barnehager', 'Flere av våre ansatte har jobbet i Clean Unit i over ti år', 'Fra to personer med hver sin mopp', 'Trenger dere en ny renholdsleverandør?', '21 55 56 80', 'renhold@cleanunit.no']) {
    assert.ok(!h.includes(t), `Oslo-teksten «${t}» lekker inn i Stavanger`);
  }
  for (const t of ['To kontorer, samme standard', 'Hva koster renhold for dere?', 'thord@cleanunit.no', '900 65 009', 'Thord Hegre']) {
    assert.ok(h.includes(t), `Stavanger mangler «${t}»`);
  }
  for (const s of alleSider().filter((x) => x.by === 'Stavanger')) {
    assert.match(les(s.fil), /<body class="by--stavanger side--/, s.fil);
    assert.match(les(s.fil), /class="kontakt__bylenke" href="\.\.\/(\.\.\/)?">Gå til Clean Unit Oslo →/, `${s.fil}: bylenken til Oslo (forsiden)`);
  }
});

// Kunden vil ha én kontaktadresse: kortet har post@ og telefonen som to knapper øverst og telefonen kun der, ingen egen
// kanal-linje (telefon · e-post) under adressen. Mobilnumrene i personradene er greit.
const PERSON_EPOST = { Oslo: ['renhold@cleanunit.no', 'post@cleanunit.no'], Stavanger: ['thord@cleanunit.no'] };
const kontaktKort = (f) => les(f).match(/<section class="stopp--kontakt"[\s\S]*?<\/section>/)[0];
test('Kontakt-kortet: e-post kun post@ i knappen og personenes egne adresser under telefonen, ingen andre', () => {
  for (const s of alleSider()) {
    const k = kontaktKort(s.fil);
    assert.doesNotMatch(k, /kontakt__kanal/, `${s.fil}: egen telefon · e-post-linje`);
    const forventet = [...PERSON_EPOST[s.by].map((e) => `mailto:${e}`), 'mailto:post@cleanunit.no'];
    assert.deepEqual((k.match(/mailto:[^"]+/g) || []).sort(), forventet.sort(), `${s.fil}: mailto-lenkene i kortet`);
    assert.deepEqual((k.match(/[\w.-]+@[\w.-]+/g) || []).filter((a) => !a.startsWith('mailto')).sort(),
      [...PERSON_EPOST[s.by].flatMap((e) => [e]), ...PERSON_EPOST[s.by], 'post@cleanunit.no'].sort(), `${s.fil}: alle adresser i kortet`);
    const personer = [...k.match(/<ul class="kontakt__personer">[\s\S]*?<\/ul>/)[0].matchAll(/<div><strong>[^<]*<\/strong><span>[^<]*<\/span><a href="tel:[^"]+">[^<]+<\/a><a href="mailto:([^"]+)">([^<]+)<\/a><\/div>/g)];
    assert.deepEqual(personer.map((m) => [m[1], m[2]]), PERSON_EPOST[s.by].map((e) => [e, e]), `${s.fil}: e-posten står rett etter telefonen i hver personrad`);
    const tlf = s.by === 'Oslo' ? '21 55 56 80' : '900 65 009';
    const boks = k.match(/<div class="kontakt__knapper">[\s\S]*?<\/div>/)[0];
    assert.equal(boks.split(tlf).length - 1, 1, `${s.fil}: telefonen skal stå én gang i knapperaden`);
    const utenBoksOgPersoner = k.replace(boks, '').replace(/<ul class="kontakt__personer">[\s\S]*?<\/ul>/, '');
    assert.ok(!utenBoksOgPersoner.includes(tlf) && !/href="tel:/.test(utenBoksOgPersoner), `${s.fil}: telefon utenfor knapperaden/personradene`);
  }
});

test('Kontakt: «Ta kontakt»-boksen står først i markupen (øverst på mobil); kortet har kontor, personer, lenke til den andre byen; adressene står bare i byer.json', () => {
  for (const s of alleSider()) {
    const k = kontaktKort(s.fil);
    const pos = ['kontakt__handling', 'kontakt__info', 'kontakt__kontorer', 'kontakt__alternativ', 'kontakt__personer', 'kontakt__bylenke'].map((x) => k.indexOf(`class="${x}`));
    assert.ok(pos.every((p) => p >= 0), `${s.fil}: en del mangler ${pos}`);
    assert.deepEqual([...pos].sort((a, b) => a - b), pos, `${s.fil}: boksen først, så kortet (kontor, personer, bylenke)`);
    assert.ok(k.indexOf('kontakt__knapper') > k.indexOf('class="kontakt__handling') && k.indexOf('kontakt__knapper') < k.indexOf('class="kontakt__info'), `${s.fil}: knappene ligger i boksen, utenfor kortet`);
  }
  const mal = les('deler/kontakt.html');
  assert.doesNotMatch(mal, /[\w.-]+@[\w.-]+\.no/, 'ingen adresser hardkodet i malen');
  const { byer } = JSON.parse(les('byer.json'));
  assert.deepEqual([byer[0].data.epost_marit, byer[0].data.epost_mari, byer[1].data.epost_thord], ['renhold@cleanunit.no', 'post@cleanunit.no', 'thord@cleanunit.no']);
});

test('Kontakt-kortet: e-postlenkene har samme stil som telefonlenkene og 44 px trykkflate på touch, og kan brytes', () => {
  const css = les('css/style.css');
  assert.match(css, /\.kontakt__personer a \{ color: var\(--teal-mork\)/);
  assert.match(css, /@media \(pointer: coarse\) \{ \.kontakt__personer li > div a \{[^}]*min-height: 44px/);
  assert.match(css, /\.kontakt__personer li > div a \{ overflow-wrap: anywhere; \}/);
});

test('Kontakt: «Ta kontakt»-boksen har to like omrissknapper, «Ring oss – <telefon>» og «Send e-post», og står før kortet', () => {
  for (const s of alleSider()) {
    const k = les(s.fil).match(/<section class="stopp--kontakt"[\s\S]*?<\/section>/)[0];
    const tlf = s.by === 'Oslo' ? '21 55 56 80' : '900 65 009';
    const tlfHref = s.by === 'Oslo' ? '+4721555680' : '+4790065009';
    const rad = k.match(/<div class="kontakt__knapper">([\s\S]*?)<\/div>/);
    assert.ok(rad, `${s.fil}: knapperaden mangler`);
    assert.match(k, /<div class="kontakt__handling">\s*<div class="kontakt__tittel"><img [^>]*>\s*<h3>Ta kontakt<\/h3><\/div>\s*<p class="kontakt__lede">[^<]+<\/p>\s*<div class="kontakt__knapper">/, `${s.fil}: boksen heter «Ta kontakt», har ingressen og så knappene`);
    assert.doesNotMatch(k.slice(0, k.indexOf('class="kontakt-layout"')), /stopp__lede/, `${s.fil}: ingen ingress over kortene, den står i boksen`);
    assert.ok(k.indexOf('kontakt__knapper') < k.indexOf('kontakt__personer'), `${s.fil}: knappene står før personene i markupen (øverst på mobil)`);
    const lenker = [...rad[1].matchAll(/<a ([^>]*)>([^<]*)<\/a>/g)].map((m) => [m[1].trim(), m[2]]);
    assert.deepEqual(lenker, [
      [`class="knapp knapp--omriss" href="tel:${tlfHref}"`, `Ring oss – ${tlf}`],
      ['class="knapp knapp--omriss" href="mailto:post@cleanunit.no"', 'Send e-post'],
    ], `${s.fil}: knappene i Kontakt-kortet`);
    assert.doesNotMatch(k, /Kontakt oss på/, `${s.fil}: den gamle tekstlinja`);
  }
});

test('Kontakt-kortet: adressen er en lenke til Google Maps med nøyaktig den viste adressen URL-kodet', () => {
  const ADRESSE = { Oslo: 'Gunnar Schjelderups vei 9, 0485 Oslo', Stavanger: 'Bryggerikaien 16, 4014 Stavanger' };
  for (const s of alleSider()) {
    const k = les(s.fil).match(/<section class="stopp--kontakt"[\s\S]*?<\/section>/)[0];
    const m = k.match(/<a class="kontakt__adresse" ([^>]*)>([^<]*)<span aria-hidden="true">↗<\/span><\/a>/);
    assert.ok(m, `${s.fil}: adresselenken mangler`);
    const vist = m[2].trim();
    assert.equal(vist, ADRESSE[s.by], `${s.fil}: viste adresse`);
    const href = m[1].match(/href="([^"]+)"/)[1];
    assert.equal(href, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vist)}`, `${s.fil}: href følger den viste adressen`);
    assert.match(m[1], /target="_blank"/, s.fil);
    assert.match(m[1], /rel="[^"]*noopener[^"]*"/, s.fil);
    assert.match(m[1], new RegExp(`aria-label="${vist} – åpne i Google Maps \\(ny fane\\)"`), `${s.fil}: aria-label`);
  }
});

test('Oslo: ingen Stavanger-tekster på noen av de fem sidene', () => {
  const h = synlig(heleBy('Oslo'));
  for (const t of ['thord@cleanunit.no', '900 65 009', 'Thord Hegre', 'To kontorer, samme standard', 'Hva koster renhold for dere?', 'Bryggerikaien']) {
    assert.ok(!h.includes(t), `Stavanger-teksten «${t}» lekker inn i Oslo (bortsett fra kontaktblokkens ene bylenke)`);
  }
});

test('Stavanger: UTKAST-merkene står igjen på det som ikke er bekreftet', () => {
  const forside = les('sider/forside.html');
  assert.match(forside, /UTKAST: sammendrag av Hovedrengjøring, Gulvbehandling, Vinduspuss og Hygieneartikler/);
  assert.match(les('sider/tjenester.html'), /UTKAST: «Les mer»-tekstene er Maritts tekster fra Oslo-siden, gjenbrukt/);
  assert.match(les('byer.json'), /UTKAST: Stavanger-kontorets egen beskrivelse/);
});

// stiNedover() avslutter stille hvis startpunktet mangler: uten denne koblingen forsvinner hele
// stien nedover siden uten at noe feiler.
test('Stien begynner i heroscenen: JS og CSS peker på samme startpunkt', () => {
  const js = les('js/main.js');
  assert.match(js, /document\.querySelector\('\.hero__sti-start'\)/, 'stiNedover finner ikke startpunktet i scenen');
  assert.match(les('css/style.css'), /\.hero__sti-start \{ position: absolute;/, 'startpunktet er ikke plassert i CSS');
});

// Marit: «Kun 1 linje med 3 punkter» og «ingen underleverandør» bort fra heroen. Den grå
// ingressen er teksten etter <br>, under den fete taglinen. Stavangers hero er et eget utkast.
const heroIngress = (fil) => {
  const m = les(fil).match(/<p class="hero__ingress">([\s\S]*?)<\/p>/);
  assert.ok(m, `${fil}: fant ikke .hero__ingress`);
  return m[1];
};

test('Oslo: heroens grå ingress er nøyaktig de tre punktene, uten underleverandører', () => {
  const [tagline, grå, ...rest] = heroIngress('test/ut/index.html').split('<br>');
  assert.equal(rest.length, 0);
  assert.equal(tagline, '<strong>Profesjonelt renhold for bedrifter, skoler og barnehager.</strong>');
  assert.equal(grå, 'Etablert 2007, offentlig godkjent, Miljøfyrtårn');
  assert.ok(!/underleverandør/i.test(tagline + grå));
});

test('Stavanger: heroens ingress er uendret', () => {
  assert.equal(heroIngress('test/ut/stavanger/index.html'),
    '<!-- UTKAST: kunde redigerer fritt -->Spesialister på barnehagerenhold, med skoler, bilforhandlere og kontorer i tillegg. Direkte ansatte&nbsp;– ingen underleverandører.');
});

test('Stavanger-lederen heter Thord Hegre, daglig leder (Enhetsregisteret), aldri «Thor D.»', () => {
  for (const s of alleSider().filter((x) => x.by === 'Stavanger')) {
    const h = les(s.fil);
    assert.ok(!h.includes('Thor D.'), `${s.fil}: «Thor D.» var en feiltolking av thord@ — navnet er Thord Hegre`);
    assert.ok(!h.includes('Leder Stavanger'), `${s.fil}: tittelen er Daglig leder`);
    assert.match(h, /<strong>Thord Hegre<\/strong><span>Daglig leder<\/span>/, `${s.fil}: kontaktkortet har navn og tittel`);
    assert.match(h, /team-initialer" aria-hidden="true">TH</, `${s.fil}: initialene er TH`);
  }
  assert.match(les(sideFil('Stavanger', 'om_oss')), /<h4>Thord Hegre<\/h4>\s*<p class="team-rolle">Daglig leder<\/p>/, 'Om oss-kortet');
});

test('CSS: heroens og «Ta kontakt»-boksens to knapper er like: omriss med grønn ramme, hvit bunn og grønn skrift', () => {
  const css = les('css/style.css');
  assert.match(css, /\.knapp \{[^}]*border: 2px solid var\(--teal\);/, 'grønn ramme');
  assert.match(css, /\n\.knapp--omriss \{ background: #fff; color: var\(--teal\); \}/, 'hvit bunn, grønn skrift');
  assert.doesNotMatch(css, /\.knapp--omriss:hover \{[^}]*color: #fff/, 'hover skal ikke bli hvit skrift');
  const k = les('deler/kontakt.html');
  for (const f of ['sider/forside.html', 'deler/kontakt.html']) {
    assert.doesNotMatch(les(f), /knapp--fyll/, `${f}: begge knappene er like (omriss), ingen fylt (Ricky 2026-10-08)`);
  }
  assert.doesNotMatch(css, /knapp--fyll/, 'ubrukt fylt-stil er fjernet');
  assert.equal((k.match(/class="knapp knapp--omriss"/g) || []).length, 2, '«Ta kontakt»-boksen: to like omrissknapper');
});

test('«Derfor»-kortene har hover-løft som de andre kortene: kun med mus, ikke ved redusert bevegelse', () => {
  const css = les('css/style.css');
  assert.match(css, /\.derfor-kort \{[^}]*transition: transform \.2s, box-shadow \.2s;/, 'kortet har overgang');
  assert.match(css, /@media \(hover: hover\) \{\s*\.derfor-kort:hover \{ transform: translateY\(-4px\); box-shadow:/, 'hover er gated på (hover: hover)');
  assert.match(css, /\.derfor-kort:hover \.derfor-kort__ikon \{ transform: scale\(1\.08\); \}/, 'symbolet vokser litt');
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.derfor-kort, \.derfor-kort__ikon \{ transition: none; \}\s*\.derfor-kort:hover, \.derfor-kort:hover \.derfor-kort__ikon \{ transform: none; \}/, 'slått av ved redusert bevegelse');
});


// Kontakt-revisjon 2026-10-08 (funn 1, 5, 6, 7).
const regelBlokk = (css, velger) => { const i = css.indexOf(velger); return i < 0 ? '' : css.slice(i, css.indexOf('}', i) + 1); };
const mediaBlokk = (css, start) => { const i = css.indexOf(start); return i < 0 ? '' : css.slice(i, css.indexOf('}', css.indexOf('}', i) + 1) + 1); };

test('Kontakt: person-lenkene har 44 px trykkflate på touch uten negativ marg, og er kompakte med mus', () => {
  const css = les('css/style.css');
  const touch = mediaBlokk(css, '@media (pointer: coarse) { .kontakt__personer');
  assert.match(touch, /min-height: 44px/);
  assert.match(touch, /display: inline-flex/);
  assert.doesNotMatch(touch, /margin/, 'ingen (negativ) marg: telefon og e-post skal ikke overlappe');
  assert.doesNotMatch(regelBlokk(css, '.kontakt__personer li > div a {'), /min-height|margin/, 'uten touch er lenkene kompakte');
});

test('Kontakt: Oslos to personer står side om side fra 48rem, Stavanger har én rad som ikke strekkes', () => {
  const css = les('css/style.css');
  assert.match(css, /@media \(min-width: 48rem\) \{ \.kontakt__personer \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); column-gap: var\(--s-5\); \} \}/);
  assert.doesNotMatch(regelBlokk(css, '.kontakt__personer {'), /grid-template-columns/, 'under 48rem stablet');
  const kontakt = les('deler/kontakt.html');
  const oslo = kontakt.slice(kontakt.indexOf('<ul class="kontakt__personer">'), kontakt.indexOf('</ul>'));
  const del = (s, a, b) => s.slice(s.indexOf(a), s.indexOf(b));
  assert.equal((del(oslo, '{{#er_oslo}}', '{{^er_oslo}}').match(/<li>/g) || []).length, 2, 'Oslo: to rader');
  assert.equal((oslo.slice(oslo.indexOf('{{^er_oslo}}')).match(/<li>/g) || []).length, 1, 'Stavanger: én rad');
});

test('Kontakt: «Gå til Clean Unit …»-lenka er bare så bred som teksten', () => {
  assert.match(les('css/style.css'), /\.kontakt__bylenke \{[^}]*justify-self: start/);
});

test('CSS: Kunder bruker samme seksjons-padding som de andre seksjonene', () => {
  const css = les('css/style.css');
  const pad = (v) => (regelBlokk(css, v).match(/padding-block: ([^;]+);/) || [])[1];
  for (const v of ['.stopp--tjenester {', '.stopp--om {', '.stopp--jobb {', '.stopp--kontakt {']) assert.equal(pad(v), 'var(--seksjon-y)', v);
  assert.equal(pad('.stopp--kunder {'), pad('.stopp--kontakt {'));
  assert.doesNotMatch(css, /brukes ikke på nettsiden/, 'burgunder-kommentaren er ikke utdatert');
});

test('CSS: «Ta kontakt»-boksen ligger til venstre for kortet fra 64rem (grid-områder), knappene er stablet og like brede', () => {
  const css = les('css/style.css');
  assert.match(css, /@media \(min-width: 64rem\) \{\s*\.kontakt-layout \{[^}]*grid-template-areas: "handling info"/, 'boksen til venstre, kortet til høyre fra 64rem');
  assert.match(css, /\.kontakt__handling \{ grid-area: handling; \}/);
  assert.match(css, /\.kontakt__knapper \{ display: flex; flex-direction: column; align-items: stretch;/, 'stablet og like brede');
  assert.doesNotMatch(css, /\.kontakt__(info|handling)[^{]*\{[^}]*[^-]order:/, 'ingen order-triks: markup-rekkefølgen er lese- og tabrekkefølgen');
});

test('Kontakt: personene står under overskriften «Eller kontakt direkte», delelinja ligger på gruppen og ikke på lista', () => {
  for (const s of alleSider()) {
    const k = kontaktKort(s.fil);
    assert.match(k, /<div class="kontakt__alternativ">\s*<h4>Eller kontakt direkte<\/h4>\s*<ul class="kontakt__personer">/, `${s.fil}: overskrift rett over personlista`);
  }
  const css = les('css/style.css');
  assert.match(css, /\.kontakt__alternativ \{ border-top: 1px solid var\(--gronn-mellom\);/, 'delelinja på gruppen');
  assert.doesNotMatch(css, /\.kontakt__personer \{[^}]*border-top/, 'ikke dobbel delelinje');
});

test('Kontakt: lenka til den andre byen ligger utenfor kortet, og fra 64rem under boksen til venstre', () => {
  for (const s of alleSider()) {
    const k = kontaktKort(s.fil);
    const kort = k.slice(k.indexOf('class="kontakt__info"'), k.indexOf('class="kontakt__bylenke"'));
    assert.ok(kort.length > 0 && !kort.includes('kontakt__bylenke'), `${s.fil}: lenka kommer etter kortet`);
    assert.match(k, /<\/ul>\s*<\/div>\s*<\/div>\s*<a class="kontakt__bylenke"/, `${s.fil}: lenka kommer etter at både gruppen og kortet er lukket`);
  }
  const css = les('css/style.css');
  assert.match(css, /grid-template-areas: "handling info" "bylenke info"/, 'lenka i venstre kolonne under boksen');
  assert.match(css, /\.kontakt__bylenke \{ grid-area: bylenke;/, 'grid-område for lenka');
});

test('Kontakt: begge kortene har et dekorativt ikon foran overskriften (alt tom, finnes i bilder/, burgunder, 44 px)', () => {
  for (const s of alleSider()) {
    const k = kontaktKort(s.fil);
    const ikoner = [...k.matchAll(/<div class="kontakt__tittel"><img class="kontakt__ikon" src="((?:\.\.\/)*)bilder\/([a-z-]+\.svg)" alt="" width="44" height="44"[^>]*><h3>([^<]+)<\/h3><\/div>/g)];
    assert.deepEqual(ikoner.map((m) => [m[2], m[3]]), [['ikon-ta-kontakt.svg', 'Ta kontakt'], ['ikon-firma.svg', s.by === 'Oslo' ? 'Clean Unit Renhold AS' : 'Clean Unit Stavanger AS']], `${s.fil}: to ikoner foran overskriftene`);
  }
  for (const f of ['ikon-ta-kontakt.svg', 'ikon-firma.svg']) assert.match(les(`bilder/${f}`), /fill="#75355D"/, `${f}: burgunder`);
  assert.match(les('css/style.css'), /\.kontakt__ikon \{[^}]*width: 2\.75rem; height: 2\.75rem;/, 'ikonet er 44 px, som initialsirklene');
});

// Tekstsjekk 1 (Marit, 2026-10-08): kommaet i «fast, daglig renhold» er fjernet overalt, den nye
// Jobb hos oss-overskriften gjelder begge byer, og ansattsitatene: Monika er signert «Monika S» (etter «Vilma: / Monika S»), alle fire sitatene står i begge byer (felles kultur og arbeidsmiljø).
test('Tekstsjekk: «fast, daglig renhold» (med komma) står ingen steder i kildene eller de bygde sidene', () => {
  const kilder = [...['forside', 'tjenester', 'referanser', 'om-oss', 'miljo'].map((n) => `sider/${n}.html`), 'deler/kontakt.html', 'deler/layout.html', 'byer.json'];
  for (const f of [...kilder, ...alleSider().map((x) => x.fil)]) assert.doesNotMatch(les(f), /fast, daglig/i, f);
  assert.match(les('sider/tjenester.html'), /fast daglig renhold/);
});
test('Tekstsjekk: «Renholderne er våre viktigste medarbeidere» står på Om oss i begge byer, den gamle h2-en er borte', () => {
  for (const by of ['Oslo', 'Stavanger']) {
    const h = les(sideFil(by, 'om_oss'));
    assert.ok(h.includes('<div class="vask-boks"><h2 data-vask>Renholderne er våre viktigste medarbeidere</h2></div>'), by);
    assert.ok(!h.includes('Renholderne er de viktigste</h2>'), `${by}: gammel h2`);
    assert.ok(h.includes('Det er renholderne som hver dag sørger for at kundene våre møter en ren arbeidsplass.'), `${by}: ny ingress`);
  }
});
test('Tekstsjekk: alle fire ansattsitatene (Monika S, Urszula, Aneta, Vilma) står i begge byer: kultur og arbeidsmiljø er felles (Ricky 2026-10-08)', () => {
  const sitat = (by, navn) => {
    const h = les(sideFil(by, 'om_oss'));
    const i = h.indexOf(`<footer>— ${navn}</footer>`);
    return i < 0 ? null : h.slice(h.lastIndexOf('<p>', i), i);
  };
  for (const by of ['Oslo', 'Stavanger']) {
    const h = les(sideFil(by, 'om_oss'));
    assert.ok(h.includes('<footer>— Monika S</footer>') && !h.includes('<footer>— Monika</footer>'), `${by}: Monika er signert Monika S`);
    assert.ok(sitat(by, 'Monika S').startsWith('<p>Mitt eventyr med Clean Unit begynte for 9 år siden.'), `${by}: Monikas tekst er uendret`);
    assert.ok(sitat(by, 'Vilma').startsWith('<p>Jeg har jobbet i Clean Unit siden 2013. Dette er det første stedet'), `${by}: Vilma står`);
    assert.ok(h.includes('<footer>— Urszula</footer>') && h.includes('<footer>— Aneta</footer>'), `${by}: Urszula og Aneta står`);
    assert.equal((h.match(/class="sitat-kort"/g) || []).length, 4, `${by}: fire ansattsitater`);
  }
});
test('Tekstsjekk: Oslo-tekstene er endret i Oslo, mens Stavanger beholder sine egne tjenestetekster', () => {
  const o = les(sideFil('Oslo', 'tjenester')); const st = les(sideFil('Stavanger', 'tjenester'));
  assert.ok(o.includes('utfører i dag renhold i over 70 barnehager i Oslo og omegn') && !o.includes('sørger vi for vikar'), 'Oslo');
  assert.ok(o.includes('NS-INSTA 800'), 'Oslo: NS-INSTA 800');
  assert.ok(st.includes('om lag 90 prosent av våre oppdrag') && !st.includes('NS-INSTA'), 'Stavanger: egen kort-tekst, ingen NS-INSTA');
  assert.ok(!les(sideFil('Stavanger', 'om_oss')).includes('Flere av våre ansatte har jobbet'), 'Stavanger: ingen Oslo-ansatttekst');
});


test('Stavanger-bybildet er Oslo-scenen med mer burgunder: samme mål, logoen på varebilen vises, verktøyet finnes', () => {
  const css = les('css/style.css');
  assert.doesNotMatch(css, /\.by--stavanger \.hero__scene-merke \{ display: none/, 'logoen skal legges på varebilen i Stavanger også (bildet har blank varebil)');
  assert.match(les('sider/forside.html'), /class="hero__scene-merke"/, 'logo-overlegget finnes i forsiden');
  assert.ok(existsSync('verktoy/hero-stavanger-burgunder.py'), 'verktøyet som lager Stavanger-scenene mangler');
  for (const gammel of ['verktoy/hero-stavanger.py', 'verktoy/hero-stavanger-raster.mjs', 'verktoy/hero-stavanger-webp.py']) {
    assert.ok(!existsSync(gammel), `${gammel}: den gamle generatoren tegner ikke lenger de nåværende bildene`);
  }
  const bytes = (f) => readFileSync(f);
  for (const [oslo, stav] of [['hero-scene', 'hero-stavanger'], ['hero-scene-vinter', 'hero-stavanger-vinter']]) {
    const o = bytes(`bilder/${oslo}.webp`); const s = bytes(`bilder/${stav}.webp`);
    assert.ok(!o.equals(s), `${stav}.webp skal være en egen scene`);
    // WebP-filer av typen VP8 har bredde/høyde i rasterhodet (se den eldre rastertesten): samme mål som Oslo
    assert.equal(s.readUIntLE(26, 2) & 0x3fff, o.readUIntLE(26, 2) & 0x3fff, `${stav}.webp: samme bredde som Oslo-scenen`);
    assert.equal(s.readUIntLE(28, 2) & 0x3fff, o.readUIntLE(28, 2) & 0x3fff, `${stav}.webp: samme høyde som Oslo-scenen`);
  }
});

test('Toppmeny: Kontakt-knappen er bare synlig i mobilvisning (≤ 62rem), menyvalget skjules da, og knappen lukker menyen', () => {
  const css = les('css/style.css');
  assert.match(css, /\n\.side-nav__kontakt \{ display: none; border-color: var\(--burgunder\); color: var\(--burgunder\); \}/, 'skjult på desktop, med burgunder kant og skrift');
  const mobil = css.slice(css.indexOf('@media (max-width: 62rem) {\n  .side-nav__rad'));
  assert.match(mobil, /\.side-nav__kontakt \{ display: inline-flex; order: 2; margin-left: auto; min-height: 44px;/, 'synlig, 44 px høy, til høyre i mobilvisning');
  assert.match(mobil, /\.side-nav__bryter \{ order: 3; margin-left: 0; \}/, 'hamburgeren ligger etter knappen');
  assert.match(mobil, /\.side-nav__meny li:has\(> a\[href="#kontakt"\]\) \{ display: none; \}/, 'menyvalget Kontakt skjules når knappen vises');
  assert.match(les('js/main.js'), /querySelector\('\.side-nav__kontakt'\)\?\.addEventListener\('click', \(\) => sett\(false\)\)/, 'knappen lukker menyen');
});

test('Varebil: bakskjermen er reparert av verktoy/varebil-bakskjerm.py, og rasteret i varebil-hero.svg er fortsatt et 347×145 WebP', () => {
  assert.ok(existsSync('verktoy/varebil-bakskjerm.py'), 'verktøyet som reparerer bakskjermen mangler');
  const svg = les('bilder/varebil-hero.svg');
  const m = svg.match(/<image[^>]*href="data:image\/webp;base64,([^"]+)"/);
  assert.ok(m, 'rasteret skal være et innebygd WebP');
  const webp = Buffer.from(m[1], 'base64');
  assert.equal(webp.toString('ascii', 0, 4), 'RIFF');
  assert.equal(webp.toString('ascii', 8, 12), 'WEBP');
  // VP8X-hode (alfa): bredde og høyde minus 1 som 24 bit fra byte 24 og 27
  assert.equal(webp.toString('ascii', 12, 16), 'VP8X', 'alfa krever VP8X');
  assert.equal(webp.readUIntLE(24, 3) + 1, 347, 'rasterbredden');
  assert.equal(webp.readUIntLE(27, 3) + 1, 145, 'rasterhøyden');
});

test('Toppmeny: menyvalget «Kontakt» er burgunder på fast lys bakgrunn, også under pekeren', () => {
  const css = les('css/style.css');
  assert.match(css, /\n\.side-nav__lenke\[href="#kontakt"\] \{ color: var\(--burgunder\); background: var\(--teal-lys\); \}/, 'burgunder skrift på lys bakgrunn hele tiden');
  assert.match(css, /\.side-nav__lenke\[href="#kontakt"\]:hover \{ color: var\(--burgunder\); \}/, 'forblir burgunder under pekeren');
  assert.ok(css.indexOf('.side-nav__lenke[href="#kontakt"]:hover') > css.indexOf('.side-nav__lenke:hover {'), 'hover-regelen for Kontakt kommer etter den generelle (samme spesifisitet)');
});

test('CSS: «Derfor»-kortene er kompakte: smalere rad (46rem), 3 rem symbol, 1 rem tekst og mindre luft (Ricky 2026-10-08)', () => {
  const css = les('css/style.css');
  assert.match(css, /\.derfor-rad \{[^}]*max-width: 46rem;/, 'raden er smalere enn 60rem');
  assert.match(css, /\.derfor-kort p \{ color: var\(--tekst\); font-size: 1rem; line-height: 1\.55; \}/, 'tekst 1 rem');
  assert.match(css, /\.derfor-kort__ikon \{[^}]*width: 3rem; height: 3rem;/, 'symbol 3 rem');
  assert.match(css, /\.derfor-rad--en \{[^}]*max-width: 24rem;/, 'Stavangers ene kort er også smalere');
  assert.match(css, /@media \(min-width: 48rem\) \{\s*\.derfor-rad \{[^}]*\}\s*\.derfor-rad--en \{[^}]*\}\s*\.derfor-kort \{ padding: var\(--s-5\) var\(--s-6\); \}/, 'mindre padding fra 48rem');
});
