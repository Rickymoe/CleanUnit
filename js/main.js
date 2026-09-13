export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  logoAnimer(reduksjon)
  kortReveal(reduksjon)
  window.__sideKjort = true
}

// Kort dukker opp (fade + løft) etter hvert som de scrolles inn i synsfeltet
// — tjenestekort, sitatkort (Referanser + Jobb hos oss), tillitspunktene og
// foto-plassholderne i Om oss. .js-reveal legges på HER, ikke i HTML-en —
// dermed er elementene alltid synlige med en gang hvis dette scriptet aldri
// kjører (se kommentar i style.css). Fyrer bare én gang per kort: observer
// slutter å følge elementet så snart det er avslørt, ikke ved tilbake-
// scroll. reduced-motion legger aldri på klassen — CSS-en viser da alt
// direkte uansett, men vi sparer observeren unna arbeid den ikke trenger.
function kortReveal(reduksjon) {
  if (reduksjon) return
  const kort = document.querySelectorAll(
    '.tjeneste-kort, .sitat-kort, .tillit-liste > li, .om-foto-plassholder'
  )
  if (!kort.length) return
  if (!('IntersectionObserver' in window)) {
    kort.forEach((el) => el.classList.add('js-reveal', 'revealed'))
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.15 }
  )
  kort.forEach((el) => {
    el.classList.add('js-reveal')
    observer.observe(el)
  })
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
// (ni bokstaver × 75ms forsinkelse + 700ms varighet på den siste) — ikke
// animationend/Web Animations API, som viste seg upålitelig (event kunne
// komme ute av synk, .finished-løftet kunne henge seg fast).
const BOKSTAV_VARIGHET_MS = 780
const BOKSTAV_FORSINKELSE_MS = 85
const ANTALL_BOKSTAVER = 9 // CLEANUNIT
const SNURR_TOTAL_MS = (ANTALL_BOKSTAVER - 1) * BOKSTAV_FORSINKELSE_MS + BOKSTAV_VARIGHET_MS

// De tre boblene (.boble--dott/--mork/--lys i style.css) dukker opp SAMTIDIG
// via opacity-transition (var tidligere én-og-én med stigende delay, fjernet
// etter Ricky 2026-09-13: "de tre boblene over I, de må vises samtidig") —
// .35s varighet, ingen forsinkelse.
const BOBLE_VARIGHET_MS = 350
const BOBLE_TOTAL_MS = BOBLE_VARIGHET_MS

function logoAnimer(reduksjon) {
  if (reduksjon) return
  const logo = document.querySelector('.hero__logo .logo')
  const bobler = document.querySelector('.hero__logo .bobler')
  if (!logo) return
  logo.classList.add('kjor')
  setTimeout(() => {
    if (bobler) bobler.classList.add('vist')
    // Overskrift-lystenningen venter til boblene er helt ferdig med å dukke
    // opp, ikke bare til de starter — Ricky: begynn "nå de 3 boblene ...
    // er ferdig", ikke samtidig med dem.
    setTimeout(() => tittelLysTenn(reduksjon), BOBLE_TOTAL_MS)
  }, SNURR_TOTAL_MS + 80) // liten margin så siste bokstav garantert er ferdig tegnet
}

// "Renhold" i overskriften "tennes" fra grått (--logo-tekst-gra) til
// logoens turkis (--logo-tekst-turkis), med et dempet glødeskjær
// (.tittel-lys i style.css, samme mask-position-steps()-teknikk som
// Tuven-prosjektets logo/footer-merke). Resten av teksten ("i Oslo og
// Stavanger") er ikke med — Ricky, 2026-09-13: "Kun gjør det til og med
// 'Renhold'". Varighet/steg-antall skaleres med lengden på ordet (samme
// ms per bokstav) i stedet for å hardkodes, så det følger automatisk med
// hvis teksten i .tittel-lys noensinne endres. Ekte teksten under er
// alltid synlig/lesbar — dette er kun et dekorativt lag oppå. Kjører én
// gang og stopper (samme steps()-animasjon, ikke en loop).
const TITTEL_MS_PER_BOKSTAV = 90

function tittelLysTenn(reduksjon) {
  if (reduksjon) return
  const tittel = document.querySelector('.hero__tittel')
  if (!tittel) return
  const lys = tittel.querySelector('.tittel-lys')
  if (lys) {
    const lengde = lys.textContent.length
    lys.style.animationDuration = `${lengde * TITTEL_MS_PER_BOKSTAV}ms`
    lys.style.animationTimingFunction = `steps(${lengde})`
  }
  tittel.classList.add('tent')
}
