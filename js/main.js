export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  logoAnimer(reduksjon)
  window.__sideKjort = true
}

// Logoen i heroen: først snurrer bokstavene («mynt-flip») inn én etter én.
// Når ALLE bokstavene er ferdig, dukker tre faste bobler opp over "I"-en —
// ingen bevegelse, bare en enkel opacity-overgang. Funnet i lab-logo.html,
// forenklet etter Rickys ønske (den reisende boble-animasjonen er fjernet).
// Kjører med en gang siden heroen alltid er synlig ved sidelast (ikke
// scroll-styrt). Reduced-motion viser sluttresultatet direkte via CSS —
// ingenting å gjøre her i så fall.
//
// Rein setTimeout mot den samme, faste tidsberegningen som CSS-en bruker
// (ni bokstaver × 55ms forsinkelse + 550ms varighet på den siste) — ikke
// animationend/Web Animations API, som viste seg upålitelig (event kunne
// komme ute av synk, .finished-løftet kunne henge seg fast).
const BOKSTAV_VARIGHET_MS = 550
const BOKSTAV_FORSINKELSE_MS = 55
const ANTALL_BOKSTAVER = 9 // CLEANUNIT
const SNURR_TOTAL_MS = (ANTALL_BOKSTAVER - 1) * BOKSTAV_FORSINKELSE_MS + BOKSTAV_VARIGHET_MS

// De tre boblene (.boble--dott/--mork/--lys i style.css) dukker opp én og
// én via opacity-transition: siste boble (--lys) har transition-delay .5s
// og varighet .35s, altså 850ms fra .vist legges på til alle er synlige.
const BOBLE_SISTE_FORSINKELSE_MS = 500
const BOBLE_VARIGHET_MS = 350
const BOBLE_TOTAL_MS = BOBLE_SISTE_FORSINKELSE_MS + BOBLE_VARIGHET_MS

function logoAnimer(reduksjon) {
  if (reduksjon) return
  const logo = document.querySelector('.hero__logo .logo')
  const bobler = document.querySelector('.hero__logo .bobler')
  if (!logo) return
  logo.classList.add('kjor')
  setTimeout(() => {
    if (bobler) bobler.classList.add('vist')
    // Kart-stjerne-stafetten venter til boblene er helt ferdig med å dukke
    // opp, ikke bare til de starter — Ricky: begynn "nå de 3 boblene ... er
    // ferdig", ikke samtidig med dem.
    setTimeout(() => markorStjerner(reduksjon), BOBLE_TOTAL_MS)
  }, SNURR_TOTAL_MS + 80) // liten margin så siste bokstav garantert er ferdig tegnet
}

// Når logoen er ferdig: en liten stjerne glimter kort ved én og én
// bil-markør på kart-vannmerket, som en klokkeviser fra kl 1 til kl 6
// (se .kart-markor__stjerne i style.css). Én bil av gangen i en løpende
// stafett — aldri flere samtidig — så blikket trekkes rolig nedover mot
// kartet uten å stjele fokus fra overskrift/ingress. Kjører ÉN runde
// gjennom alle bilene og stopper — en evig loop ble flagget i design-
// kritikk som formålsløs bevegelse som aldri "blir ferdig", pluss at den
// fortsatte i bakgrunnen selv etter at man hadde scrollet forbi hero'en.
// reduced-motion starter den aldri.
const STJERNE_VARIGHET_MS = 1600
const STJERNE_PAUSE_MS = 350

function markorStjerner(reduksjon) {
  if (reduksjon) return
  const markorer = document.querySelectorAll('.kart-markor__stjerne')
  if (!markorer.length) return
  let i = 0
  function neste() {
    const stjerne = markorer[i]
    stjerne.classList.add('gnistrer')
    setTimeout(() => stjerne.classList.remove('gnistrer'), STJERNE_VARIGHET_MS)
    i += 1
    if (i < markorer.length) setTimeout(neste, STJERNE_VARIGHET_MS + STJERNE_PAUSE_MS)
  }
  neste()
}
