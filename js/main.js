export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  logoAnimer(reduksjon)
  overskriftVask(reduksjon)
  tjenesteBobler(reduksjon)
  kortReveal(reduksjon)
  flaateInn(reduksjon)
  stiNedover(reduksjon)
  tilbudSkjema()
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

// Flåten i «Om oss» kjører inn når den er på vei inn i bildet (Ricky,
// 2026-09-26: «en animasjon når de 4 bilene viser seg»). Selve sekvensen er
// ren CSS (html.js .flaate--inne i style.css) — her settes bare klassen, én
// gang, som .js-reveal gjør for kortene. Klassen MÅ komme: uten den står
// bilene stille én bilbredde til venstre for plassen sin og hjulene treffer aldri
// veien, så observeren kobles fra først når den har fyrt. Er flåten allerede
// synlig ved sidelast, fyrer IntersectionObserver med en gang.
function flaateInn(reduksjon) {
  const flaate = document.querySelector('.flaate')
  if (reduksjon || !flaate) return
  if (!('IntersectionObserver' in window)) {
    flaate.classList.add('flaate--inne')
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        flaate.classList.add('flaate--inne')
        observer.disconnect()
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.25 }
  )
  observer.observe(flaate)
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

// Christopher ville at noen av de siste boblene — de som dukker opp rundt «T»-en
// i UNIT — skal fortsette litt høyere opp enn resten (2026-09-27). Løftet rampes
// inn over de siste 85 % av sveipet, slik at stigningen øker jevnt mot høyre i
// ordmerket i stedet for å hoppe. Verdiene er valgt av Ricky i en slider-lab:
// ved full rampe stiger de største boblene 3,0x — målt 100–198 px mot 33–103 px
// før, i et vindu på ~900 px høyde (taket under gjør forskjellen mindre i lave
// vinduer), med 550 ms ekstra levetid så de rekker å vises før de popper.
//
// Taket er lufta over ordmerket ganger 0,8: heroen har overflow:hidden, og en
// boble som stiger forbi toppen blir kuttet midt på. Taket skalerer med
// vindushøyden (målt 131 px ved 726 px vindu, 203 px ved 913, 361 px ved 1313),
// så en høy skjerm gir mer å gå på. Det skal aldri gjøre en boble KORTERE enn
// den er i dag — derfor Math.max(grunn, tak): på et lavt vindu hvor taket er
// mindre enn dagens stigning, står boblen stille i stedet for å krympe.
const BOBLE_LOFT = 2.0        // ekstra stigning ved t = 1 (2.0 = 3,0x)
const BOBLE_LOFT_FRA = 0.15   // rampen starter her (0.15 = de siste 85 %)
const BOBLE_EKSTRA_MS = 550   // de løftede boblene lever så mye lenger
const BOBLE_LOFT_TAK = 0.8    // andel av lufta over ordmerket som kan brukes

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
//
// Løftet (BOBLE_LOFT) gjelder bare i heroen: det er der ordmerket med «T»-en
// står, og bare der er det luft over boblen å stige i. Seksjonsoverskriftene
// beholder dagens oppførsel.
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
  const hero = kilde.closest('.hero')
  const romOver = hero ? l.top - hero.getBoundingClientRect().top : 0
  const tak = romOver * BOBLE_LOFT_TAK
  let slutt = 0
  for (let i = 0; i < antall; i++) {
    const t = Math.random()
    const storrelse = tilfeldig(8, 26) * skala
    const forsinkelse = t * varighetMs
    const rampe = hero ? Math.max(0, (t - BOBLE_LOFT_FRA) / (1 - BOBLE_LOFT_FRA)) : 0
    const grunn = tilfeldig(35, 110) * skala
    const stigning = Math.min(grunn * (1 + BOBLE_LOFT * rampe), Math.max(grunn, tak))
    const varighet = tilfeldig(1500, 2600) + BOBLE_EKSTRA_MS * rampe
    const x = o.left - l.left + sveipKurve(t) * o.width + tilfeldig(-6, 6) * skala
    const y = o.top - l.top + tilfeldig(0.25, 0.95) * o.height
    const boble = nyBoble(
      x, y, storrelse, forsinkelse, varighet,
      -stigning, tilfeldig(-10, 10) * skala
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

/* ── Stien nedover siden ─────────────────────────────────────────────────
   Arver grepet fra X7 (js/path.js der): én absolutt plassert SVG over hele
   ruten, én node per seksjon, og linja tegnes etter hvert som man scroller
   (stroke-dashoffset med «høyvann» — den tegnes aldri tilbake når man
   scroller opp, så siden ser ut som en rute man har kjørt, ikke en
   fremdriftsmåler som hopper). Ricky, 2026-09-26: «Vi benytter en "Sti"
   nedover på flere sider ... Vi kan bruke det som inspirasjon.»

   To ting er gjort annerledes enn i X7:
   1) Linja starter ikke i tom luft, men PÅ veilinja i heroen: den samme
      linja fortsetter til venstre for bilen, tar en 90° sving i
      venstremargen og blir ryggraden ned til footer-kanten. Derfor rører
      dette ikke .hero__rute-linje i det hele tatt — den står urørt fra
      venstrekanten av stoppraden, og SVG-en tegner fortsettelsen bortover
      og ned. (Ricky valgte denne varianten, «s2».)
   2) Nodene er ekte <a href="#seksjon">-lenker inni SVG-en, ikke en
      klikk-lytter på en sirkel. Da virker høyreklikk, midtklikk, Tab og
      skjermleser gratis — og siden har ingen annen navigasjon.

   Alt tegnes herfra: uten JS finnes det ingen SVG, ingen halvferdig sti og
   ingenting å rydde opp. reduced-motion: linja står ferdig tegnet.
   Geometrien måles på nytt ved resize og når fontene er klare (høydene
   endrer seg når Quicksand bytter ut fallback-fonten). */
const STI_SEKSJONER = [
  ['#tjenester', 'Tjenester'],
  ['#referanser', 'Referanser'],
  ['#hvorfor', 'Hvorfor Clean Unit'],
  ['#om-oss', 'Om oss'],
  ['#jobb-hos-oss', 'Jobb hos oss'],
  ['#tilbud', 'Be om tilbud'],
]

function stiNedover(reduksjon) {
  const rad = document.querySelector('.hero__stopp-rad')
  const linje = document.querySelector('.hero__rute-linje')
  const hero = document.querySelector('.hero')
  const footer = document.querySelector('.side-footer')
  if (!rad || !linje || !hero || !footer) return

  const NS = 'http://www.w3.org/2000/svg'
  const mobil = () => innerWidth < 48 * 16
  let svg = null

  let bane = null, lengde = 0, hoyvann = 0, topp = 0, bunn = 0, noder = []

  // X: 26 px til venstre for der seksjonsteksten begynner — det er margen som
  // faktisk finnes. Målt mot eyebrow-en (samme element nodene ankrer til), ikke
  // mot .wrap: ved 768–1024 px er .wrap like bredt som vinduet, så wrap.left
  // alene ga x = 4,7 px og bare ~5 px klaring til teksten. Gulvet på 9 px tar
  // de smaleste desktop-breddene (rundt 768–900 px), der margen er tynn.
  function xSti() {
    const rubrikk = document.querySelector('#tjenester .eyebrow')
    if (!rubrikk) return 24
    return Math.max(9, Math.min(150, Math.round(rubrikk.getBoundingClientRect().left) - 26))
  }

  function bygg() {
    // Stien er droppet på mobil (Ricky, 2026-09-30). Grunnen er målt, ikke
    // smak: under 48rem finnes det ingen margin å tegne i. .wrap har 16–19 px
    // padding, så stien lå på x = 9 (kurven svingte ut til 2–8 og ble klippet
    // av skjermkanten) mens kortene begynte på x = 16. 1,5 px strek på 50 %
    // opasitet ga 2:1 kontrast på lyst og 1,25:1 på den mørke «Hvorfor»-flaten,
    // og treff-sirkelen på 36 px lå 9 px utenfor skjermen. Den bar altså ingen
    // navigasjon der — bare en hårstrek i det som er kortenes pusterom.
    // Vi lager den ikke i det hele tatt, så det ikke står igjen en tom SVG.
    if (mobil()) {
      if (svg) { svg.remove(); svg = null }
      bane = null; lengde = 0; noder = []
      return
    }
    if (!svg) {
      svg = document.createElementNS(NS, 'svg')
      svg.setAttribute('class', 'sti')
      svg.setAttribute('role', 'navigation')
      svg.setAttribute('aria-label', 'Hopp til seksjon')
      document.body.appendChild(svg)
    }
    const scroll = scrollY
    const ruteRekt = rad.getBoundingClientRect()
    const linjeRekt = linje.getBoundingClientRect()
    const footerRekt = footer.getBoundingClientRect()
    // Stien begynner på veilinja i heroen (der hjørnet er) — den fortsetter
    // den, i stedet for å starte i tomme lufta over første seksjon.
    topp = Math.round(linjeRekt.top + linjeRekt.height / 2 + scroll)
    bunn = Math.round(footerRekt.top + scroll)
    const x = xSti()
    const rPrikk = 6

    // Hvor ligger SVG-ens eget nullpunkt? (body er ikke posisjonert, så det
    // er dokumentets topp — men vi måler i stedet for å anta, så stien treffer
    // veilinja uansett hva som måtte endre seg.)
    svg.style.top = '0px'
    const nullpunkt = svg.getBoundingClientRect().top + scroll
    svg.style.top = (topp - nullpunkt) + 'px'
    svg.style.height = (bunn - topp) + 'px'
    const bredde = Math.round(svg.getBoundingClientRect().width)
    svg.setAttribute('viewBox', `0 0 ${bredde} ${bunn - topp}`)
    svg.replaceChildren()

    // Nodene festes til eyebrow-en i hver seksjon — den står først i hver av
    // dem, og er der øyet allerede lander når man kommer dit.
    noder = STI_SEKSJONER.map(([sel, navn]) => {
      const rubrikk = document.querySelector(sel + ' .eyebrow')
      if (!rubrikk) return null
      const r = rubrikk.getBoundingClientRect()
      return { y: Math.round(r.top + scroll + r.height / 2), navn, sel }
    }).filter(Boolean)

    // Mild meander mot venstre mellom nodene — samme grep som X7. Bulken
    // skalerer med avstanden til kanten, så stien ikke svinger bredere enn
    // det er plass til.
    const bulk = Math.max(9, Math.min(40, x * 0.38))
    // Hjørnet: fra der heroens veilinje begynner (stoppradens venstrekant),
    // bortover til margen og ned. Møtes i samme punkt, så det ser ut som
    // én linje — dash-mønsteret kan ha litt ulik fase i skjøten.
    let d = `M ${Math.round(ruteRekt.left)} 0 L ${x + 8} 0 Q ${x} 0 ${x} 14`
    let fy = 14
    for (const n of noder) {
      const dy = n.y - fy
      d += ` C ${x - bulk} ${fy + dy * 0.35}, ${x - bulk} ${fy + dy * 0.65}, ${x} ${n.y}`
      fy = n.y
    }

    // Siste etappe: forbi siste node og helt ned til footer-kanten. Linja
    // sluttet før på eyebrow-en til siste seksjon, men SVG-en er høy til
    // footerens overkant — så det siste stykket ble aldri tegnet. Det var
    // usynlig så lenge «Jobb hos oss» var siste node (kort avstand ned til
    // footeren), men da #tilbud med skjemaet kom i mellom (Ricky,
    // 2026-09-27), ble gapet 1067 px: stien hang løst i lufta midt i en tom
    // venstremarg. Målt likt på 981/1100/1280/1440/1912 px (1066–1067 px) og
    // større på mobil (1321 px ved 500 px), altså uavhengig av bredde. Samme
    // kurveform som mellom nodene, så rytmen i meanderen holdes.
    const slutt = bunn - topp
    if (slutt > fy) {
      const dy = slutt - fy
      d += ` C ${x - bulk} ${fy + dy * 0.35}, ${x - bulk} ${fy + dy * 0.65}, ${x} ${slutt}`
    }

    bane = document.createElementNS(NS, 'path')
    bane.setAttribute('class', 'sti__linje')
    bane.setAttribute('d', d)
    bane.setAttribute('stroke-width', 2)
    svg.appendChild(bane)
    lengde = bane.getTotalLength()

    for (const n of noder) {
      const a = document.createElementNS(NS, 'a')
      a.setAttribute('class', 'sti__lenke')
      a.setAttribute('href', n.sel)
      a.setAttribute('aria-label', n.navn)
      const tittel = document.createElementNS(NS, 'title')
      tittel.textContent = n.navn
      const treff = document.createElementNS(NS, 'circle')   // usynlig, 36 px treff-flate
      treff.setAttribute('class', 'sti__treff')
      treff.setAttribute('cx', x)
      treff.setAttribute('cy', n.y)
      treff.setAttribute('r', 18)
      const prikk = document.createElementNS(NS, 'circle')
      prikk.setAttribute('class', 'sti__node')
      prikk.setAttribute('cx', x)
      prikk.setAttribute('cy', n.y)
      prikk.setAttribute('r', rPrikk)
      const navn = document.createElementNS(NS, 'text')       // vises kun ved tastaturfokus
      navn.setAttribute('class', 'sti__navn')
      navn.setAttribute('x', x + 14)
      navn.setAttribute('y', n.y + 4)
      navn.textContent = n.navn
      a.append(tittel, treff, prikk, navn)
      svg.appendChild(a)
      n.el = prikk
    }
    tegn()
  }

  function tegn() {
    if (!bane) return
    const vindu = innerHeight
    const spenn = Math.max(1, bunn - topp)
    if (reduksjon) {
      hoyvann = 1
    } else {
      // Vist bunn = 2/3 ned i vinduet: linja er tegnet dit man har kommet,
      // ikke dit man ser.
      let framdrift = (scrollY + vindu * 0.66 - topp) / spenn
      // Første etappe tegnes alltid, ellers ville stien mangle helt på
      // toppen av siden og dukke opp først ved første scroll — da henger
      // den ikke sammen med veilinja i heroen.
      const forsteNode = noder.length ? noder[0].y / spenn : 0
      framdrift = Math.max(0, Math.min(1, framdrift), forsteNode)
      hoyvann = Math.max(hoyvann, framdrift)
    }
    bane.style.strokeDashoffset = (lengde * (1 - hoyvann)) + 'px'

    // Aktuell seksjon = den noden som er nærmest midten av vinduet.
    const midt = scrollY + vindu / 2
    let nermest = null, minst = Infinity
    for (const n of noder) {
      const avstand = Math.abs(topp + n.y - midt)
      if (avstand < minst) { minst = avstand; nermest = n }
    }
    for (const n of noder) {
      if (n.el) n.el.classList.toggle('sti__node--aktiv', n === nermest)
    }
  }

  bygg()
  let venter = false
  addEventListener('scroll', () => {
    if (venter) return
    venter = true
    requestAnimationFrame(() => { venter = false; tegn() })
  }, { passive: true })
  addEventListener('resize', debounce(() => { hoyvann = reduksjon ? 1 : 0; bygg() }, 150))
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { hoyvann = reduksjon ? 1 : 0; bygg() })
  }
}

/* Tilbudsskjemaet (2026-09-27). Kilden har %%FORMSPREE_ID%% som plassholder, og
   deploy-workflowen bytter den mot en ekte ID fra secrets (FORMSPREE_ID_OSLO /
   FORMSPREE_ID_STAVANGER). Er plassholderen fortsatt der — lokal kjøring, eller
   en deploy der hemmeligheten ikke er satt — finnes det ingen mottaker.

   Skjemaet VISES likevel (Ricky, 2026-09-27: seksjonen skal se ferdig ut før
   abonnementet er på plass). Da må ingenting kunne sendes: send-knappen er
   `disabled` i markup, varselet øverst i kortet forklarer hvorfor, og vi
   kobler ikke på innsendingen i det hele tatt før ID-en finnes. Vi fanger
   likevel submit og stopper den, så Enter i et felt ikke laster siden på nytt.

   Selve innsendingen følger mønsteret fra Kuvaas: POST til Formspree med
   FormData og Accept: application/json, tre tilstander (skjema / kvittering /
   feilboks med ring-og-e-post-fallback). Formspree bruker feltet som heter
   «email» som svar-til-adresse, derfor heter e-postfeltet det og ikke «epost». */
function tilbudSkjema() {
  const skjema = document.getElementById('tilbud-skjema')
  if (!skjema) return

  const knapp = skjema.querySelector('button[type="submit"]')
  const feil = document.getElementById('tilbud-feil')
  const kvittering = document.getElementById('tilbud-kvittering')
  if (!knapp || !feil || !kvittering) return
  const knappTekst = knapp.textContent
  const varsel = document.getElementById('tilbud-varsel')

  const endepunkt = skjema.dataset.endpoint || ''
  const klar = endepunkt !== '' && !endepunkt.includes('%%FORMSPREE_ID%%')

  if (!klar) {
    // Ingen mottaker: skjemaet står synlig, men knappen forblir låst og
    // varselet står. Vi stopper innsendingen uansett, så Enter i et felt ikke
    // laster siden på nytt med skjemafelt som query-streng.
    skjema.addEventListener('submit', (e) => e.preventDefault())
    return
  }

  knapp.disabled = false
  // Varselet om at abonnementet mangler er en intern melding som bare skal
  // stå så lenge skjemaet ikke virker. Nå virker det, så da går den ut.
  if (varsel) varsel.hidden = true

  skjema.addEventListener('submit', async (e) => {
    e.preventDefault()
    knapp.disabled = true
    knapp.textContent = 'Sender …'
    feil.hidden = true

    try {
      const svar = await fetch(endepunkt, {
        method: 'POST',
        body: new FormData(skjema),
        headers: { Accept: 'application/json' },
      })
      if (!svar.ok) throw new Error('server')

      skjema.hidden = true
      feil.hidden = true
      kvittering.hidden = false
      // Flytt fokus til kvitteringen, ellers står fokus igjen på en knapp som
      // nettopp forsvant. role="status" sørger for at den leses opp.
      kvittering.tabIndex = -1
      kvittering.focus()
    } catch {
      knapp.disabled = false
      knapp.textContent = knappTekst
      feil.hidden = false
    }
  })
}
