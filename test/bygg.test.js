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
