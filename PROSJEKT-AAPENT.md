# Åpne punkter — CleanUnit-redesign

- [ ] Re-sertifiseringsdato/-fakta fra dagens «Aktuelt»-seksjon — hent eksakt
      tekst/dato før den brukes i «Hvorfor Clean Unit»-seksjonen (nå UTKAST).
- [ ] Ekte bilder (ansatte, biler, barnehager) — legges til når/hvis
      Marit/Christopher skaffer dem. Siden er bevisst bildeløs foreløpig.
      Unntak: Om oss-seksjonen har nå to dekorative `.om-foto-plassholder`
      (teal-gradient + bygning-ikon, merket «Oslo» og «Stavanger») der ekte
      kontorbilder skal inn — bytt hver til `<img alt="…">` med ekte bilde
      når Marit/Christopher skaffer dem (svg-ikonet er aria-hidden,
      figcaption med stedsnavnet er ekte tekst og skal beholdes eller
      flettes inn i alt-teksten). En tredje, bredere `.om-foto-plassholder--bred`
      (team-ikon, 21:9) står under «Fra to mopper»-avsnittet — venter på en
      GPT-generert illustrasjon (halvsirkel av ~14-16 ansatte med
      rengjøringsutstyr rundt to grunnleggere med mopp/spann i sentrum,
      flat vektorstil som Byer.png, teal/gull-palett). Ricky genererer
      denne selv når GPT-kvoten er tilbake — bytt til `<img alt="…">` når
      bildet finnes.
- [ ] Domeneovergang til cleanunit.no — eget steg etter at de har sett
      rickymoe.github.io/CleanUnit.
- [ ] Cloudflare-analytics-beacon — legges inn rett før lansering, ikke nå.
- [ ] Bekreft telefon/e-post for begge kontorer stemmer (hentet fra dagens
      side 2026-09-12): Oslo 21 55 56 80 / renhold@cleanunit.no,
      Stavanger 900 65 009 / thord@cleanunit.no.
- [ ] Favicons og OG-bildet (`bilder/favicon-*.png`, `bilder/og-cleanunit.png`)
      er genererte, ensfargede plassholdere — erstattes med ekte
      logo-utsnitt når en høyoppløst Clean Unit-logo finnes.
- [x] Tjenestekortene er byttet fra 4 kundegruppe-kort (Barnehage/Skole/
      Bilforhandler/Kontor) til de 6 ekte tjenestekategoriene fra
      cleanunit.no/tjenester (Barnehagerenhold, Daglig renhold,
      Hovedrengjøring, Hygieneartikler, Gulvbehandling, Vinduspuss) —
      teksten er hentet direkte fra cleanunit.no, lett omskrevet for
      klarhet på Daglig renhold, Hovedrengjøring og Gulvbehandling.
      UTKAST-merkingen er fjernet siden ordlyden nå er kilde-forankret,
      ikke forfatterens egen tekst.
- [x] Om oss-seksjonen er byttet ut med ekte tekst fra cleanunit.no/omoss:
      «OM OSS»-avsnittet (tilpasset forsiktig til to-kontor-rammeverket —
      55 ansatte er tallet for Oslo-kontoret spesifikt, Stavanger nevnt uten
      eget tall siden det ikke finnes i kilden) + Filosofi-avsnittet i en ny
      «Fra to mopper til 55 ansatte»-underseksjon. Ansatte-sitatene
      (Monika/Urszula/Aneta/Vilma) fra samme kildeside er bevisst holdt
      utenfor — de er tiltenkt en kommende «Jobb hos oss»-seksjon i stedet.
      Én ny UTKAST-merking lagt til: grunnleggelseshistorien (2007, «to
      stykker med hver vår mopp») er hentet fra Oslo-siden av cleanunit.no
      og ikke bekreftet om den dekker Stavanger-kontoret også.
- [ ] Fire UTKAST-merkede tekstblokker gjenstår i koden (hero-ingress, tre
      av fire tillitspunkter) — forfatterens egen tekst, ikke bekreftet med
      Marit/Christopher — kun re-sertifiseringspunktet er allerede nevnt
      over. I tillegg: om-oss-grunnleggelseshistorien (se over). Gå gjennom
      alle `<!-- UTKAST -->`-merkede avsnitt i index.html før publisering.
- [x] Ny seksjon «Jobb hos oss» satt inn rett etter Om oss, før footeren.
      Innhold: lede (UTKAST, egen syntese) + 4 fordeler (UTKAST-tekst, men
      basert på reelle fakta) + 4 ekte Ansatte-sitater fra cleanunit.no/omoss
      (Monika/Urszula/Aneta/Vilma, brukt ordrett/lett trimmet) + CTA "Send
      oss en åpen søknad". Ingen stillingsutlysninger fantes på Aktuelt, så
      dette er en generell rekrutteringsseksjon, ikke konkrete jobbannonser.
      Gjenstående UTKAST-punkter i denne seksjonen:
        - Lede-avsnittet og alle 4 fordelstekstene er min egen syntese,
          ikke bekreftet med Marit/Christopher.
        - «Trening og ergonomi»-fordelen bygger på en SATS/ELIXIA-
          bedriftsavtale omtalt i en artikkel fra 2018 — bekreft at avtalen
          fortsatt gjelder før publisering.
        - Ansatte-sitatene er hentet fra dagens cleanunit.no, men vi vet
          ikke om Monika/Urszula/Aneta/Vilma fortsatt er ansatt — bekreft
          med Marit/Christopher, eller fjern navn som ikke lenger stemmer.
        - CTA-en peker til `renhold@cleanunit.no` (samme som Oslo-kontorets
          generelle e-post) i mangel på en dedikert rekrutterings-adresse —
          spør om de vil ha en egen adresse for søknader.
- [ ] **IKKE SLETT** `bilder/Tjenster.png` som "ubrukt" — det er GPT-kilde-
      gridet (3×2, 1536×1024) de 6 tjeneste-ikonene (`bilder/ikon-*.png/.webp`)
      ble klippet ut fra. Ikke referert i index.html/CSS selv, men beholdes
      som kilde for å regenerere/justere ikoner senere.
- [ ] **IKKE SLETT** `bilder/Byervinter.png`/`.webp` som "ubrukt" — det er en
      bevisst forhåndsklargjort vinter-variant av `Byer.png` (samme mål,
      1860×701), ment for sesongbytte senere. Ikke koblet inn i
      index.html/CSS ennå. Når den tas i bruk: `--base`-fargen må justeres
      (tunet mot sommerhimmelen), og Ring Oslo/Ring Stavanger-knappenes
      posisjon må sjekkes på nytt siden bykyklyngene ikke er helt identisk
      plassert som i sommerbildet.
