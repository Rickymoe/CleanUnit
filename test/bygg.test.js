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
  assert.doesNotMatch(h, /Nydalen, Oslo har i dag 55 ansatte, og vi har i tillegg/);
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

test('Hero: verken bysilhuettene eller Oslo-kartet er med lenger', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f);
    assert.doesNotMatch(h, /hero__by/, f);
    assert.doesNotMatch(h, /hero-kart-vannmerke/, f);
    assert.match(h, /bilder\/dekning-nett\.(webp|png)/, f);
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

// Stien anker til eyebrow-en i hver seksjon (js/main.js). Endres id-ene eller
// eyebrow-klassen, forsvinner nodene i stillhet — derfor denne testen.
test('Stien: alle seksjonene den ankrer til finnes, med eyebrow', () => {
  for (const f of ['test/ut/index.html', 'test/ut/stavanger/index.html']) {
    const h = les(f)
    for (const id of ['tjenester', 'referanser', 'hvorfor', 'om-oss', 'jobb-hos-oss']) {
      const start = h.indexOf(`id="${id}"`)
      assert.ok(start > -1, `${f}: mangler #${id}`)
      const seksjon = h.slice(start, h.indexOf('</section>', start))
      assert.match(seksjon, /class="eyebrow"/, `${f}: #${id} mangler .eyebrow (stien ankrer til den)`)
    }
  }
})

test('Footer-vannmerket er samme veinett-teppe som heroen', () => {
  const css = les('css/style.css')
  const start = css.indexOf('.side-footer::before')
  const blokk = css.slice(start, css.indexOf('}', start))
  assert.match(blokk, /dekning-nett\.webp/)
  assert.match(blokk, /mix-blend-mode: screen/)
  // Oslo-kartet skal ikke lenger brukes noe sted i CSS-en
  assert.doesNotMatch(css, /hero-kart-vannmerke/)
})
