# Laikku.com — ohjeet avustajalle

Claus Laikun portfoliosivusto pelivalikon muodossa (laikku.com). Rakenne ja komennot: README.md.

## Ympäristö

- Projektin polku käyttäjän koneella: `H:\Havaida\Laikku.com` (Windows, Git Bash → `cd /h/Havaida/Laikku.com`).
- Node ≥ 22.12. `npm run dev` → http://localhost:5173.
- GitHub-repo: `ClauterL/Laikku.com`; julkaisu Netlifyyn (projekti `laikku-com`): push `main`iin → laikku.com.
  GitHub Pages -työnkulku (`deploy.yml`) ei ole käytössä (Pages pois päältä).
- Commitit tehdään nimellä `Claus Laikku <ClauterL@users.noreply.github.com>` ilman Co-Authored-By- tai
  Claude-Session-rivejä (historia kirjoitettu uudelleen 23.10.2026; varmuuskopio `_backup/` koneella, ei repossa).
- `v2/` on edellinen perinteinen portfolio (oma package.json) – ei kosketa, ellei pyydetä.

## Säännöt

- Kaikki näkyvä teksti tulee `src/content/fi.ts` ja `src/content/en.ts` -tiedostoista;
  uudet kentät myös `types.ts`:ään.
- Tyylit: Tailwind v4 + `src/index.css`:n tokenit (`text-brass`, `bg-bg-2`, `border-line`, `text-ink` …).
  Yksi tumma teema – ei vaaleaa tilaa.
  Normaali portfolio (`#portfolio`, `src/components/portfolio`) käyttää omaa auringonlaskupalettia
  (`pf-*`-tokenit: persikkataivas → oranssi/punainen → munakoiso) ja Archivo-julistefonttia (`.poster`);
  hero-maisema on Higgsfieldillä tehty oma sommitelma (Järvi-Suomi auringonlaskussa: sauna, saari, kuusimetsä),
  leikattu viideksi läpinäkyväksi tasoksi `public/images/hero-{far,lake,mid,near,front}-{1280,2048,3840}.webp`
  (3840×1118) ja elävöitetty koodilla (`Landscape.tsx` → `HeroScene`: aurinko, pilvet, linnut, välke, savu, drone,
  parallaksi). Näkymä skaalautuu yhtenä kappaleena (`w = max(104cqw, 960px)`), joten yksityiskohtien paikat
  annetaan prosentteina siitä. Ei kopiota mistään pelistä eikä pelien kuvia Higgsfield-referensseiksi.
  Alaosioiden eläinsiluetit (`Critters.tsx`): Higgsfield-videot (karhu Seedance 2.5, peura ja pesukarhu Kling 3.0;
  mustasta siluetista aloitus- ja lopetusruuduksi, paikallaan pysyvä kamera / karhulla seuraava kamera), joista ruudut
  irrotettu kynnystämällä → ruudukot `public/images/critter-{bear,deer,raccoon}.webp` (valkoinen + alfa) ja metatiedot
  `src/data/critters.json` (generoitu – älä muokkaa käsin; `images.ts` → `critterSprites`). Näytetään CSS-maskina
  currentColor-värillä. Karhu (Taitomatriisin korttien yläreunalla) koostuu viidestä toisiinsa liittyvästä klipistä:
  saumaton kävelysykli (`walk`), pysähdys seisomaan (`stop`, alkaa syklin ruudusta `stop.enter`), lähtö (`go`, päättyy
  syklin ruutuun `go.exit`) ja käännös ympäri (`turn`, loppu = seisova peilattuna; ruudukko rajattu symmetrisesti).
  Jokaisen ruudun siirtymä `dx` on mitattu maassa olevista tassuista, joten tassut eivät liu'u; karhu ei koskaan
  pysähdy kesken askeleen. Peura (Muut hankkeet) ja pesukarhu (Päivittäiset työkalut) toistavat videon omalla
  ajoituksella (`ms`) ja pitävät lyhyen tauon alkuasennossa.
  Vain staattisille taustoille, ei `spot`-korteille; kuva ladataan heti sivun asetuttua (idle) ja animaatio pyörii
  koko ajan myös näkymän ulkopuolella satunnaisesta vaiheesta alkaen, joten eläimet ovat jo liikkeessä, kun niiden
  kohdalle vieritetään; vähennetty liike → paikallaan.
- Normaalin portfolion liukuvat nauhat (työkalut, suosittelijat) = `src/components/portfolio/Marquee.tsx`: sisältö kahdesti,
  liike JS:llä transformina (ei CSS-animaatiota); painamalla ja vetämällä selattavissa hiirellä ja kosketuksella (inertia,
  `touch-action: pan-y` → pystypyyhkäisy vierittää sivua), kosketuslevyn vaakavieritys / Shift + rulla; pysähtyy hiiren
  ollessa päällä ja hetkeksi kosketuksen jälkeen. Vähennetty liike: natiivi vaakavieritys ilman kopioita.
- Aloitusruutu (`src/components/game/StartScreen.tsx`): taustana `StartBackdrop.tsx` – sama Järvi-Suomen maisema kuin
  normaalin portfolion herossa, mutta päivä ↔ yö on **esirenderöity video** (ei kuvapinojen ristihäivytystä: kaksi
  hero-pinoa revontulten ja sumennettujen korttien alla ylitti GPU-muistin → nykiminen, kadonneet kortit). Normaali-valinta =
  kultainen auringonlasku, Pelillistetty = revontuliyö. Lähteet `assets-src/start/` (ei repossa): aloitusruudun kaappaukset
  1920×1080 @2x ilman käyttöliittymää → Higgsfield MiniMax H3 2K (alku = päivä, loppu = yö) ja yön silmukka (alku = loppu =
  siirtymän viimeinen ruutu) → `scripts/start-video.py` → `public/video/start-{dn,nd,loop}-{1280,1920}.{mp4,webm}`,
  lepokuvat `public/images/start-{day,night}-*.webp` ja `src/data/start-sky.json` (generoituja – älä muokkaa käsin).
  `nd` on `dn` ruutu ruudulta käänteisenä: suunta vaihtuu kesken hyppäämällä toisen videon peilikuvaruutuun, joten
  siirtymää ei tarvitse odottaa loppuun. 16:9-kehys sijoitetaan hero-maiseman laatikkoon (`HERO_BOX`, kehys 96,154 % leveä,
  vasen +1,923 %), joten maisema osuu täsmälleen portfolion heron kohdalle; videon yläpuolinen taivas täytetään videon
  yläreunan värillä ruutu ruudulta + tähdillä. Elävät yksityiskohdat videon päällä: `Landscape.tsx` → `HeroLife`.
  Ilman videota (vähennetty liike, Save-Data, virhe, estetty toisto) still-kuvat ristihäivytetään. Aloitusruudulla ei
  backdrop-filteriä (liikkuvan videon päällä sumennus laskettaisiin joka ruudussa). Käyttöliittymän värit
  (`.start[data-night]`, kesto `--dusk`) seuraavat suuntaa, johon tausta oikeasti liikkuu (`onHeading`). Hiiri valitsee
  vasta viipyessään kortilla, vahvistus kiihdyttää siirtymän (`playbackRate`). Pesukarhu valitun kortin päällä
  `StartRaccoon.tsx` (sama critter-raccoon-ruudukko, hyppy WAAPI:lla). Normaali-valinnassa portfolio piirtyy aloitusruudun
  alle samaan maisemaan ja ruutu häivytetään sen päältä (App: `onDone` → `onExited`).
- Pelillistetty portfolio = **Kahvijahti** (`src/components/quest`, osoite `#quest`): avoin low-poly-Järvi-Suomi
  React Three Fiberillä, isometrinen ortokamera (`Scene.tsx` → `YAW`/`PITCH`, näkymä vähintään `VIEW_H` × `VIEW_W`).
  Pesukarhu (oma hahmo: lämmin harmaa turkki, luumu naamio, oranssit lentäjänlasit, tabletti tassuissa – ei kopio
  mistään pelistä) kulkee saarella; yhdeksän paikkaa (`world.ts` → `PLACES`, samat id:t kuin Dronelennon kohteilla)
  avaavat osiot tabletissa (`flight/Panels.tsx`, laiturilla oma ohje + pikamatka). 18 herkkua (`TREATS`: kahvi, donitsi,
  burrito); `drone: true` -herkut (katot, vesi) vain dronella (Q, kantama `DRONE_RANGE`). Kumiankka seuraa, vitsailee ja
  antaa vihjeen (H → nuoli maassa + valopylväs + kartan piste). Kaikki mallit koodilla (`models.tsx`, `kit.bake` →
  verteksivärit, litteä varjostus, auringonlaskun `PAL`), maasto ja puut ruutuina (frustum culling), vesi omalla
  varjostimella (syvyys maastosta leivotusta tekstuurista → matalikko, vaahto, välke). Pelisilmukka yhdessä `useFrame`issa,
  React päivittyy vain tapahtumista. Ohjaus WASD/nuolet, klikkaus/napautus maastoon, kosketussauva; heikolla laitteella
  (`PerformanceMonitor`) varjot pois ja pikselitiheys 1. HUD-kuvat (herkut, ankka, pesukarhu) Higgsfield GPT Image 2.5
  → `scripts/game-items.py assets-src/quest public/images/quest` (`images.ts` → `questArt`). Edistyminen
  localStoragessa (`laikku-quest`: löydetyt herkut + nähdyt paikat).
  Ilman WebGL:ää (`src/lib/webgl.ts` → `hasWebGL`) Kahvijahti ei käynnistä 3D:tä vaan näyttää ohjeen (kiihdytys päälle),
  uudelleenlatauksen ja normaalin version; jos 3D kaatuu käynnistyessä, `GlBoundary` näyttää saman. Ei 2D-varaversiota.
- Varmuuskopio: **Dronelento** (`src/components/flight`, avautuu vain osoitteella `#flight`): sivuttain vierivä Järvi-Suomi,
  jossa lennetään dronella pesukarhu kyydissä auringonlaskusta revontuliyöhön (yö laskeutuu kohdassa `NIGHT_ON`).
  Rannan yhdeksän kohdetta (`world.ts` → `STATIONS`) avaavat osiot (`Panels.tsx`, sisältö samoista fi/en-kentistä +
  `flight`-osio); ilmassa leijuvat taitopuun teknologiat ovat löytöjä. Grafiikka: hero-maiseman vaarat ja järvi +
  Higgsfield GPT Image 2.5 -kuvat (kohteet, drone, metsä- ja rantanauhat; tyyliviitteenä hero-maisema) →
  `scripts/game-assets.py` (Higgsfieldin taustanpoisto + valkoisen avainnus, yöversio liukuvärillä, lämpimät valot
  jätetään hehkumaan) → `public/images/game/*.webp`. Pesukarhun eleet (vilkutus, osoitus, tuuletus, katse taivaalle)
  Kling 3.0 -videoista → `scripts/game-raccoon.py` → `public/images/game/raccoon.webp` + `src/data/game-raccoon.json`
  (generoitu). Lähdekuvat ja -videot `assets-src/game/` (ei repossa). Päivä/yö-pinot ristihäivytetään
  `mix-blend-mode: plus-lighter` vain siirtymän ajan (`data-fading`) – ei reunaviivoja. Liike yhdellä rAF-silmukalla,
  joka kirjoittaa vain transformeja; HUD ilman backdrop-filteriä. Edistyminen localStoragessa (`laikku-flight`:
  nähdyt kohteet + keräyshaasteen ennätysaika).
  Keräyshaaste (`world.ts`): 12 löytöä liikkuu kahdeksikkoa (`findPath`), lokit (päivä) ja lepakot (yö) partioivat
  (`HAZARDS`), vedenpinta kastelee (`SPLASH_Y`) ja puuskaiset alueet työntävät (`WIND`, `GUST`). Kolme osumaa (`HEARTS`)
  → kierroksen löydöt putoavat ja yritys alkaa alusta; ajanotto alkaa ensimmäisestä liikkeestä, R = uusi yritys.
  Autopilotti on suojattu mutta ei kerää löytöjä – kohteisiin pääsee aina ilman haastetta.
  Elävä ympäristö (`Scenery.tsx`): aallonharjat syvyystasoittain, väreilevät heijastukset (raitamaski, huojuu
  kokonaisena kerroksena), järvellä purjeveneet, soutuvene ja vesidrone (Higgsfield-sivukuvat), sataman vene keinuu ja
  siniristilippu liehuu (SMIL-polkuinterpolointi), kalat hyppäävät, sorsat uivat, savu, kipinät ja lintuparvi.
  Satama on jaettu kerroksiksi ja veneet leikattu `scripts/game-props.py`:llä (aja game-assets.py:n jälkeen).
  Suorituskyky: kaikki liike transform/opacity- tai pieninä SVG-animaatioina; piilossa olevan päivä/yö-pinon animaatiot
  pysäytetään; StartSky on eristetty (`isolate`), ettei revontulien screen-sekoitus pakota koko näkymää välipintaan,
  ja päivällä revontulien animaatiot ja will-change ovat kokonaan pois. Taivas `StartSky.tsx`, yötasot
  `public/images/hero-{taso}-night-*.webp` (`scripts/hero-night.py`, älä muokkaa käsin).
  Aitan (Tavarat) esineillä on omat kuvakkeensa `public/images/game/items/<id>.webp` (`images.ts` → `gameItems`,
  avain = goods-esineen id): Higgsfield GPT Image 2.5 samaan litteään auringonlaskutyyliin valkoiselle taustalle
  (yksi esine, ei tekstiä eikä logoja) → `scripts/game-items.py` (reunoilta täyttö + suljetut valkoiset aukot läpinäkyviksi).
  Harvinaisuus näkyy ruudun alareunan värinä (`.fp-slot[data-rarity]`).
- Vanha 3D-loft + pelivalikko on varmuuskopio: koodi ennallaan (`components/loft`, `components/game/GameShell` …),
  avautuu vain osoitteilla `#loft` ja `#skills`, `#map` … (aloitusruudun kautta); lisäksi haara `loft-3d-backup`.
- UI-primitiivit shadcn/ui-tyyliin (`src/components/ui`), Radix UI:n päällä.
- Äänet syntetisoidaan Web Audiolla (`src/lib/sfx.ts`) – ei äänitiedostoja repoon.
  Uusi efekti: lisää `Sfx`-unioniin ja `play()`-switchiin.
- Kuvat: WebP `public/images/`; henkilökuvat Higgsfieldillä Claus-referenssihahmolla,
  vanhan pelivalikon/loftin esineikonit (icon-*, good-*) fotorealistisella AC Odyssey/Mirage -esinetyylillä: yksi esine,
  tumma liuskekivitausta #1b2229, harvinaisuuden mukainen hehku (kulta/violetti/teräksensininen/harmaa),
  ei tekstiä, ei brändilogoja – ohjelmistot kuvataan esineinä (esim. Ollama = obsidiaanilaama).
  Normaalin portfolion kuvakkeet (`pf-*.webp`, `images.ts` → `pfIcons` id:n mukaan) Higgsfieldillä sivun
  oman hero-maiseman tyyliin: litteät kerrokselliset auringonlaskun siluetit pf-paletilla, ei tekstiä eikä logoja.
- Tunnus (`src/components/Logo.tsx`): Higgsfieldillä piirretty ja vektoroitu kuvake ihmisestä läppärin takana,
  näytöllä `<#>`. Pääsiäismuna: #:n perään välähtää yksi morsemerkki kerrallaan kuin kursori, peräkkäin
  SMART (`... -- .- .-. -`) – kirjaimia eikä koko viestiä näytetä koskaan;
  nimi "Claus Laikku" on aina erillinen teksti. Favikoni `public/favicon.png` renderöidään samasta polusta.
- `src/data/github.json` ja `src/data/leetcode.json` ovat generoituja (scripts/fetch-github.mjs,
  scripts/fetch-leetcode.mjs; molemmat ajetaan `prebuild`issa ja päivittyvät päivittäisessä buildissa) – älä muokkaa käsin.
  LeetCodesta näytetään sijoitus, ratkaistut vaikeustasoittain, kielet ja aihealueet (normaali: Osaaminen, peli: taitopuun
  Harjoitusareena); aktiivisuuskalenteria ja yksittäisiä lähetyksiä ei tallenneta. Sijoitusprosentti lasketaan
  aktiivisista ratkaisijoista (≥ 50 ratkaisua ≈ 2,725 milj. käyttäjää, otos 1 175 käyttäjästä 10/2026;
  `ACTIVE_POOL` src/lib/leetcode.ts) ja pyöristetään ylöspäin; LeetCoden oma asteikko päättyy sijaan 5 000 000.
- Kartta on oikea maailmankartta omana SVG:nä (`src/data/world.json`, d3-geo + d3-zoom) AC-tyylillä:
  pergamenttimaa, teal-meri (`bg-map.webp`), fog of war merkkien ympärillä. Ei Leafletia, ei tiilipalvelimia.
- Pidä sivu staattisena: ei backendia, ei evästeitä, ei kolmannen osapuolen skriptejä
  (Google Fonts on ainoa ulkoinen resurssi). Poikkeus: normaalin portfolion yhteydenottolomake lähettää viestin
  Netlify Formsilla: runko `public/__forms.html` (kenttien nimet samat kuin lähetyksessä), lähetys `src/lib/contact.ts`
  (kehitystilassa ei lähetetä), roskapostiansa `bot-field`, otsikko piilokentästä `subject`. Sähköpostin lähettävät nyt
  Netlifyn omat lomakeilmoitukset (Forms → Submission notifications: claus.laikku@havaida.com ja claikku@gmail.com,
  lähettäjä Netlify; asetettu 24.10.2026). Valmiina myös funktio `netlify/functions/submission-created.mts` (ainoa
  palvelinkoodi; tyypit `tsconfig.functions.json`), joka lähettää viestin lähettäjänä info@havaida.com Google Workspacen
  SMTP:llä, kun Netlifyn ympäristömuuttujiin lisätään `CONTACT_SMTP_USER` + `CONTACT_SMTP_PASS` (Googlen sovellussalasana,
  käyttäjä lisää itse); valinnaiset `CONTACT_FROM`, `CONTACT_TO`, `CONTACT_SMTP_HOST`, `CONTACT_SMTP_PORT`. Muuttujan muutos
  vaatii uuden julkaisun, ja silloin Netlifyn lomakeilmoitukset poistetaan (muuten viesti tulee kahdesti). Ilman tunnuksia
  funktio ei tee mitään. Viestit näkyvät aina myös Netlifyssä: Forms → contact (roskapostiksi luokitellut erikseen,
  niistä ei lähde ilmoitusta).
