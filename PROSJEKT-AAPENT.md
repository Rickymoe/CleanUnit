# Åpne punkter — CleanUnit-redesign

- [ ] Re-sertifiseringsdato/-fakta fra dagens «Aktuelt»-seksjon — hent eksakt
      tekst/dato før den brukes i «Hvorfor Clean Unit»-seksjonen (nå UTKAST).
- [ ] Ekte bilder (ansatte, biler, barnehager) — legges til når/hvis
      Marit/Christopher skaffer dem. Siden er bevisst bildeløs foreløpig.
- [ ] Domeneovergang til cleanunit.no — eget steg etter at de har sett
      rickymoe.github.io/CleanUnit.
- [ ] Cloudflare-analytics-beacon — legges inn rett før lansering, ikke nå.
- [ ] Bekreft telefon/e-post for begge kontorer stemmer (hentet fra dagens
      side 2026-09-12): Oslo 21 55 56 80 / renhold@cleanunit.no,
      Stavanger 900 65 009 / thord@cleanunit.no.
- [ ] Favicons og OG-bildet (`bilder/favicon-*.png`, `bilder/og-cleanunit.png`)
      er genererte, ensfargede plassholdere — erstattes med ekte
      logo-utsnitt når en høyoppløst Clean Unit-logo finnes.
- [ ] Ni av ti UTKAST-merkede tekstblokker i koden (hero-ingress, alle fire
      tjenestekort, tre av fire tillitspunkter, om-oss-teksten) er
      forfatterens egen tekst, ikke bekreftet med Marit/Christopher — kun
      re-sertifiseringspunktet er allerede nevnt over. Gå gjennom alle
      `<!-- UTKAST -->`-merkede avsnitt i index.html før publisering.
- [ ] **IKKE SLETT** `bilder/Byervinter.png`/`.webp` som "ubrukt" — det er en
      bevisst forhåndsklargjort vinter-variant av `Byer.png` (samme mål,
      1860×701), ment for sesongbytte senere. Ikke koblet inn i
      index.html/CSS ennå. Når den tas i bruk: `--base`-fargen må justeres
      (tunet mot sommerhimmelen), og Ring Oslo/Ring Stavanger-knappenes
      posisjon må sjekkes på nytt siden bykyklyngene ikke er helt identisk
      plassert som i sommerbildet.
