# Laikku.com

Claus Laikun portfoliosivusto – **laikku.com** – pelivalikon muodossa.

Idea: portfolio näyttää pelin inventory-/hahmoruudulta. Keskellä hahmo (Higgsfieldillä
generoitu, taustanpoistettu), ympärillä pyöreät esineslotit: vasemmalla **varusteet**
(osaamisalueet tasolukuineen), oikealla **projektit**, hahmon alla **kielipalkki**
(React, TypeScript, Node.js, Supabase, Tailwind, Python). Vasen pylväs näyttää tason ja
pienet HUD-slotit, oikea reppu laskee GitHub-kontribuutiot, repot, demosivustot ja
teknologiat. **Tavarat**-välilehti on Odyssey-tyylinen esineruudukko (työaseman osat,
laitteet & työkalut, palvelut) resurssirivillä ja kelluvalla tietopaneelilla.
Yläpalkin välilehdet: Taidot · Projektit · Tavarat · Kartta · Tehtävät · Havaida · Koodeksi.
Sivu avautuu aloitusruutuun, jossa teräksinen riimutunnus paljastuu animoituna
(Higgsfield image-to-video, mykkä mp4/webm-silmukka). Kaksikielinen (fi/en),
näppäimistöllä navigoitava, ääniefektit.

## Stack

| Osa           | Mitä                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| Runko         | React 19 · Vite 8 · TypeScript                                                         |
| Tyylit        | Tailwind CSS 4 (`@tailwindcss/vite`) · `tw-animate-css`                                |
| Komponentit   | shadcn/ui-tyyliset Radix-primitiivit: Tabs (välilehdet), Dialog (esineen tiedot), Sheet (valikko), Tooltip, ToggleGroup (kieli), Button, Badge |
| Ikonit        | lucide-react (UI) · simple-icons (teknologialogot taitopuussa)                         |
| Äänet         | Web Audio API, syntetisoidut efektit (`src/lib/sfx.ts`) – ei äänitiedostoja            |
| Kuvat         | Higgsfield: hahmo Claus-referenssihahmolla + taustanpoisto, 18 ympyräikonia + 35 Tavarat-esinettä fotorealistisella AC Odyssey -esinetyylillä (tumma liuskekivitausta, harvinaisuushehku), tunnuksen paljastusvideo, 2 taustaa (`public/images`) |
| Data          | `scripts/fetch-github.mjs` hakee julkiset GitHub-tiedot build-aikana → `src/data/github.json` · `scripts/build-world.mjs` → `src/data/world.json` (maailmankartta) |
| Kartta        | d3-geo (Natural Earth -projektio) · d3-zoom · topojson-client; ei karttapalvelimia tai ulkoisia tiilejä |
| 3D-loft       | three · @react-three/fiber · drei · @react-three/rapier (fysiikka) · ecctrl (kolmannen persoonan hahmo-ohjain, joystick) – ladataan laiskasti vasta `#loft`-näkymässä |
| Julkaisu      | GitHub Actions → GitHub Pages (custom domain `laikku.com`, `public/CNAME`)             |

## Komennot

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # prebuild hakee GitHub-datan + tsc + vite build → dist/
npm run preview      # http://localhost:5180
npm run fetch:github # päivitä vain src/data/github.json
```

Node ≥ 22.12.

## Rakenne

```
src/
  App.tsx                    välilehdet, näppäimet (Q/E, M), hash-reititys (#inventory …)
  index.css                  teema-tokenit (nahka/messinki/pergamentti/hiillos/teal), utilityt
  lib/sfx.ts                 ääniefektit: tick, select, back, tab, open, close, boot, unlock, ambient
  content/
    types.ts                 sisältömalli (Item, Quest, Marker, …)
    fi.ts, en.ts             KAIKKI TEKSTIT – muokkaa näitä
    images.ts                kuvat, ikonit (icon-*), Tavarat-esineet (good-*), tunnus, taustat, linkit
  components/game/
    StartScreen              tunnuksen paljastusvideo + "Paina mitä tahansa" – avaa äänen
    TopBar, BottomBar        valikko + välilehdet + ääni/kieli · näppäinvihjeet
    InventoryScreen          hahmo, slotit, kielipalkki, taso, HUD-slotit, reppu, tietokaista
    GoodsScreen              Tavarat: resurssirivi + XP, 3 ryhmää × 4 ruutua/rivi, kelluva tietopaneeli, nuolinavigointi
    Slot, ItemDialog         pyöreä slotti + tietoikkuna
    SkillsScreen             taitopuu (3 haaraa, tasorenkaat)
    MapScreen                oikea maailmankartta (SVG, d3-geo + TopoJSON), fog of war, reitit, zoom, pikamatkustus
    QuestsScreen             pää- ja sivutehtävät, tavoitteet, eteneminen
    OrderScreen              Havaida Oy ("kilta")
    CodexScreen              minusta, tiedot, tilastot, yhteydenotto (mailto)
  components/loft/
    zones.ts                 kerroksen pohjapiirros (koti A, hissiaula, startup-loft B), 9 vyöhykettä, esineiden sijoittelu
    colliders.json           generoitu asunnon solmuista (scripts/loft/colliders.py) – törmäykset ja kameran esteet
    LoftScene                asunto + aula, Fab-esineet, hahmo (ecctrl + Rapier), olan yli / 1. persoonan kamera, hiirikatse
    LoftView                 #loft-näkymä: canvas, latausilmaisin, kehote (E), pikavalikko (Q), näkymä (V), joystick, osiopaneeli
  components/ui/             shadcn/ui-komponentit
  hooks/useLang, useSound
v2/                          edellinen (perinteinen) portfolio, itsenäinen projekti
```

## Sisällön muokkaus

- Esineslotit: `inventory.gear` (varusteet, `level`), `inventory.items` (projektit, `status`)
  ja `inventory.languages` (kielipalkki, `level`) tiedostoissa `src/content/fi.ts` ja `en.ts`.
  Uusi ikoni: `public/images/icon-<nimi>.webp` (512×512, pyöreä tumma tausta, maalattu
  pelitavaratyyli) ja viite `src/content/images.ts` → `icons`.
- Tavarat: `goods.groups[].items` (kind `good`, `count`, `spec`) ja `goods.resources` (repos/commits
  GitHub-datasta, muut `value`). Uusi esine: `public/images/good-<nimi>.webp` (512×512) + `images.ts` → `goods`.
- Tunnus: `public/images/emblem-reveal.mp4` + `.webm` (720×720, 5 s, mykkä) ja still
  `emblem-768.webp`; polut `images.ts` → `emblem`. Toimii myös favikonina (`favicon.png`).
- Taso-numero ja HUD-slotit: `hud.level`, `hud.slots`. Reppu: `hud.bag.rows`
  (commits/repos tulevat GitHub-datasta, muut `value`-kentästä).
- Tehtävät: `quests.main` ja `quests.side` (status: active/done/planned/idea, progress 0–100).
- Kartta: `map.markers` (lat/lon), `map.regions` (aluenimet), `map.routes` (reitit lon/lat-pisteinä).
  Karttadata `src/data/world.json` (Natural Earth 50m kevennettynä) syntyy komennolla
  `node scripts/build-world.mjs` – ei tarvitse ajaa, ellei dataa haluta muuttaa.
- Äänet: voimakkuudet ja taajuudet `src/lib/sfx.ts`. Mykistys tallentuu localStorageen.

## Julkaisu GitHub Pagesiin

1. Repo `ClauterL/Laikku.com`, branch `main`. Settings → Pages → Source: **GitHub Actions**.
2. Custom domain `laikku.com` (DNS GitHub Pagesin ohjeiden mukaan), Enforce HTTPS.
3. Workflow (`.github/workflows/deploy.yml`) buildaa jokaisesta pushista ja kerran päivässä.

## Loftin 3D-mallit

Mallit (`public/models/loft/*.glb`) eivät ole repossa: Fab-lisenssi ei salli niiden jakamista
erillisinä tiedostoina. Ne tuotetaan paikallisesti `scripts/loft/`-putkella
(oma asennus: `cd scripts/loft && npm i`):

1. Unreal 5.8 vie Gaming Apartment -tason glTF:ksi (`assets-src/ue/export_loft.py`).
2. `UNIT_B=1 node opt-apt.mjs apt-raw.glb apartment.glb nodes.json` – kevennys (meshopt, WebP), kerroksen toinen yksikkö.
3. `python3 colliders.py nodes.json ../../src/components/loft/colliders.json` – törmäyslaatikot.
4. `node opt-prop.mjs <fab-malli> <ulos.glb> <tekstuuri> <kolmiot>` – Fab-esineet.
5. Valokartat: kohtauksen valot ovat Unrealissa liikkuvia (Lumen), joten paisto tehdään vain vientiä varten:
   valot staattisiksi muistissa → Lightmass (Medium) → glTF-vienti `export_lightmaps`-asetuksella → valot takaisin
   (tasoa ei tallenneta). Sitten
   `TONE=1 node lightmaps.mjs lightmaps.gltf lmout` (HQ-koodauksen purku + kirkkaiden pintojen pehmeä katto) ja
   `LM_DIR=lmout UNIT_B=1 node opt-apt.mjs …`. Atlakset WebP:ksi `public/models/loft/lm/`, kertoimet
   `public/models/loft/lightmaps.json` (`gain` säätää kokonaiskirkkautta).

