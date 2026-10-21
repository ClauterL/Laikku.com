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
  hero-maisema on oma koodilla piirretty SVG (`Landscape.tsx`), ei kopiota mistään pelistä.
- UI-primitiivit shadcn/ui-tyyliin (`src/components/ui`), Radix UI:n päällä.
- Äänet syntetisoidaan Web Audiolla (`src/lib/sfx.ts`) – ei äänitiedostoja repoon.
  Uusi efekti: lisää `Sfx`-unioniin ja `play()`-switchiin.
- Kuvat: WebP `public/images/`; henkilökuvat Higgsfieldillä Claus-referenssihahmolla,
  esineikonit (icon-*, good-*) fotorealistisella AC Odyssey/Mirage -esinetyylillä: yksi esine,
  tumma liuskekivitausta #1b2229, harvinaisuuden mukainen hehku (kulta/violetti/teräksensininen/harmaa),
  ei tekstiä, ei brändilogoja – ohjelmistot kuvataan esineinä (esim. Ollama = obsidiaanilaama).
- Tunnus (`src/components/Logo.tsx`): Higgsfieldillä piirretty ja vektoroitu kuvake ihmisestä läppärin takana,
  näytöllä `<#>`. Pääsiäismuna: #:n perään välähtää yksi morsemerkki kerrallaan kuin kursori, peräkkäin
  SMART (`... -- .- .-. -`) – kirjaimia eikä koko viestiä näytetä koskaan;
  nimi "Claus Laikku" on aina erillinen teksti. Favikoni `public/favicon.png` renderöidään samasta polusta.
- `src/data/github.json` on generoitu (scripts/fetch-github.mjs) – älä muokkaa käsin.
- Kartta on oikea maailmankartta omana SVG:nä (`src/data/world.json`, d3-geo + d3-zoom) AC-tyylillä:
  pergamenttimaa, teal-meri (`bg-map.webp`), fog of war merkkien ympärillä. Ei Leafletia, ei tiilipalvelimia.
- Pidä sivu staattisena: ei backendia, ei evästeitä, ei kolmannen osapuolen skriptejä
  (Google Fonts on ainoa ulkoinen resurssi).
