# Laikku.com — ohjeet avustajalle

Claus Laikun portfoliosivusto pelivalikon muodossa (laikku.com). Rakenne ja komennot: README.md.

## Ympäristö

- Projektin polku käyttäjän koneella: `H:\Havaida\Laikku.com` (Windows, Git Bash → `cd /h/Havaida/Laikku.com`).
- Node ≥ 22.12. `npm run dev` → http://localhost:5173.
- GitHub-repo: `ClauterL/Laikku.com`, julkaisu GitHub Pagesiin (custom domain laikku.com).
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
  Alaosioiden eläinsiluetit (`Critters.tsx`, data `critterArt.ts`): Higgsfieldillä tehdyt mustat animaatioruudut
  vektoroitu potracella ja kohdistettu samaan koordinaatistoon; pesukarhu (Päivittäiset työkalut -kortti), karhu
  (kävelee Taitomatriisin korttien yläreunaa) ja peura (Muut hankkeet -rivin reunalla). Vain staattisille taustoille,
  ei `spot`-korteille; ruudut vaihtuvat vain näkyvissä, vähennetty liike → paikallaan.
- UI-primitiivit shadcn/ui-tyyliin (`src/components/ui`), Radix UI:n päällä.
- Äänet syntetisoidaan Web Audiolla (`src/lib/sfx.ts`) – ei äänitiedostoja repoon.
  Uusi efekti: lisää `Sfx`-unioniin ja `play()`-switchiin.
- Kuvat: WebP `public/images/`; henkilökuvat Higgsfieldillä Claus-referenssihahmolla,
  esineikonit (icon-*, good-*) fotorealistisella AC Odyssey/Mirage -esinetyylillä: yksi esine,
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
  (Google Fonts on ainoa ulkoinen resurssi).
