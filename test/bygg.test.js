import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync } from 'node:fs';
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

// Alle ti sider: [by, bygg-mappe, kontor-epost] × fem sider (id → mappe under byen).
const BYER_UT = [['Oslo', 'test/ut', 'renhold@cleanunit.no'], ['Stavanger', 'test/ut/stavanger', 'thord@cleanunit.no']];
const STIER = { forside: '', tjenester: 'tjenester/', referanser: 'referanser/', om_oss: 'om-oss/', miljo: 'miljo/' };
const alleSider = () => BYER_UT.flatMap(([by, mappe, epost]) =>
  Object.entries(STIER).map(([id, sti]) => ({ by, id, epost, fil: `${mappe}/${sti}index.html` })));
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
    assert.equal((nav.match(/side-nav__kontakt/g) || []).length, 0, `${s.fil}: ingen Kontakt-knapp`);
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
    assert.match(h, /bilder\/hero-scene\.webp/, f);
    assert.match(h, /<img class="hero__scene-bilde" src="[^"]*bilder\/hero-scene\.jpg" alt=""/, f);
    assert.match(h, /class="hero__sti-start"/, `${f}: stien trenger startpunktet sitt`);
    assert.match(h, /<picture class="hero__scene-vinter">[\s\S]*?bilder\/hero-scene-vinter\.jpg/, `${f}: vinterscenen mangler`);
    assert.match(h, /classList\.add\("vinter"\)/, `${f}: sesongbyttet mangler i <head>`);
    assert.doesNotMatch(h, /hero__(rute|stopp|by|sol)/, `${f}: rester av den gamle heroen`);
  }
  for (const fil of ['hero-scene.webp', 'hero-scene.jpg', 'hero-scene-vinter.webp', 'hero-scene-vinter.jpg', 'logo-cleanunit-varebil.svg']) {
    assert.ok(existsSync(`test/ut/bilder/${fil}`), `bilder/${fil} mangler i bygget`);
  }
});

// Glansen (Ricky 2026-09-30). Tre behandlinger som alle legger hvitt lys på
// flater som allerede finnes — se --glans-*-tokensene i css/style.css. Testen
// finnes fordi ingen av dem har innhold å telle: forsvinner en av dem, feiler
// ingenting, siden ser bare annerledes ut. Det er samme stillhet som gjorde at
// de døde sti-lenkene kunne ligge uoppdaget i fire dager.
test('Glans: vindusglasset finnes i CSS-en (speilet i bakken gikk ut med den gamle heroen)', () => {
  const css = les('css/style.css');
  // Vindusglasset: refleksen ligger inni kortets egen ramme (8,5 px), så den
  // måler seg etter rammen og ikke etter kortet. Innholdet må være løftet over
  // den — ellers maler det posisjonerte pseudo-elementet oppå teksten, som var
  // den dyreste feilen i laben («Vinduspuss» ble vasket ut).
  assert.match(css, /\.kort--vindu::before \{/, 'refleksen i vindusglasset mangler');
  assert.match(css, /\.kort--vindu > picture,[\s\S]*?z-index: 1; \}/,
    'innholdet på vinduskortet løftes ikke over refleksen');
  assert.match(css, /inset: 8\.5px; border-radius: 5\.5px/,
    'glansen følger ikke vindusrammen (8,5 px innrykk, 5,5 px radius)');
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
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
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
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
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
    assert.ok(h.includes('<div class="vask-boks"><h2 data-vask>Renhold tilpasset stedet du driver</h2></div>'), `${by}: vask-overskriften`);
    assert.match(h, /<section class="stopp--tjenester" id="tjenester">/, by);
    assert.doesNotMatch(h.slice(h.indexOf('id="tjenester"'), h.indexOf('</section>', h.indexOf('id="tjenester"'))), /class="eyebrow"/, `${by}: eyebrowen er H1 nå`);
  }
});

// Vaskesveipet (Ricky 2026-10-05): hver overskrift ligger i .vask-boks, ellers måler observeren mot en
// klippet h2 og sveipet kjører aldri. Per side: overskriftene som skal ha data-vask. Kontakt-h2 står
// på alle sider (delt partial) og legges til under.
const KONTAKT_H2 = { Oslo: 'Trenger dere en ny renholdsleverandør?', Stavanger: 'Hva koster renhold for dere?' };
const VASK = {
  Oslo: {
    // «Renhold tilpasset stedet du driver» hører til tjeneste-seksjonen og flyttet med den til /tjenester/
    // i Task 4. Task 8 setter den tilbake på forsiden igjen.
    forside: ['Dette sier kundene våre', 'Renholderne er de viktigste', 'Fra to personer med hver sin mopp', 'Godkjent, ansvarlig og til stede'],
    tjenester: ['Renhold tilpasset stedet du driver'], referanser: [], om_oss: [], miljo: [],
  },
  Stavanger: {
    forside: ['Dette sier kundene våre', 'Renholderne er de viktigste', 'To kontorer, samme standard', 'Godkjent, ansvarlig og til stede'],
    tjenester: ['Renhold tilpasset stedet du driver'], referanser: [], om_oss: [], miljo: [],
  },
};
test('Vaskesveipet: riktige overskrifter per side, hver i .vask-boks', () => {
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
test('Stien: alle seksjonene den ankrer til finnes, med eyebrow', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f)
    for (const id of ['referanser', 'hvorfor', 'om-oss', 'jobb-hos-oss', 'kontakt']) {
      const start = h.indexOf(`id="${id}"`)
      assert.ok(start > -1, `${f}: mangler #${id}`)
      const seksjon = h.slice(start, h.indexOf('</section>', start))
      assert.match(seksjon, /class="eyebrow"/, `${f}: #${id} mangler .eyebrow (stien ankrer til den)`)
    }
  }
})

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

// Tilbudsskjemaet (2026-09-27). Ett Formspree-skjema per by, så hvert kontor
// får bare sin egen post — Oslo til renhold@, Stavanger til thord@. Begge
// sider bygges fra deler/layout.html + sider/*.html, så forskjellene må komme fra byer.json.
// Formspree-abonnementet er ennå ikke anskaffet (Christopher): kilden har
// %%FORMSPREE_ID%% som plassholder, og deploy-workflowen bytter den mot
// secrets.FORMSPREE_ID_OSLO / _STAVANGER. Den første testen her verner om at
// ingen ekte ID noen gang havner i git-historikken.
const TILBUD_BYER = alleSider().map((s) => [s.fil, s.by, s.epost]);

const tilbudSeksjon = (h) => {
  const start = h.indexOf('id="kontakt"')
  return start < 0 ? '' : h.slice(start, h.indexOf('</section>', start))
}

test('Tilbud: ingen ekte Formspree-ID er committet', () => {
  const filer = ['deler/layout.html', 'deler/kontakt.html', 'sider/forside.html', '.github/workflows/deploy.yml', 'byer.json',
    'test/ut/index.html', 'test/ut/stavanger/index.html']
  for (const f of filer) {
    assert.doesNotMatch(les(f), /formspree\.io\/f\/(?!%%FORMSPREE_ID%%)/, `${f}: ekte Formspree-ID i kilden`)
  }
})

test('Kontakt-blokken har én kilde: delt partial, ikke inline i noen side', () => {
  const kontakt = les('deler/kontakt.html');
  assert.equal((kontakt.match(/id="tilbud-skjema"/g) || []).length, 1, 'partialen har skjemaet');
  assert.equal((kontakt.match(/<section class="stopp--kontakt" id="kontakt">/g) || []).length, 1);
  assert.match(les('deler/layout.html'), /\{\{> side\}\}\n\{\{> kontakt\}\}\n<\/main>/, 'layouten setter inn kontakt etter siden');
  for (const f of ['sider/forside.html']) {
    assert.doesNotMatch(les(f), /id="kontakt"|id="tilbud-skjema"/, `${f}: kontakt skal ikke ligge inline`);
  }
});

test('Kontakt: bylenken peker til den andre byens forside fra enhver side', () => {
  assert.doesNotMatch(les('byer.json'), /bylenke/, 'de gamle bylenke-nøklene skal være borte');
  assert.match(les('deler/kontakt.html'), /class="kontakt__bylenke" href="\{\{andre_by_hjem\}\}">Gå til Clean Unit \{\{andre_by_navn\}\} →/);
});

test('Tilbud: skjemaet står synlig, men knappen er låst til ID-en finnes', () => {
  for (const [f] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    assert.ok(seksjon, `${f}: mangler #kontakt`)
    // Ricky 2026-09-27: seksjonen skal se ferdig ut også før abonnementet er
    // på plass, så skjemaet vises. Det som hindrer en tapt henvendelse er
    // derfor ikke lenger hidden, men den låste knappen + at main.js ikke
    // kobler på innsendingen så lenge plassholderen står.
    assert.match(seksjon, /<form class="tilbud-skjema" id="tilbud-skjema"/, `${f}: skjemaet`)
    assert.doesNotMatch(seksjon, /id="tilbud-skjema"[^>]*\bhidden\b/, `${f}: skjemaet skal ikke være hidden`)
    assert.match(seksjon, /data-endpoint="https:\/\/formspree\.io\/f\/%%FORMSPREE_ID%%"/, `${f}: plassholder-endepunkt`)
    assert.match(seksjon, /<button type="submit"[^>]*\bdisabled\b/, `${f}: send-knappen må være disabled i markup`)
  }
})

test('Tilbud: alle feltene har label koblet til id', () => {
  for (const [f] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    for (const id of ['tilbud-navn', 'tilbud-epost', 'tilbud-telefon',
      'tilbud-virksomhet', 'tilbud-gjelder', 'tilbud-melding']) {
      assert.match(seksjon, new RegExp(`for="${id}"`), `${f}: mangler <label for="${id}">`)
      assert.match(seksjon, new RegExp(`id="${id}"`), `${f}: mangler feltet #${id}`)
    }
    // Formspree bruker feltet som heter «email» som svar-til-adresse
    assert.match(seksjon, /id="tilbud-epost" name="email"/, `${f}: e-postfeltet må hete email`)
  }
})

test('Tilbud: «Hva gjelder det» speiler heroens fire kundetyper', () => {
  for (const [f] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    for (const type of ['Barnehage', 'Skole', 'Kontor', 'Bilforhandler', 'Annet']) {
      assert.match(seksjon, new RegExp(`<option value="[a-z]+">${type}</option>`), `${f}: mangler ${type}`)
    }
  }
})

test('Tilbud: hver by har sin egen mottaker i fallback og emne', () => {
  const alle = ['renhold@cleanunit.no', 'thord@cleanunit.no']
  for (const [f, by, epost] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    // Fallback-ene (varselet i skjemaet og feilboksen) peker på EGET kontor;
    // kontaktinfoen kan gjerne vise begge kontorene, så vi ser bare på skjemaet + feilboksen.
    const skjema = seksjon.slice(seksjon.indexOf('<form'), seksjon.indexOf('</form>'))
    const feil = seksjon.slice(seksjon.indexOf('id="tilbud-feil"'), seksjon.indexOf('</p>', seksjon.indexOf('id="tilbud-feil"')))
    const fallback = skjema + feil
    assert.match(fallback, new RegExp(`mailto:${epost.replace('.', '\\.')}`), `${f}: fallbacken mangler eget kontor`)
    assert.match(seksjon, new RegExp(`name="_subject" value="Ny tilbudsforespørsel – ${by}"`), `${f}: emnefeltet`)
    for (const annen of alle.filter((e) => e !== epost)) {
      assert.doesNotMatch(fallback, new RegExp(`mailto:${annen.replace('.', '\\.')}`), `${f}: fallbacken låner ${annen}`)
    }
  }
})

test('Tilbud: Kontakt er menyvalg i headeren på alle sider; forsidens hero har kun «Ring oss»', () => {
  for (const s of alleSider()) {
    const h = les(s.fil);
    assert.match(h, /class="side-nav__lenke" href="#kontakt">Kontakt</, `${s.fil}: menyvalget Kontakt peker på #kontakt`);
    if (s.id !== 'forside') continue;
    const i = h.indexOf('<div class="hero__knapper">');
    const knapper = h.slice(i, h.indexOf('</div>', i));
    assert.equal((knapper.match(/class="knapp/g) || []).length, 1, `${s.fil}: heroen skal ha én knapp`);
    assert.match(knapper, /href="tel:/, `${s.fil}: heroens knapp er «Ring oss»`);
  }
});

test('Tilbud: skjemaet har kvittering og feilboks', () => {
  for (const [f] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    assert.match(seksjon, /id="tilbud-kvittering"[^>]*hidden/, `${f}: kvitteringen`)
    assert.match(seksjon, /id="tilbud-feil"[^>]*role="alert"[^>]*hidden/, `${f}: feilboksen`)
  }
})

test('Tilbud: varselet om at skjemaet ikke er i bruk står synlig i skjemakortet, uten interne navn', () => {
  for (const [f, , epost] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    const tag = seksjon.match(/<div class="skjema-varsel" id="tilbud-varsel"[^>]*>/)
    assert.ok(tag, `${f}: varselet mangler`)
    assert.doesNotMatch(tag[0], /hidden/, `${f}: varselet skal være synlig i markup`)
    // Det skal ligge inne i skjemakortet, ellers står det utenfor kortet det
    // forklarer, og det ville blitt en tredje grid-kolonne i .kontakt-layout.
    assert.ok(seksjon.indexOf('id="tilbud-varsel"') < seksjon.indexOf('</form>'),
      `${f}: varselet må ligge inne i skjemaet`)
    // Besøkende skal ikke se interne huskelapper (leverandør, personnavn): varselet sier at
    // skjemaet åpner snart og gir telefon og e-post (design-kritikk #12, 2026-10-02).
    const start = seksjon.indexOf('id="tilbud-varsel"');
    const varsel = seksjon.slice(start, seksjon.indexOf('</div>', start));
    assert.match(varsel, /Skjemaet åpner snart/, `${f}: varselet sier ikke at skjemaet åpner snart`)
    assert.doesNotMatch(varsel, /Formspree|Christopher|abonnement/i, `${f}: varselet viser en intern beskjed`)
    assert.ok(varsel.includes(`mailto:${epost}`), `${f}: varselet mangler ${epost}`)
    assert.match(varsel, /href="tel:/, `${f}: varselet mangler telefonlenke`)
  }
})

test('Tilbud: varselet skjules i samme slengen som skjemaet vises', () => {
  const js = les('js/main.js')
  const kropp = js.slice(js.indexOf('function tilbudSkjema'))
  assert.match(kropp, /tilbud-varsel/, 'main.js kjenner ikke varselet')
  assert.match(kropp, /varsel\.hidden = true/, 'varselet skjules ikke når skjemaet tas i bruk')
})

test('Tilbud: uten ID kobles innsendingen ikke på, og Enter laster ikke siden', () => {
  const js = les('js/main.js')
  const kropp = js.slice(js.indexOf('function tilbudSkjema'))
  assert.match(kropp, /const klar = endepunkt !== '' && !endepunkt\.includes\('%%FORMSPREE_ID%%'\)/,
    'klar-sjekken mangler')
  const ikkeKlar = kropp.slice(kropp.indexOf('if (!klar)'), kropp.indexOf('knapp.disabled = false'))
  assert.match(ikkeKlar, /preventDefault/, 'innsendingen stoppes ikke når endepunktet mangler')
  assert.match(ikkeKlar, /return/, 'innsendingen kobles på selv uten endepunkt')
})

test('Tilbud: stien får en node for seksjonen, og skriptet kobles på', () => {
  const js = les('js/main.js')
  assert.match(js, /\['#kontakt', 'Kontakt'\]/, 'sti-noden mangler')
  assert.match(initKropp(js), /tilbudSkjema\(\)/, 'tilbudSkjema kalles ikke fra initSider()')
  // Gatingen: står plassholderen igjen, finnes ingen ID — da skal skjemaet
  // forbli skjult og seksjonen vise ring/e-post i stedet.
  assert.match(js, /includes\('%%FORMSPREE_ID%%'\)/, 'gatingen mot plassholderen mangler')
})

test('Tilbud: seksjonen fortsetter bakgrunnsvekslingen og har skjemastil', () => {
  const css = les('css/style.css')
  // #jobb-hos-oss slutter på --base, så neste seksjon (Miljø, nå på himmelen) tones fra --base; Kontakt er lys teal.
  assert.match(css, /\n\.stopp--kontakt \{ padding-block: var\(--seksjon-y\); background: var\(--teal-lys\); \}/)
  assert.match(css, /\.kontakt-layout \{/, 'layout-grid mangler')
  assert.match(css, /\.skjema-felt label \{/)
  assert.match(css, /\.tilbud-skjema input,/, 'feltstilen mangler')
  assert.match(css, /\.skjema-varsel(, \.kontakt__direkte)? \{/)
  assert.match(css, /\.kontakt__direkte \{/, 'headeren på kontaktkortet mangler')
  // Den låste knappen må se låst ut: uten en :disabled-regel står den i full
  // solid teal og ser trykkbar ut mens den ikke gjør noe.
  assert.match(css, /\.tilbud-skjema button\[type="submit"\]:disabled \{[^}]*opacity/)
  assert.match(css, /\.knapp:not\(:disabled\):hover/, 'den låste knappen løfter seg på hover')
  assert.match(css, /\.skjema-feil \{/)
  assert.match(css, /\.skjema-kvittering \{/)
  // hidden-attributtet må faktisk skjule: setter man display på disse
  // selektorene, overstyrer det UA-regelen og den døde formen vises likevel.
  assert.match(css, /\[hidden\] \{ display: none; \}/)
})

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
  for (const t of ['BSN – Boligstiftelsen Nydalen', 'Dr. Brandt', 'Vilma', 'Marit Byfuglien', 'Mari Pedersen',
    'Guro Klingenberg Schei', 'Miljøfyrtårn siden 2011',
    'Medlem av Virke og tariffbundet', 'Offentlig godkjent renholdsbedrift', 'Hvorfor vi velger bort underleverandører',
    'Trenger dere en ny renholdsleverandør?']) {
    assert.ok(h.includes(t), `mangler «${t}»`);
  }
  for (const [tlf] of [['+4797195993'], ['+4747298445']]) assert.ok(h.includes(`href="tel:${tlf}"`), tlf);
  assert.ok(h.includes('mailto:jobb@cleanunit.no?subject='), 'åpen søknad går til jobb@ (Maritts dokument: «Søker du jobb? Send oss en e-post på jobb@cleanunit.no»)');
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

// stiNedover() avslutter stille hvis startpunktet mangler: uten denne koblingen forsvinner hele
// stien nedover siden uten at noe feiler.
test('Stien begynner i heroscenen: JS og CSS peker på samme startpunkt', () => {
  const js = les('js/main.js');
  assert.match(js, /document\.querySelector\('\.hero__sti-start'\)/, 'stiNedover finner ikke startpunktet i scenen');
  assert.match(les('css/style.css'), /\.hero__sti-start \{ position: absolute;/, 'startpunktet er ikke plassert i CSS');
});
