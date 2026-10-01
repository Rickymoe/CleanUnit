// Velg logo — velger valgkortet og speiler logoen i fire sammenhenger.
// Ingen avhengigheter. Valget huskes i localStorage; alle lesinger og
// skrivinger ligger i try/catch fordi lagring kan være blokkert (privat
// fane, strenge innstillinger) og siden skal virke uten.
(function () {
  'use strict';

  const NOKKEL = 'logovalg-v1';

  const radioer = Array.from(document.querySelectorAll('input[name="logo"]'));
  const spor = Array.from(document.querySelectorAll('[data-slot] .slot'));

  function lagre(valg) {
    try { localStorage.setItem(NOKKEL, JSON.stringify({ valg: valg })); } catch (e) { /* lagring er valgfritt */ }
  }
  function les() {
    try {
      const rå = localStorage.getItem(NOKKEL);
      return rå ? JSON.parse(rå) : null;
    } catch (e) { return null; }
  }

  function valgt() { return radioer.find(function (r) { return r.checked; }) || null; }

  // Logoen klones fra valgkortet, så preview og kort aldri kan avvike.
  function visLogo(r) {
    spor.forEach(function (s) {
      s.textContent = '';
      if (!r) return;
      const kilde = r.closest('.kort').querySelector('.lg');
      const kopi = kilde.cloneNode(true);
      kopi.setAttribute('role', 'img');
      kopi.setAttribute('aria-label', 'Logo ' + r.value + ': ' + r.dataset.navn);
      kopi.removeAttribute('aria-hidden');
      kopi.classList.remove('spill', 'fade');
      s.appendChild(kopi);
      spill(kopi, 0);
    });
  }


  // ---------- Bevegelse ----------
  // Sveipet og boblene er ren CSS (se logovalg.css, .spill). Her starter vi
  // dem på nytt og lager skumboblene til A (som ikke har egne bobler).
  // SVEIP_MS må være lik --sveip-ms i CSS: boblene tidsstilles etter det.
  const SVEIP_MS = 1300;
  const reduser = function () {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  };

  // Samme kurve som CSS-sveipet, så hver skumboble kan plasseres i sveipkanten
  // i øyeblikket den dukker opp.
  function sveipKurve(t) {
    const x1 = 0.5, y1 = 0, x2 = 0.2, y2 = 1;
    let lo = 0, hi = 1, s = t;
    for (let i = 0; i < 30; i++) {
      const bx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s;
      if (bx < t) lo = s; else hi = s;
      s = (lo + hi) / 2;
    }
    return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s;
  }

  const tilf = function (a, b) { return a + Math.random() * (b - a); };

  function skum(lg, start) {
    const bolk = lg.parentElement;
    Array.from(bolk.querySelectorAll(':scope > .skum-lag')).forEach(function (x) { x.remove(); });
    const v = bolk.getBoundingClientRect();
    const o = lg.getBoundingClientRect();
    const skala = Math.max(0.5, o.width / 480);
    const lag = document.createElement('span');
    lag.className = 'skum-lag';
    lag.setAttribute('aria-hidden', 'true');
    let slutt = 0;
    for (let i = 0; i < 7; i++) {
      const t = Math.random();
      const d = tilf(8, 22) * skala;
      const forsinkelse = start + t * SVEIP_MS;
      const varighet = tilf(1500, 2600);
      const x = o.left - v.left + sveipKurve(t) * o.width + tilf(-6, 6) * skala;
      const y = o.top - v.top + tilf(0.25, 0.95) * o.height;
      const b = document.createElement('span');
      b.className = 'skum';
      b.style.cssText = 'left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px;width:' + d + 'px;height:' + d +
        'px;--bdelay:' + forsinkelse + 'ms;--bd:' + varighet + 'ms;--rise:' + (-tilf(35, 90) * skala) +
        'px;--dx:' + (tilf(-10, 10) * skala) + 'px';
      lag.appendChild(b);
      slutt = Math.max(slutt, forsinkelse + varighet);
    }
    bolk.appendChild(lag);
    setTimeout(function () { lag.remove(); }, slutt + 300);
  }

  // Spiller av én logo. Fjerner klassen, tvinger omberegning og setter den på
  // igjen — det er det som starter CSS-animasjonen på nytt. Redusert bevegelse
  // gir bare en rolig fade.
  function spill(lg, start) {
    start = start || 0;
    lg.classList.remove('spill', 'fade');
    lg.style.setProperty('--start', start + 'ms');
    void lg.getBoundingClientRect();
    if (reduser()) { lg.classList.add('fade'); opptatt.set(lg, Date.now() + start + 800 + HOVER_ETTER_MS); return; }
    lg.classList.add('spill');
    if (lg.dataset.anim === 'skum') skum(lg, start);
    // Når den er ferdig (tilnærmet): sveip + bobler vokser inn (b0 + 2 x 170 + 750),
    // for A skumboblenes levetid. Brukes av hover-vernet under.
    const ferdig = lg.dataset.anim === 'skum' ? SVEIP_MS + 2600 : (lg.dataset.anim === 'sveip' ? SVEIP_MS : (parseFloat(getComputedStyle(lg).getPropertyValue('--b0')) || 1000) + 340 + 750);
    opptatt.set(lg, Date.now() + start + ferdig + HOVER_ETTER_MS);
  }

  // Hover: spiller av akkurat den logoens animasjon, uten å velge den. Kun med
  // ekte mus (hover: hover + pointer: fine, og pointerType mouse) — på berøring
  // blir hover «klistret» etter et trykk. Ny hover ignoreres til animasjonen er
  // ferdig + HOVER_ETTER_MS, ellers blinker den ved små musebevegelser.
  const HOVER_ETTER_MS = 300;
  const opptatt = new WeakMap();
  const harHover = function () {
    try { return window.matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) { return false; }
  };
  function hoverSpill(lg) {
    if (!lg) return;
    const til = opptatt.get(lg) || 0;
    if (Date.now() < til) return;
    spill(lg, 0);
  }
  function kobleHover(el, finnLogo) {
    el.addEventListener('pointerenter', function (e) {
      if (e.pointerType !== 'mouse' || !harHover()) return;
      hoverSpill(finnLogo());
    });
  }

  function spillKort(_, fra) {
    radioer.forEach(function (r, i) {
      spill(r.closest('.kortvrap').querySelector('.lg'), (fra || 0) + i * 110);
    });
  }
  function spillForhandsvisning() {
    Array.from(document.querySelectorAll('.slot .lg')).forEach(function (lg, i) { spill(lg, i * 90); });
  }

  function oppdater() {
    const r = valgt();
    visLogo(r);
  }

  radioer.forEach(function (r) {
    r.addEventListener('change', function () {
      oppdater();
      lagre(r.value);
    });
  });

  const lagret = les();
  if (lagret) {
    // Et lagret valg som ikke lenger finnes (en fjernet logo fra en tidligere
    // økt) behandles som «ikke valgt».
    const r = radioer.find(function (x) { return x.value === lagret.valg; });
    if (r) r.checked = true;
  }
  // Første visning: ikke alle kort samtidig. Ved redusert bevegelse vises de
  // ferdige logoene rett fram.
  if (!reduser()) spillKort(null, 150);
  oppdater();

  radioer.forEach(function (r) {
    const vrap = r.closest('.kortvrap');
    kobleHover(vrap, function () { return vrap.querySelector('.lg'); });
    // Tastaturalternativ: fokus fra tastatur (ikke fra et museklikk) spiller også.
    r.addEventListener('focus', function () {
      let tastatur = false;
      try { tastatur = r.matches(':focus-visible'); } catch (e) { /* eldre nettlesere */ }
      if (tastatur) hoverSpill(vrap.querySelector('.lg'));
    });
  });
  spor.forEach(function (s) {
    kobleHover(s, function () { return s.querySelector('.lg'); });
  });

  document.getElementById('spill-alle').addEventListener('click', function () {
    spillKort(null, 0);
    spillForhandsvisning();
  });
  Array.prototype.forEach.call(document.querySelectorAll('.spill-knapp'), function (k) {
    k.addEventListener('click', function () {
      spill(k.closest('.kortvrap').querySelector('.lg'), 0);
    });
  });
})();
