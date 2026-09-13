# Åpne punkter — CleanUnit-redesign

- [x] Logo-mynt-snurringen ("CLEANUNIT" bokstav for bokstav) gjort tregere
      (Ricky, 2026-09-13) — varighet 550ms→700ms per bokstav, forsinkelse
      mellom bokstaver 55ms→75ms. Holdt CSS (`logo-snurr`-animasjonen) og
      JS (`SNURR_TOTAL_MS`-utregningen som styrer når boblene/tittel-
      lystenningen skal starte) synkronisert — begge steder oppdatert
      sammen, ellers ville boblene dukket opp før siste bokstav var ferdig
      tegnet. Verifisert i browser (fanget et mellomsteg av snurringen +
      bekreftet fullført sluttilstand), ingen konsoll-feil.
- [x] Kart-stjerne-stafetten (glimt ved bil-markørene på vannmerket) fjernet
      helt (Ricky, 2026-09-13) — én av flere hero-animasjoner design-
      kritikken flagget som den minst meningsbærende. Fjernet fra alle tre
      lag: `.kart-markor__stjerne`-spanene i index.html (7 stk, selve
      bil-markørene står igjen), `.kart-markor__stjerne`/`@keyframes
      markor-stjerne-sving`-reglene i style.css, og `markorStjerner()`-
      funksjonen + kallet til den i js/main.js (tittel-lystenningen trigges
      fortsatt etter boblene, bare uten kart-stjernene ved siden av).
      Verifisert i browser, ingen konsoll-feil.
- [x] Hero-logoen (CLEANUNIT) ikke helt sentrert på mobil (Ricky, ekte
      iPhone-skjermbilde 2026-09-13). To ting fikset samtidig:
      1) `.hero__logo`s `left: clamp(9.5rem, 20%, 30%)` har et FAST 9,5rem-
      gulv som vinner på nesten alle telefoner (under ~760px bredde) —
      logoen satt derfor 40-60px til venstre for ekte midtpunkt, ikke
      proporsjonalt sentrert. Ny `@media (max-width: 40rem)` setter
      `left: 50%` direkte der (samme brytningspunkt som hero__knapper/
      min-height-fiksene).
      2) Samtidig rotårsak til det gamle, uløste "logo bryter til 2-3
      linjer på smale skjermer"-bifunnet fra design-kritikken: en absolutt
      posisjonert boks med kun `left` (ikke `right`) får "shrink-to-fit"-
      bredden sin regnet ut FØR `translateX(-50%)` brukes, så tilgjengelig
      bredde fra `left`-punktet ble for smal og tvang `.logo` til å bryte.
      Prøvde først `width: max-content` på `.hero__logo` — ga i stedet
      avkutting (viste seg å være en font-innlastings-timing-artefakt i
      testingen, ikke en ekte bug, men byttet likevel til en enklere/
      tryggere løsning): `white-space: nowrap` direkte på `.logo` løser
      bryte-problemet uten å røre `.hero__logo` sin bredde-beregning.
      Verifisert med iframe-teknikk ved 320/375/430px (logo helt på én
      linje, god margin begge sider) OG ved 1000px (fortsatt korrekt,
      ingen avkutting — måtte vente lenger på font-innlasting for et
      rettvisende skjermbilde). Ingen konsoll-feil.
- [x] "i Oslo og Stavanger" fikk logoens grå (--logo-tekst-gra, samme som
      "CLEAN") permanent i stedet for --teal-mork (Ricky, 2026-09-13:
      bevisst farge-sammenspill med logoen — "Renhold" går fra samme grå
      til turkis akkurat som CLEAN→UNIT i logoen, resten speiler CLEAN og
      står stille). `.hero__tittel` selv er nå grå; `.tittel-grunn`
      ("Renhold") trenger ikke lenger egen fargeregel siden den arver
      samme grå fra forelderen. Verifisert i browser.
- [x] Lys-tenningen på hero-overskriften avgrenset til kun "Renhold" (Ricky,
      2026-09-13: "Kun gjør det til og med 'Renhold'") — "i Oslo og
      Stavanger" står i vanlig --teal-mork overskriftsfarge fra første
      frame, ingen animasjon. Forenklet samtidig fra per-ord-masking
      (trengtes da HELE teksten skulle tennes i lesningsrekkefølge på tvers
      av linjebrytning) tilbake til én enkel sveip, siden det nå kun er ett
      ord. js/main.js (tittelLysTenn) regner fortsatt ut varighet/steg
      dynamisk fra ordets lengde i stedet for hardkodet. Verifisert i
      browser: "Renhold" grått ved sidelast → turkis etter animasjon, resten
      uendret hele tiden, ingen konsoll-feil.
- [x] Ring Oslo/Ring Stavanger-knappene kolliderte midt i på smale telefoner
      (Ricky, skjermbilde 2026-09-13, ~430px bredde) — 9rem-gulvet og
      "100% - 9rem"-taket i clamp()-formlene konvergerte for tett. Fikset
      med `@media (max-width: 34rem)`: knappene gir opp å sitte presist
      under hver sin by og stables i stedet sentrert (flex-column) under
      den bredden. Verifisert med iframe-teknikk ved 430px — ingen
      overlapp, pent stablet. Endringen er strengt scopet til media queryen,
      så desktop/bredere skjermer er uberørt.
- [x] Design-kritikk 2026-09-13 (design-kritikk-skillen, hele siden): fant
      «foreldreløse» siste grid-rader i Referanser (5 kort → 3+2) og Jobb
      hos oss (både fordelene, 4→3+1, og ansatte-sitatene, 4→3+1), med tomt
      hull ved siden av det ensomme kortet.
      Første runde fikset BEGGE med avlange, stablede kort — men Ricky
      snudde etter å ha sett resultatet: fordel-kortene ("Skikkelig
      opplæring" osv.) fikk tilbake sin opprinnelige kort-stil (3-kolonners
      grid), og den avlange/stablede behandlingen ble i stedet flyttet til
      BEGGE sitat-typene — `.sitat-liste`/`.sitat-kort` er nå én generell,
      useksjonert stil (ikke lenger `.stopp--referanser`-scopet) som
      gjelder likt for Referanser OG «Dette sier de som jobber hos oss»:
      logo/ikke-logo til venstre, sitat til høyre, stables under 36rem.
      Tanken (Rickys ord): all tilbakemelding skal se lik ut uansett om
      den er fra kunde eller medarbeider. Fordel-kortenes CSS-endring er
      fullstendig reversert (samme markup som før, ingen endring der).
      Stålverkskroken-kortet (uten logo) faller naturlig tilbake til full
      bredde, samme som Monika/Urszula/Aneta/Vilma (som aldri hadde logo).
      Verifisert i browser (alle tre steder), ingen konsoll-feil.
- [x] Hero-overskriften «Renhold i Oslo og Stavanger» opplevdes passiv
      (Ricky, 2026-09-13). Fikk bokstav-for-bokstav lys-tenning — samme
      2-lags mask-position-steps()-teknikk som Tuven-prosjektets logo/
      footer-merke (`.tittel-lys` i style.css, `tittelLysTenn()` i
      js/main.js). Justert etter Rickys tilbakemelding samme dag: starter
      i logoens grå (`--logo-tekst-gra`, samme som "CLEAN"), tennes
      bokstav for bokstav til logoens turkis (`--logo-tekst-turkis`, samme
      som "UNIT") med et lyst glødeskjær — ikke gull som første versjon.
      Trigges ETTER at logo+bobler er helt ferdig (samme mønster som
      kart-stjerne-stafetten, kjører parallelt med den). Standardtilstand
      (uten html.js, eller reduced-motion) viser laget helt avdekket med en
      gang — rett i ferdig turkis, aldri fastlåst grått.
      To justeringsrunder samme dag: (1) glødet dempet i to steg ned til
      `drop-shadow(0 0 3px rgba(135,202,201,.25))` — synlig fargeskifte,
      ikke lyskaster. (2) Sveip-kvirken fikset: overskriften brøt til to
      linjer, og én sveip over hele elementet avdekket samme tegn-posisjon
      på begge linjer samtidig («R» og «S» sammen) — feil lesningsrekkefølge.
      Løst ved å dele lys-laget i ord (`<span class="tittel-ord">` rundt
      hvert ord), maskert OG tidsstyrt enkeltvis: `tittelLysTenn()` i
      js/main.js regner ut varighet (55ms/bokstav) og kumulativ forsinkelse
      per ord via `el.style.animationDuration/-Delay/-TimingFunction`, så
      ordene tennes ett etter ett i riktig rekkefølge uansett hvor linjen
      brytes. Verifisert i browser + JS-introspeksjon av alle 5 ords
      beregnede verdier og sluttilstand (maskPosition "0% 0px" = fullt
      avdekket) — ingen konsoll-feil.
- [x] Scroll-reveal, nytt forsøk (2026-09-13, brainstorming-skill/bounded-løp,
      godkjent av Ricky). Kort dukker opp med fade+løft (`translateY(16px)→0`)
      når de scrolles inn i synsfeltet, syklisk 0/90/180ms-forsinkelse via
      `:nth-child(3n+…)` for bølge-følelse i rader. Gjelder tjeneste-kort,
      sitat-kort (Referanser + Jobb hos oss), tillit-liste-punktene og
      om-foto-plassholder-boksene. `.js-reveal`-klassen settes KUN av
      `kortReveal()` i js/main.js (IntersectionObserver, fyrer én gang per
      kort) — ikke i HTML/CSS direkte, så elementene er alltid synlige med
      en gang hvis scriptet aldri kjører (ingen egen nødluke trengt, i
      motsetning til logo-snurringen). Respekterer prefers-reduced-motion.
      Verifisert i browser gjennom hele siden + ingen konsoll-feil. Erstatter
      de fire signaturgrepene (full flate/backdrop-filter/smal stripe/
      clip-path) som ble fjernet 2026-09-12 for å forstyrre lesing — denne
      varianten er lokal per-kort-bevegelse, resten av siden står i ro.
- [x] «Hvorfor Clean Unit» opplevdes passiv (Ricky, 2026-09-13). Ikon/logo
      flyttet fra bunn til topp av hvert kort, i en sirkulær stempel-/segl-
      ramme (hvit bunn, teal dobbeltring med dashet indre linje) — passer
      godt siden innholdet faktisk er sertifiseringer/medlemskap. Tekst
      sentrert under (ny `.tillit-stempel`-klasse i style.css).
- [x] Hero på smale skjermer: for stort gap mellom logo og resten av
      innholdet (Ricky, skjermbilde 2026-09-13). To fikser i style.css:
      1) `.hero__kart-vannmerke` hadde `width: clamp(500px, 85vw, 1000px)` —
      500px-gulvet er urimelig stort på ekte telefonbredder, senket til
      `clamp(260px, 85vw, 1000px)`. 2) Ny `@media (max-width: 40rem)`
      senker `.hero`s `min-height` fra 100svh til 88vh — færre "tomme"
      piksler for `justify-content:center` å spre utover. Testet med en
      iframe-teknikk (siden `resize_window` ikke virker i sandkassen, kjent
      fra før) på flere telefonhøyder (667/812/932px) — bekreftet at
      88vh IKKE overlapper hero__by-illustrasjonen selv på korte skjermer
      (iPhone SE-høyde), samtidig som gapet er merkbart mindre på høye
      skjermer. Klarte ikke å gjenskape Rickys skjermbilde pikselnøyaktig i
      sandkassen (samme resize_window-begrensning), så **be Ricky
      dobbeltsjekke på ekte enhet/vindu at gapet faktisk er borte** — hvis
      ikke, er dette trolig fortsatt underdimensjonert og trenger en ny
      runde.
      Bifunn den gangen, IKKE fikset da: `.hero__logo` bryter til 2-3 linjer
      på smale skjermer — se eget punkt under, fikset 2026-09-13.
- [x] Organisasjonsnummer lagt til i footeren under begge kontor-adressene:
      Oslo (Clean Unit Renhold AS) 895 215 902, Stavanger (Clean Unit
      Stavanger AS) 929 085 019. Hentet fra cleanunit.no/kontakt og
      kryssjekket mot Brønnøysundregisteret (data.brreg.no) — begge numrene
      stemmer med selskapsnavnene.
- [ ] Brreg-oppslaget avdekket at Clean Unit Stavanger AS' REGISTRERTE adresse
      er Nedre Holmegate 30, 4006 Stavanger — ikke Bryggerikaien 16, 4014
      Stavanger som står i footeren vår (hentet fra cleanunit.no selv
      2026-09-12). Kan være en reell besøksadresse vs. registrert adresse-
      forskjell (vanlig i Norge), eller at kontoret har flyttet uten at
      Brreg er oppdatert. UTKAST-merket i index.html — bekreft riktig
      besøksadresse med Marit/Christopher før publisering.
- [x] Ny seksjon «Referanser» satt inn mellom Tjenester og Hvorfor Clean Unit
      (`id="referanser"`, teal-lys bakgrunn for å bryte fargerekken
      hvit→mint→grå→mint→grå). Innhold: 5 ekte, navngitte kundesitater
      hentet ordrett fra cleanunit.no/referanser (Ida Larson/Stiftelsen NVH
      barnehagen, Cecilie Beck-Hansen/Utforskeren Kanvas-Barnehage, Line
      Wermundsen Mork/Kristelig Gymnasium, Solveig Sletten/Medistim, Trine
      Hofseth/Stålverkskroken barnehage). Gjenbruker samme `.sitat-liste`/
      `.sitat-kort`-mønster som Ansatte-sitatene i Jobb hos oss. Ingen
      UTKAST-merking siden teksten er direkte sitert — men samme forbehold
      som ansatte-sitatene: vi vet ikke om disse kundeforholdene fortsatt
      er aktive, bør nevnes for Marit/Christopher før publisering.
- [ ] Kundelogoer lagt til på 4 av 5 referanser (hentet fra cleanunit.no/
      referanser sin egen Squarespace-CDN): `bilder/logo-nvh`, `logo-kanvas`,
      `logo-kg` (Kristelig Gymnasium), `logo-medistim`. Den 5. — Stålverkskroken
      barnehage — er UTKAST-merket i index.html og IKKE lagt inn: kilden
      bruker `Barnehagenett-logo.png`, som er logoen til nettverket/
      plattformen barnehagenett.no, ikke Stålverkskroken sin egen logo. Virker
      som en feil/plassholder på selve cleanunit.no. Spør Ricky om vi skal
      1) bruke samme (feilaktige) logo som kilden, 2) utelate logo for denne
      ene referansen, eller 3) prøve å finne Stålverkskroken barnehages
      egen logo et annet sted.
- [x] Re-sertifisering i «Hvorfor Clean Unit»: eneste konkrete dato funnet på
      cleanunit.no/aktuelt er januar 2021 (5+ år gammel, neppe «nylig»
      lenger). Ricky besluttet 2026-09-13 å anta at de fortsatt er
      miljøsertifisert og gå videre uten eksakt ny dato. Punktet er derfor
      omdøpt fra «Nylig re-sertifisert» til «Jevnlig re-sertifisert»
      (unngår en tidsspesifikk påstand vi ikke kan bekrefte), og
      «Miljøfyrtårn-sertifisert»-punktet er avmerket som bekreftet (matcher
      dagens forside-tekst ordrett). UTKAST-kommentaren på «Jevnlig
      re-sertifisert» er beholdt kun som kildenotat, ikke som blokkerende
      usikkerhet.
- [x] Ekte Miljøfyrtårn- og Virke-logoer (`bilder/logo-miljofyrtarn.png/.webp`,
      `bilder/logo-virke.png/.webp`) hentet fra footeren på cleanunit.no/aktuelt
      (Squarespace-CDN) og lagt inn over hhv. «Miljøfyrtårn-sertifisert» og
      «Medlem i Virke» i Hvorfor Clean Unit-seksjonen. NB: kildefilene er kun
      61×52px — det er den eneste oppløsningen som finnes på cleanunit.no,
      så logoene kan se litt myke ut på retina-skjermer. Be Marit/Christopher
      om høyoppløste versjoner (eller hent fra Virke/Miljøfyrtårns egne
      brand-kit-sider) hvis skarpere logoer trengs senere.
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
- [ ] Tre UTKAST-merkede tekstblokker gjenstår i koden (hero-ingress, to av
      fire tillitspunkter: «Direkte ansatte» og «Medlem i Virke») —
      forfatterens egen tekst, ikke bekreftet med Marit/Christopher.
      «Miljøfyrtårn-sertifisert» og «Jevnlig re-sertifisert» er nå avklart,
      se egne punkter over. I tillegg: om-oss-grunnleggelseshistorien (se
      over). Gå gjennom alle `<!-- UTKAST -->`-merkede avsnitt i index.html
      før publisering.
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
