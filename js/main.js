export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  logoAnimer(reduksjon)
  overskriftVask(reduksjon)
  tjenesteBobler(reduksjon)
  kortReveal(reduksjon)
  plasserVannmerke()
  addEventListener('resize', debounce(plasserVannmerke, 150))
}

// Vannmerke-kartets vertikale posisjon på mobil kan IKKE regnes ut med ren
// CSS-prosent — prøvd (top:50%/transform-Y% relativt til .hero__innhold sin
// egen høyde), men testet med getBoundingClientRect() over flere skjerm-
// høyder: forholdet mellom vurderingens bunn og .hero__innhold sin topp
// varierer fra -12px til +147px avhengig av skjermhøyde (justify-
// content:center + min-height:88vh + .hero__innhold sin margin-top spiller
// sammen på en måte som ikke er en stabil prosent). Målte i stedet de EKTE,
// ferdig-layoutede posisjonene og plasserer vannmerket sånn at det ALDRI
// overlapper logo/vurdering, uansett skjermhøyde — rotårsaken til en
// flimre-bug Ricky fant på ekte mobil, 2026-09-19: "'CLEANUNIT' snur fint,
// men så flimrer 'LEANUNIT' ... Jeg tror det har noe med at vannmerket nå
// ligger bak logo." (kartets maskerte boks lå delvis oppå de fortsatt
// animerende bokstavene). Kun mobil — desktop bruker fortsatt den enkle
// CSS-sentreringen i style.css, urørt.
function plasserVannmerke() {
  const vannmerke = document.querySelector('.hero__kart-vannmerke')
  const vurdering = document.querySelector('.hero__vurdering')
  const innhold = document.querySelector('.hero__innhold')
  if (!vannmerke || !vurdering || !innhold) return
  if (!matchMedia('(max-width: 40rem)').matches) {
    vannmerke.style.top = ''
    vannmerke.style.transform = ''
    return
  }
  const innholdTop = innhold.getBoundingClientRect().top
  const trygMargin = 8
  const topPunkt = vurdering.getBoundingClientRect().bottom - innholdTop + trygMargin
  vannmerke.style.top = Math.max(topPunkt, 0) + 'px'
  vannmerke.style.transform = 'translateX(-50%)'
}

function debounce(fn, ms) {
  let timer
  return function (...args) {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), ms)
  }
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

// Logoen i heroen: hele ordmerket avsløres i ett sveip fra venstre («Vask», ren
// CSS-animasjon på .logo.kjor — se style.css), mens noen skumbobler dukker opp
// akkurat der sveipet er og stiger/popper. Kjører med en gang siden heroen
// alltid er synlig ved sidelast (ikke scroll-styrt). Reduced-motion viser
// sluttresultatet direkte via CSS — ingenting å gjøre her i så fall.
//
// LOGO_VARIGHET_MS må være lik varigheten på CSS-animasjonen (logo-sveipet i
// style.css), siden boblene plasseres og tidsforskyves etter den.
const LOGO_VARIGHET_MS = 1560
const BOBLE_ANTALL = 12

function logoAnimer(reduksjon) {
  if (reduksjon) return
  const logo = document.querySelector('.hero .logo')
  if (!logo) return
  logo.classList.add('kjor')
  lagSkumBobler(logo, {
    antall: BOBLE_ANTALL, varighetMs: LOGO_VARIGHET_MS,
    skala: parseFloat(getComputedStyle(logo).fontSize) / 96,
  })
}

// Samme kurve som CSS-sveipet (cubic-bezier(.5, 0, .2, 1)): gir hvor langt
// sveipet har kommet (0-1) etter en gitt andel av tiden — så hver boble kan
// plasseres presist i sveipkanten i det øyeblikket den dukker opp.
function sveipKurve(t) {
  const x1 = 0.5, y1 = 0, x2 = 0.2, y2 = 1
  let lo = 0, hi = 1, s = t
  for (let i = 0; i < 30; i++) {
    const bx = 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s
    if (bx < t) lo = s
    else hi = s
    s = (lo + hi) / 2
  }
  return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s
}

// Skumboblene har tilfeldig størrelse/tempo/drift. Alt legges i ett .bobler-lag
// som fjernes igjen når den siste boblen er poppet — siden ender helt rolig.
// Forsvinner under reduced-motion (se style.css). Brukes både av heroens logo
// og av seksjonsoverskriftene (se overskriftVask), derfor generell:
//   kilde      elementet som sveipes (bobler plasseres langs bredden hans)
//   antall     antall bobler
//   varighetMs sveipets varighet (boblene dukker opp i sveipkanten underveis)
//   skala      størrelses-/driftfaktor (verkstedet var satt opp for 96px tekst)
// Boblelaget legges i nærmeste .hero__lockup/.vask-boks — utenfor kilden, som
// er klippet av clip-path og ellers ville tatt boblene med seg.
function nyBoble(x, y, storrelse, forsinkelse, varighet, rise, dx) {
  const boble = document.createElement('span')
  boble.className = 'boble'
  boble.style.cssText =
    `left:${x - storrelse / 2}px;top:${y - storrelse / 2}px;` +
    `width:${storrelse}px;height:${storrelse}px;` +
    `--bdelay:${forsinkelse}ms;--bd:${varighet}ms;--rise:${rise}px;--dx:${dx}px`
  return boble
}

function lagSkumBobler(kilde, { antall, varighetMs, skala }) {
  const boks = kilde.closest('.hero__lockup, .vask-boks')
  if (!boks) return
  const tilfeldig = (a, b) => a + Math.random() * (b - a)
  const l = boks.getBoundingClientRect()
  const o = kilde.getBoundingClientRect()
  const lag = document.createElement('span')
  lag.className = 'bobler'
  lag.setAttribute('aria-hidden', 'true')
  let slutt = 0
  for (let i = 0; i < antall; i++) {
    const t = Math.random()
    const storrelse = tilfeldig(8, 26) * skala
    const forsinkelse = t * varighetMs
    const varighet = tilfeldig(1500, 2600)
    const x = o.left - l.left + sveipKurve(t) * o.width + tilfeldig(-6, 6) * skala
    const y = o.top - l.top + tilfeldig(0.25, 0.95) * o.height
    const boble = nyBoble(
      x, y, storrelse, forsinkelse, varighet,
      -tilfeldig(35, 110) * skala, tilfeldig(-10, 10) * skala
    )
    lag.appendChild(boble)
    slutt = Math.max(slutt, forsinkelse + varighet)
  }
  boks.appendChild(lag)
  setTimeout(() => lag.remove(), slutt + 300)
}

// Seksjonsoverskrifter med data-vask får samme sveip + skumbobler som heroens
// logo når de scrolles inn i synsfeltet — én gang per overskrift. .kjor
// starter CSS-sveipet (se style.css).
//
// VIKTIG: observeren følger .vask-boks rundt overskriften, IKKE selve h2-en.
// h2-en er klippet av clip-path (inset ...100%) til den avsløres, og Chrome
// regner da synlig areal som 0 (intersectionRatio 0, målt) — terskelen nås
// aldri og overskriften ville blitt stående skjult for alltid. Boksen er like
// stor som overskriften (fit-content) men uklippet.
//
// Skjulingen (html.js-vask i style.css) slås først PÅ her, når vi vet at
// observeren faktisk kommer til å avsløre overskriften. Kjører ikke denne
// koden (gammel cachet main.js, ingen IntersectionObserver, reduced-motion)
// forblir overskriftene synlige — de kan aldri bli stående skjult.
const OVERSKRIFT_VARIGHET_MS = 950
const OVERSKRIFT_BOBLER = 7
const OVERSKRIFT_SKALA = 0.6

function overskriftVask(reduksjon) {
  if (reduksjon || !('IntersectionObserver' in window)) return
  const overskrifter = document.querySelectorAll('.vask-boks > [data-vask]')
  if (!overskrifter.length) return
  document.documentElement.classList.add('js-vask')
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const boks = entry.target
        const el = boks.querySelector('[data-vask]')
        observer.unobserve(boks)
        if (!el) return
        el.classList.add('kjor')
        lagSkumBobler(el, {
          antall: OVERSKRIFT_BOBLER, varighetMs: OVERSKRIFT_VARIGHET_MS,
          skala: OVERSKRIFT_SKALA,
        })
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.6 }
  )
  overskrifter.forEach((el) => observer.observe(el.parentElement))
}

// Tjenestekortene: en liten byge bobler stiger opp fra ikonet når man holder
// musen over kortet (eller trykker på det på berøringsskjerm) — som om noe
// nettopp er vasket. KUN de seks kortene i «Tjenester» (Ricky, 2026-09-21) —
// avgrenset med #tjenester, siden .tjeneste-kort også brukes til ansattsitatene
// i «Jobb hos oss».
// Mus: pointerenter. Berøring: click (ikke pointerenter/-down, som også
// fyrer når fingeren bare starter en scrolling over kortet). En pause per
// kort hindrer at boblene hoper seg opp ved rask frem-og-tilbake-musing.
// Lagret fjernes når siste boble er poppet. Ingen bobler under reduced-motion
// (skjult i CSS, og vi hopper over her for å spare arbeid).
const KORT_BOBLER = 6
const KORT_PAUSE_MS = 1800

function tjenesteBobler(reduksjon) {
  if (reduksjon) return
  const tilfeldig = (a, b) => a + Math.random() * (b - a)
  document.querySelectorAll('#tjenester .tjeneste-kort').forEach((kort) => {
    const ikon = kort.querySelector('.tjeneste-kort__ikon')
    if (!ikon) return
    let pause = false
    const byge = () => {
      if (pause) return
      pause = true
      setTimeout(() => { pause = false }, KORT_PAUSE_MS)
      const k = kort.getBoundingClientRect()
      const i = ikon.getBoundingClientRect()
      const lag = document.createElement('span')
      lag.className = 'bobler'
      lag.setAttribute('aria-hidden', 'true')
      let slutt = 0
      for (let n = 0; n < KORT_BOBLER; n++) {
        const forsinkelse = tilfeldig(0, 380)
        const varighet = tilfeldig(1300, 2200)
        lag.appendChild(nyBoble(
          i.left - k.left + i.width / 2 + tilfeldig(-0.7, 0.7) * i.width,
          i.top - k.top + i.height * tilfeldig(0.1, 0.6),
          tilfeldig(6, 16), forsinkelse, varighet,
          -tilfeldig(45, 120), tilfeldig(-14, 14)
        ))
        slutt = Math.max(slutt, forsinkelse + varighet)
      }
      kort.appendChild(lag)
      setTimeout(() => lag.remove(), slutt + 300)
    }
    kort.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') byge() })
    kort.addEventListener('click', byge)
  })
}
