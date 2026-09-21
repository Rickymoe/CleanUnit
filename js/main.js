export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  logoAnimer(reduksjon)
  kortReveal(reduksjon)
  plasserVannmerke()
  addEventListener('resize', debounce(plasserVannmerke, 150))
  window.__sideKjort = true
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
// akkurat der sveipet er og stiger/popper. Når sveipet er ferdig, tennes
// "Renhold" i taglinen. Kjører med en gang siden heroen alltid er synlig ved
// sidelast (ikke scroll-styrt). Reduced-motion viser sluttresultatet direkte
// via CSS — ingenting å gjøre her i så fall.
//
// Rein setTimeout mot samme faste varighet som CSS-animasjonen — ikke
// animationend/Web Animations API, som viste seg upålitelig (event kunne
// komme ute av synk, .finished-løftet kunne henge seg fast).
const LOGO_VARIGHET_MS = 1560
const BOBLE_ANTALL = 12

function logoAnimer(reduksjon) {
  if (reduksjon) return
  const logo = document.querySelector('.hero .logo')
  if (!logo) return
  logo.classList.add('kjor')
  lagSkumBobler(logo)
  // liten margin så sveipet garantert er ferdig tegnet før "Renhold" tennes
  setTimeout(() => tittelLysTenn(reduksjon), LOGO_VARIGHET_MS + 80)
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

// Boblene har tilfeldig størrelse/tempo/drift, skalert med ordmerkets
// skriftstørrelse (verkstedet var satt opp for 96px). Alt legges i ett
// .bobler-lag som fjernes igjen når den siste boblen er poppet — siden ender
// helt rolig. Forsvinner under reduced-motion (se style.css).
function lagSkumBobler(logo) {
  const lockup = logo.closest('.hero__lockup')
  if (!lockup) return
  const tilfeldig = (a, b) => a + Math.random() * (b - a)
  const l = lockup.getBoundingClientRect()
  const o = logo.getBoundingClientRect()
  const skala = parseFloat(getComputedStyle(logo).fontSize) / 96
  const lag = document.createElement('span')
  lag.className = 'bobler'
  lag.setAttribute('aria-hidden', 'true')
  let slutt = 0
  for (let i = 0; i < BOBLE_ANTALL; i++) {
    const t = Math.random()
    const storrelse = tilfeldig(8, 26) * skala
    const forsinkelse = t * LOGO_VARIGHET_MS
    const varighet = tilfeldig(1500, 2600)
    const x = o.left - l.left + sveipKurve(t) * o.width + tilfeldig(-6, 6) * skala
    const y = o.top - l.top + tilfeldig(0.25, 0.95) * o.height
    const boble = document.createElement('span')
    boble.className = 'boble'
    boble.style.cssText =
      `left:${x - storrelse / 2}px;top:${y - storrelse / 2}px;` +
      `width:${storrelse}px;height:${storrelse}px;` +
      `--bdelay:${forsinkelse}ms;--bd:${varighet}ms;` +
      `--rise:${-tilfeldig(35, 110) * skala}px;--dx:${tilfeldig(-10, 10) * skala}px`
    lag.appendChild(boble)
    slutt = Math.max(slutt, forsinkelse + varighet)
  }
  lockup.appendChild(lag)
  setTimeout(() => lag.remove(), slutt + 300)
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
