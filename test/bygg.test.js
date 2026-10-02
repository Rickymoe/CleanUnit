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
  assert.match(h, /class="side-footer__bylenke" href="stavanger\/">Gå til Clean Unit Stavanger →/);
  assert.match(h, /<span class="tittel-aksent">Renhold<\/span> i Oslo<\/h1>/);
  assert.match(h, /og:url" content="https:\/\/rickymoe\.github\.io\/CleanUnit\/"/);
  assert.match(h, /4,8 · 4 anmeldelser på Google/);
});

test('Stavanger: egen tittel, eget telefonnummer, lenke til Oslo i footeren', () => {
  const h = les('test/ut/stavanger/index.html');
  assert.match(h, /<title>Clean Unit – renhold i Stavanger<\/title>/);
  assert.match(h, /<body class="by--stavanger">/);
  assert.match(h, /href="tel:\+4790065009">Ring oss – 900 65 009/);
  assert.match(h, /class="side-footer__bylenke" href="\.\.\/">Gå til Clean Unit Oslo →/);
  assert.match(h, /<span class="tittel-aksent">Renhold<\/span> i Stavanger<\/h1>/);
  assert.match(h, /og:url" content="https:\/\/rickymoe\.github\.io\/CleanUnit\/stavanger\/"/);
  assert.doesNotMatch(h, /anmeldelser på Google/);
  assert.doesNotMatch(h, /Clean Unit har i dag over 100 ansatte, fordelt på kontoret i Nydalen/);
});

// Hero-variant «Vi kommer til deg» (2026-09-26): byene ut, kjøretøy + kundetyper inn.
// Kunden mente bysilhuettene leste som «vi holder bare til her».
test('Hero: rutebånd med de fire kundetypene og rekkevidde-linje', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f);
    assert.match(h, /<p class="hero__rekkevidde">Kontorer i Oslo og Stavanger\. Vi kjører dit du er\.<\/p>/, f);
    assert.match(h, /hero__rute-bil/, f);
    for (const stopp of ['Barnehager', 'Skoler', 'Kontorer', 'Bilforhandlere']) {
      assert.match(h, new RegExp(`hero__stopp-prikk"></span>${stopp}<`), `${f}: ${stopp}`);
    }
    // Båndet er rent dekorativt — kundetypene står også i ingressen
    assert.match(h, /<div class="hero__rute" aria-hidden="true">/, f);
  }
});

// Glansen (Ricky 2026-09-30). Tre behandlinger som alle legger hvitt lys på
// flater som allerede finnes — se --glans-*-tokensene i css/style.css. Testen
// finnes fordi ingen av dem har innhold å telle: forsvinner en av dem, feiler
// ingenting, siden ser bare annerledes ut. Det er samme stillhet som gjorde at
// de døde sti-lenkene kunne ligge uoppdaget i fire dager.
test('Glans: de tre behandlingene finnes i CSS-en', () => {
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
  // Speilet i bakken: -17,2 % er hjullinja uttrykt som prosent-margin mot
  // bilens bredde — samme konstant som boksens negative margin bruker.
  assert.match(css, /\.hero__rute-speil \{[\s\S]*?margin-top: -17\.2%;[\s\S]*?\}/,
    'speilet under bilen mangler forankringen i hjullinja');
  // Snuingen må ligge på bildet og masken på boksen rundt. Ligger begge på
  // samme element, speilvendes masken også, og speilet dør oppover i stedet
  // for nedover (målt i laben).
  assert.match(css, /\.hero__rute-speil img \{[^}]*scaleY\(-1\)/,
    'speilvendingen ligger ikke på bildet inni speilboksen');
  assert.match(css, /\.hero__rute-speil \{[^}]*mask-image/,
    'masken ligger ikke på speilboksen');
  // Den våte kanten øverst på den mørke flaten.
  assert.match(css, /\.stopp--tillit \{ padding-block: var\(--seksjon-y\); background: var\(--teal-mork\);/,
    'den mørke seksjonen er endret — glansen under må sjekkes på nytt');
  assert.match(css, /\.stopp--tillit::before \{/, 'den våte kanten mangler');
  assert.match(css, /\.stopp--tillit \.wrap \{ position: relative; z-index: 1; \}/,
    'innholdet løftes ikke over kanten — et hvitt slør ville spist av eyebrow-kontrasten');
});

test('Glans: speilet i heroen er en egen boks rundt bilen', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f);
    // Boksen må finnes: speilet forankres i hjullinja inne i den, og uten den
    // ville speilet hengt fra bilens underkant — 17,2 % av bilbredden for lavt.
    assert.match(h, /<div class="hero__rute-bil-boks">/, f);
    // Bredden og den negative marginen flyttet fra bilen til boksen, så
    // geometrien må fortsatt ligge der den plasserer bilen på linja.
    assert.match(les('css/style.css'), /\.hero__rute-bil-boks \{[\s\S]*?margin-bottom: calc\(1\.6rem - 0\.172 \* var\(--bil-b\)\)/,
      'bilens plassering på linja ligger ikke på boksen');
    const hero = h.slice(h.indexOf('<div class="hero__rute"'), h.indexOf('hero__stopp-rad'));
    const biler = [...hero.matchAll(/src="([^"]*bil\.(?:png|webp))"/g)].map((m) => m[1]);
    assert.equal(biler.length, 2, `${f}: heroen skal ha bilen og ett speil`);
    // Speilet er en kopi av bilen — ingen ny nettverkshenting — men det MÅ
    // være samme fil: byttes bildet i den ene og ikke den andre, står det et
    // speil av en annen bil under den.
    assert.equal(biler[0], biler[1], `${f}: speilet viser ikke samme bilde som bilen`);
    const speil = hero.slice(hero.indexOf('hero__rute-speil'), hero.indexOf('hero__stopp-rad'));
    // Hele båndet er aria-hidden, så speilet skal ikke ha noe å lese opp.
    assert.match(speil, /alt=""/, f);
    assert.doesNotMatch(speil, /aria-label|alt="[^"]+/, `${f}: speilet har fått et innhold`);
  }
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

// Byillustrasjonen (bilder/Byer.png) er tilbake som svak bakgrunn 2026-10-01
// (se .hero__by i css/style.css). Veinett-teppet (dekning-nett) er ute av
// heroen og lever bare i footeren; det gamle navngitte Oslo-kartet med
// kontor-markører skal fortsatt ikke komme tilbake.
test('Hero: byillustrasjonen er svak bakgrunn, uten veinett-teppe og navngitt bykart', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f);
    const hero = h.slice(h.indexOf('<header class="hero">'), h.indexOf('</header>'));
    assert.match(hero, /<div class="hero__by" aria-hidden="true">/, f);
    assert.match(hero, /bilder\/Byer\.(webp|png)/, f);
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
  assert.match(css, /--flaate-heng: calc\(0\.172 \* var\(--flaate-b\)\)/)
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

// «Renholderne er de viktigste» mistet vaskesveipet (Ricky, 2026-09-26: den
// står rett under flåten, og to animasjoner etter hverandre der ble for mye).
// Testen låser at sveipet bare er på «Tjenester»-overskriften, så en
// gjeninnsetting må være bevisst.
test('Bare «Tjenester»-overskriften har vaskesveip', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f)
    // Bare h2-elementer teller — ordet står også i en kommentar i kilden
    assert.equal((h.match(/<h2 data-vask/g) || []).length, 1, `${f}: antall h2 med data-vask`)
    assert.match(h, /<h2 data-vask>Renhold tilpasset stedet du driver<\/h2>/, f)
    assert.match(h, /<h2>Renholderne er de viktigste<\/h2>/, f)
    assert.doesNotMatch(h, /vask-boks"><h2[^>]*>Renholderne/, f)
  }
})

// Stien anker til eyebrow-en i hver seksjon (js/main.js). Endres id-ene eller
// eyebrow-klassen, forsvinner nodene i stillhet — derfor denne testen.
test('Stien: alle seksjonene den ankrer til finnes, med eyebrow', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f)
    for (const id of ['tjenester', 'referanser', 'hvorfor', 'om-oss', 'jobb-hos-oss', 'tilbud']) {
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
  const start = h.indexOf('id="tilbud"')
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
    assert.ok(seksjon, `${f}: mangler #tilbud`)
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
    assert.match(seksjon, new RegExp(`mailto:${epost.replace('.', '\\.')}`), `${f}: feilboksens fallback`)
    assert.match(seksjon, new RegExp(`name="_subject" value="Ny tilbudsforespørsel – ${by}"`), `${f}: emnefeltet`)
    // Feilboksens fallback må peke på EGET kontor — at Stavanger havner hos Oslo
    // er nettopp det hele to-skjemaer-oppsettet skal unngå.
    for (const annen of alle.filter((e) => e !== epost)) {
      assert.doesNotMatch(seksjon, new RegExp(`mailto:${annen.replace('.', '\\.')}`), `${f}: låner ${annen}`)
    }
  }
})

test('Tilbud: heroens sekundærknapp peker på #tilbud i begge byer', () => {
  for (const [f] of TILBUD_BYER) {
    assert.match(les(f), /<a class="knapp knapp--omriss" href="#tilbud">Be om tilbud<\/a>/, f)
  }
})

test('Tilbud: skjemaet har kvittering og feilboks', () => {
  for (const [f] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    assert.match(seksjon, /id="tilbud-kvittering"[^>]*hidden/, `${f}: kvitteringen`)
    assert.match(seksjon, /id="tilbud-feil"[^>]*role="alert"[^>]*hidden/, `${f}: feilboksen`)
  }
})

test('Tilbud: varselet om manglende Formspree-abonnement står synlig i skjemakortet', () => {
  for (const [f, , epost] of TILBUD_BYER) {
    const seksjon = tilbudSeksjon(les(f))
    const tag = seksjon.match(/<div class="skjema-varsel" id="tilbud-varsel"[^>]*>/)
    assert.ok(tag, `${f}: varselet mangler`)
    assert.doesNotMatch(tag[0], /hidden/, `${f}: varselet skal være synlig i markup`)
    // Det skal ligge inne i skjemakortet, ellers står det utenfor kortet det
    // forklarer, og det ville blitt en tredje grid-kolonne i .tilbud-layout.
    assert.ok(seksjon.indexOf('id="tilbud-varsel"') < seksjon.indexOf('</form>'),
      `${f}: varselet må ligge inne i skjemaet`)
    assert.match(seksjon, /Formspree-abonnement/, `${f}: teksten nevner ikke abonnementet`)
    assert.ok(seksjon.includes(`mailto:${epost}`), `${f}: varselet mangler ${epost}`)
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
  assert.match(js, /\['#tilbud', 'Be om tilbud'\]/, 'sti-noden mangler')
  assert.match(initKropp(js), /tilbudSkjema\(\)/, 'tilbudSkjema kalles ikke fra initSider()')
  // Gatingen: står plassholderen igjen, finnes ingen ID — da skal skjemaet
  // forbli skjult og seksjonen vise ring/e-post i stedet.
  assert.match(js, /includes\('%%FORMSPREE_ID%%'\)/, 'gatingen mot plassholderen mangler')
})

test('Tilbud: seksjonen fortsetter bakgrunnsvekslingen og har skjemastil', () => {
  const css = les('css/style.css')
  // #jobb-hos-oss slutter på --base, så neste seksjon skal være --teal-lys —
  // samme veksling som resten av siden (flate / teal-lys / base / teal-lys / base).
  assert.match(css, /\n\.stopp--tilbud \{ padding-block: var\(--seksjon-y\); background: var\(--teal-lys\); \}/)
  assert.match(css, /\.tilbud-layout \{/, 'layout-grid mangler')
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
