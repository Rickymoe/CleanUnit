export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  sveipAvdekk(reduksjon)
  logoAnimer(reduksjon)
  window.__sideKjort = true
}

// Logoen i heroen: først snurrer bokstavene («mynt-flip») inn én etter én.
// Når ALLE bokstavene er ferdig, dukker tre faste bobler opp over "I"-en —
// ingen bevegelse, bare en enkel opacity-overgang. Funnet i lab-logo.html,
// forenklet etter Rickys ønske (den reisende boble-animasjonen er fjernet).
// Kjører med en gang siden heroen alltid er synlig ved sidelast (ikke
// scroll-styrt som .seksjon__sveip). Reduced-motion viser sluttresultatet
// direkte via CSS — ingenting å gjøre her i så fall.
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
  }, SNURR_TOTAL_MS + 80) // liten margin så siste bokstav garantert er ferdig tegnet
}

// Hver .seksjon starter dekket av sin .seksjon__sveip-overlay. Når seksjonen
// scrolles inn i syne, sveipes overlayen bort — det gjennomgående signaturgrepet.
function sveipAvdekk(reduksjon) {
  const seksjoner = [...document.querySelectorAll('.seksjon')]
  if (reduksjon || !('IntersectionObserver' in window)) {
    seksjoner.forEach(s => s.classList.add('sveipt'))
    return
  }
  const io = new IntersectionObserver((poster) => {
    for (const p of poster) {
      if (p.isIntersecting) { p.target.classList.add('sveipt'); io.unobserve(p.target) }
    }
  }, { threshold: 0.2 })
  seksjoner.forEach(s => io.observe(s))
}
