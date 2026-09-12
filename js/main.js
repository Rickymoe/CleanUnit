export function initSider() {
  const reduksjon = matchMedia('(prefers-reduced-motion: reduce)').matches
  sveipAvdekk(reduksjon)
  // Task 3-6 legger til flere init-funksjoner her
  window.__sideKjort = true
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
