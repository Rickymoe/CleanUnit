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

function logoAnimer(reduksjon) {
  if (reduksjon) return
  const logo = document.querySelector('.hero__logo .logo')
  const bobler = document.querySelector('.hero__logo .bobler')
  if (!logo) return
  logo.classList.add('kjor')
  setTimeout(() => {
    if (bobler) bobler.classList.add('vist')
    markorStjerner(reduksjon)
  }, SNURR_TOTAL_MS + 80) // liten margin så siste bokstav garantert er ferdig tegnet
}

// Når logoen er ferdig: en liten stjerne glimter kort ved én og én
// bil-markør på kart-vannmerket, som en klokkeviser fra kl 1 til kl 6
// (se .kart-markor__stjerne i style.css). Én bil av gangen i en løpende
// stafett — aldri flere samtidig — så blikket trekkes rolig nedover mot
// kartet uten å stjele fokus fra overskrift/ingress. Kjører kontinuerlig
// så lenge siden er åpen; reduced-motion starter den aldri.
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
    i = (i + 1) % markorer.length
    setTimeout(neste, STJERNE_VARIGHET_MS + STJERNE_PAUSE_MS)
  }
  neste()
}
