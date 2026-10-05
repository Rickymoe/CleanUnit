import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { fyllMal, byggAlle } from '../bygg.js';

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

const les = (f) => readFileSync(f, 'utf8');

// Kroppen til initSider() alene. Uten dette er «kalles X fra initSider()»
// en test som ikke kan feile: mønsteret /x\(\)/ matcher også selve
// definisjonen `function x()`, så den består selv om kallet er borte.
// (Oppdaget 2026-09-30 ved å bryte hvert vern og se om testene feilet —
// glansSveip-kallet lot seg fjerne uten at noen test sa fra.)
const initKropp = (js) => js.slice(js.indexOf('export function initSider'), js.indexOf('\n}', js.indexOf('export function initSider')));

test('Oslo: egen tittel, eget telefonnummer, lenke til Stavanger i footeren', () => {
  const h = les('test/ut/index.html');
  assert.match(h, /<title>Clean Unit – renhold i Oslo<\/title>/);
  assert.match(h, /<body class="by--oslo">/);
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
  assert.match(h, /<body class="by--stavanger">/);
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

test('ingen ufylte plassholdere i noen bygget side', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    assert.doesNotMatch(readFileSync(f, 'utf8'), /\{\{/, f);
  }
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

// Vaskesveipet står på seks overskrifter per side (Ricky 2026-10-05): «Renhold tilpasset stedet du driver»,
// «Dette sier kundene våre», «Renholderne er de viktigste» (mistet det 2026-09-26, fikk det tilbake),
// «Fra to personer med hver sin mopp», «Godkjent, ansvarlig og til stede» og «Trenger dere en ny
// renholdsleverandør?». Stavanger har egne overskrifter i «Om oss» og Kontakt, men samme behandling.
// Hver må ligge i .vask-boks, ellers måler observeren mot en klippet h2 og sveipet kjører aldri.
const VASK_FELLES = ['Renhold tilpasset stedet du driver', 'Dette sier kundene våre', 'Renholderne er de viktigste', 'Godkjent, ansvarlig og til stede']
test('Vaskesveipet står på de seks valgte overskriftene, hver i .vask-boks', () => {
  for (const [f, egne] of [
    ['test/ut/index.html', ['Fra to personer med hver sin mopp', 'Trenger dere en ny renholdsleverandør?']],
    ['test/ut/stavanger/index.html', ['To kontorer, samme standard', 'Hva koster renhold for dere?']],
  ]) {
    const h = les(f)
    assert.equal((h.match(/<h2 data-vask/g) || []).length, 6, `${f}: antall h2 med data-vask`)
    for (const tekst of [...VASK_FELLES, ...egne]) {
      assert.ok(h.includes(`<div class="vask-boks"><h2 data-vask>${tekst}</h2></div>`), `${f}: «${tekst}» mangler sveip i .vask-boks`)
    }
  }
})

// Stien anker til eyebrow-en i hver seksjon (js/main.js). Endres id-ene eller
// eyebrow-klassen, forsvinner nodene i stillhet — derfor denne testen.
test('Stien: alle seksjonene den ankrer til finnes, med eyebrow', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f)
    for (const id of ['tjenester', 'referanser', 'hvorfor', 'om-oss', 'jobb-hos-oss', 'kontakt']) {
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
// sider bygges fra samme mal.html, så forskjellene må komme fra byer.json.
// Formspree-abonnementet er ennå ikke anskaffet (Christopher): kilden har
// %%FORMSPREE_ID%% som plassholder, og deploy-workflowen bytter den mot
// secrets.FORMSPREE_ID_OSLO / _STAVANGER. Den første testen her verner om at
// ingen ekte ID noen gang havner i git-historikken.
const TILBUD_BYER = [
  ['test/ut/index.html', 'Oslo', 'renhold@cleanunit.no'],
  ['test/ut/stavanger/index.html', 'Stavanger', 'thord@cleanunit.no'],
]

const tilbudSeksjon = (h) => {
  const start = h.indexOf('id="kontakt"')
  return start < 0 ? '' : h.slice(start, h.indexOf('</section>', start))
}

test('Tilbud: ingen ekte Formspree-ID er committet', () => {
  const filer = ['mal.html', '.github/workflows/deploy.yml', 'byer.json',
    'test/ut/index.html', 'test/ut/stavanger/index.html']
  for (const f of filer) {
    assert.doesNotMatch(les(f), /formspree\.io\/f\/(?!%%FORMSPREE_ID%%)/, `${f}: ekte Formspree-ID i kilden`)
  }
})

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

test('Tilbud: «Kontakt» er menyvalg i headeren (ingen knapp); heroen har kun «Ring oss»', () => {
  for (const [f] of TILBUD_BYER) {
    const h = les(f);
    const i = h.indexOf('<div class="hero__knapper">');
    const knapper = h.slice(i, h.indexOf('</div>', i));
    assert.equal((knapper.match(/class="knapp/g) || []).length, 1, `${f}: heroen skal ha én knapp`);
    assert.match(knapper, /href="tel:/, `${f}: heroens knapp er «Ring oss»`);
    assert.match(h, /class="side-nav__lenke" href="#kontakt">Kontakt</, `${f}: menyvalget Kontakt peker på #kontakt`);
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
  // #jobb-hos-oss slutter på --base, så neste seksjon skal være --teal-lys —
  // samme veksling som resten av siden (flate / teal-lys / base / teal-lys / base).
  assert.match(css, /\n\.stopp--kontakt \{ padding-block: var\(--seksjon-y\); background: var\(--teal-lys\); \}/)
  assert.match(css, /\.kontakt-layout \{/, 'layout-grid mangler')
  assert.match(css, /\.skjema-felt label \{/)
  assert.match(css, /\.tilbud-skjema input,/, 'feltstilen mangler')
  assert.match(css, /\.skjema-varsel \{/)
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

test('fyllMal: betingede blokker tas med bare når nøkkelen har verdi', () => {
  assert.equal(fyllMal('a{{#oslo}}X{{by}}{{/oslo}}b', { oslo: '1', by: 'Oslo' }), 'aXOslob');
  assert.equal(fyllMal('a{{#oslo}}X{{by}}{{/oslo}}b', { oslo: '', by: 'Oslo' }), 'ab');
  assert.throws(() => fyllMal('{{#oslo}}X{{/oslo}}', {}), /Mangler verdi for \{\{#oslo\}\}/);
});

test('Toppmeny: lenkene i Maritts rekkefølge peker på ankre som finnes, med den andre byen', () => {
  for (const [f, andre] of [['test/ut/index.html', 'Stavanger'], ['test/ut/stavanger/index.html', 'Oslo']]) {
    const h = les(f);
    const nav = h.slice(h.indexOf('<header class="side-nav"'), h.indexOf('</header>'));
    const lenker = [...nav.matchAll(/class="side-nav__lenke" href="#([a-z-]+)">([^<]+)</g)].map((m) => [m[1], m[2]]);
    assert.deepEqual(lenker.map((l) => l[1]),
      ['Tjenester', 'Referanser', 'Om oss', 'Miljø', 'Kontakt'], `${f}: menyrekkefølgen`);
    for (const [id] of lenker) assert.match(h, new RegExp(`id="${id}"`), `${f}: mangler #${id}`);
    assert.match(nav, new RegExp(`class="side-nav__by" href="[^"]+">${andre} `), `${f}: lenke til ${andre}`);
    assert.doesNotMatch(nav, /side-nav__kontakt/, `${f}: ingen Kontakt-knapp i headeren`);
    assert.match(h, /id="kontakt"/, f);
  }
});

test('Maritts innhold (Oppsett ny nettside) står på Oslo-siden: sju tjenester, referanser, team, miljøblokker og kontaktpersoner', () => {
  const h = les('test/ut/index.html');
  for (const t of ['Fast daglig renhold', 'Renhold av barnehager', 'Hovedrengjøring', 'Teppe- og møbelrens',
    'Gulvvedlikehold', 'Vindusvask', 'Hygieneartikler']) {
    assert.match(h, new RegExp(`<h3>${t}</h3>`), `tjeneste: ${t}`);
  }
  assert.equal((h.match(/class="tjeneste-kort[\s"]/g) || []).length, 7, 'sju tjenestekort');
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
  const h = les('test/ut/stavanger/index.html');
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
