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
Sivu avautuu aloitusruutuun, jossa on tunnus – kuvake ihmisestä läppärin takana, näytöllä `<#>` ja
pääsiäismunana SMART morsena – ja kävijä valitsee **Normaali** tai
**Pelillistetty**. Aloitusruudun taustana on sama Järvi-Suomen maisema kuin normaalin portfolion herossa:
Normaali-valinta näyttää kultaisen auringonlaskun, Pelillistetty revontuliyön, ja valitun kortin päällä
istuva pesukarhu hyppää kortilta toiselle. Pelillistetty on **Kahvijahti** (`#quest`): avoin low-poly-Järvi-Suomi
isometrisessä 3D:ssä (React Three Fiber), jossa pesukarhu kiertää saarta tabletti tassuissa – yhdeksän paikkaa avaa
portfolion osiot tabletissa – ja etsii kahvia, donitseja ja burritoja; katoilta ja vedestä ne haetaan dronella, ja
kumiankka neuvoo (rubber duck debugging). Normaali on perinteinen yhden sivun portfolio (`#portfolio`, suora linkki
ohittaa aloitusruudun) samasta sisällöstä. Aiemmat pelillistetyt versiot ovat tallessa varmuuskopioina: dronelento
järven yli (`#flight`) sekä 3D-loft + pelivalikko (osoite `#loft`, haara `loft-3d-backup`).
Kaksikielinen (fi/en), näppäimistöllä navigoitava, pelillistetyssä ääniefektit.

## Stack

| Osa           | Mitä                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| Runko         | React 19 · Vite 8 · TypeScript                                                         |
| Tyylit        | Tailwind CSS 4 (`@tailwindcss/vite`) · `tw-animate-css`                                |
| Komponentit   | shadcn/ui-tyyliset Radix-primitiivit: Tabs (välilehdet), Dialog (esineen tiedot), Sheet (valikko), Tooltip, ToggleGroup (kieli), Button, Badge |
| Ikonit        | lucide-react (UI) · simple-icons (teknologialogot taitopuussa)                         |
| Äänet         | Web Audio API, syntetisoidut efektit (`src/lib/sfx.ts`) – ei äänitiedostoja            |
| Kuvat         | Higgsfield: hahmo Claus-referenssihahmolla + taustanpoisto, 18 ympyräikonia + 35 Tavarat-esinettä fotorealistisella AC Odyssey -esinetyylillä (tumma liuskekivitausta, harvinaisuushehku), tunnuksen paljastusvideo, 2 taustaa (`public/images`) |
| Data          | `scripts/fetch-github.mjs` hakee julkiset GitHub-tiedot build-aikana → `src/data/github.json` · `scripts/fetch-leetcode.mjs` → `src/data/leetcode.json` (LeetCode-tilastot) · `scripts/build-world.mjs` → `src/data/world.json` (maailmankartta) |
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
npm run fetch:leetcode # päivitä vain src/data/leetcode.json
```

Node ≥ 22.12.

## Rakenne

```
src/
  App.tsx                    tilat: aloitus → normaali (#portfolio) tai pelillistetty (#quest; varmuuskopiot #flight, #loft, #inventory …)
  index.css                  teema-tokenit (nahka/messinki/pergamentti/hiillos/teal), utilityt
  lib/sfx.ts                 ääniefektit: tick, select, back, tab, open, close, boot, unlock, pickup, quack, drone, ambient
  content/
    types.ts                 sisältömalli (Item, Quest, Marker, …)
    fi.ts, en.ts             KAIKKI TEKSTIT – muokkaa näitä
    images.ts                kuvat, ikonit (icon-*), Tavarat-esineet (good-*), tunnus, taustat, linkit
  components/portfolio/      normaali portfolio samasta sisällöstä: Portfolio, Sections, Landscape (HeroScene: Higgsfield-tasoista koottu elävä parallaksimaisema + alatunnisteen harjanne), hooks, nav
  components/quest/           KAHVIJAHTI (pelillistetty): QuestGame (HUD, tabletti, ankan puhekupla, ohjaus), Scene (maasto, vesi, metsä, paikat, herkut, pelisilmukka + kamera), models (low-poly-mallit koodilla), world (kartta, paikat, herkut, törmäykset), kit (paletti, mallien paisto)
  components/flight/          DRONELENTO (varmuuskopio, #flight): FlightGame, world, Panels (kohteiden sisällöt – myös Kahvijahti käyttää näitä)
  components/game/
    StartScreen              aloitusruutu: maisema (HeroScene night), tunnus + nimi, valinta Normaali (auringonlasku) / Pelillistetty (revontuliyö, avaa äänen)
    StartSky, StartRaccoon   aloitusruudun taivas (tähdet, kuu, revontuliverhot, tähdenlento) · kortilta toiselle hyppäävä pesukarhu
    GameShell                pelivalikon välilehdet, näppäimet (Q/E, M) ja 3D-loft (Esc loftissa → valikko)
    TopBar, BottomBar        valikko + välilehdet + ääni/kieli · näppäinvihjeet
    InventoryScreen          hahmo, slotit, kielipalkki, taso, HUD-slotit, reppu, tietokaista
    GoodsScreen              Tavarat: resurssirivi + XP, 3 ryhmää × 4 ruutua/rivi, kelluva tietopaneeli, nuolinavigointi
    Slot, ItemDialog         pyöreä slotti + tietoikkuna
    SkillsScreen             taitopuu (3 haaraa, tasorenkaat)
    MapScreen                oikea maailmankartta (SVG, d3-geo + TopoJSON), fog of war, reitit, zoom, pikamatkustus
    QuestsScreen             pää- ja sivutehtävät, tavoitteet, eteneminen
    OrderScreen              Havaida Oy ("kilta")
    CodexScreen              minusta, tiedot, tilastot, yhteydenotto (mailto), suosittelijat (#codex-references)
  components/loft/
    zones.ts                 kerros 5: koti, hissiaula ja työ-siipi, 12 kohdetta (osio, osion kohta tai ulkoinen linkki), esineiden sijoittelu
    colliders.json           generoitu kerroksen geometriasta (scripts/loft/floor5/s4_colliders.py) – törmäykset ja kameran esteet
    nav.json, dogNav.ts      robottikoiran kulkuruudukko (walk-check.mjs, NAV=…) ja A*-reitinhaku
    LoftScene                kerros (yksi paistettu malli), Fab-esineet (myös animoidut, esim. robottikäsi), hahmo (ecctrl + Rapier), kamerat
    RoboDog                  robottikoira vaeltaa satunnaisesti, väistää pelaajaa ja tervehtii lähelle tultaessa
    Screens                  työhuoneen näytöt: canvas-tekstuurit (ohjauspaneeli, GitHub-aktiivisuus, laikku.dev, koodi)
    LoftView                 #loft-näkymä: canvas, latausilmaisin, kehote (E), pikavalikko (Q), näkymä (V), joystick, osiopaneeli, linkkikortti
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
- Tunnus: `src/components/Logo.tsx` (Higgsfieldin kuvake vektoroituna, `<#>` + morse-pääsiäismuna yksi merkki kerrallaan, `play="loop" | "hover"`);
  favikoni `favicon.png` renderöity samasta polusta.
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

### Kerros 5 (nykyinen pohja: koti + aula + työ-siipi)

Huoneet on järjestetty aulan ympärille (`scripts/loft/floor5/`, Blender 5.2 Python-moduulina:
`python -m venv venv && venv/bin/pip install bpy==5.2.2`). Työkansio `P5_WORK` (oletus `./work5`).

1. `node prep5.mjs apt-raw.glb $P5_WORK/apt-named.glb` – nimetty, kevennetty asunto (ei UE:n valokarttoja).
2. Blender (`cd floor5`, ajo `venv/bin/python -c "exec(open('s0_import.py').read())"` jne.):
   `s0_import.py` → `s1_build.py` (koti: makuuhuoneesta työhuone; aula ja työ-siipi seinineen, ovineen,
   lasiseinineen, kalusteineen ja valoineen) → `s2_bake.py res=2048 dens=24 spp=96` (valokartta-UV:t
   objektikohtaisina laattoina atlaksiin, Cycles-paisto suora + epäsuora valo, OIDN-kohinanpoisto, glTF-vienti)
   → `s3_encode.py` (EXR → PNG-atlakset ja `lightmaps.json`). `r_top.py` / `r_persp.py` tekevät tarkistuskuvat.
3. `node opt5.mjs $P5_WORK/out/floor5.glb ../../public/models/loft/apartment.glb` ja atlakset WebP:ksi `public/models/loft/lm/`.
4. `s4_colliders.py out=../../src/components/loft/colliders.json` (Blenderissä) – törmäykset todellisesta geometriasta:
   kolmiot hahmon korkeudelta 5 cm ruudukkoon ja suorakulmioiksi (oviaukot ja L-muotoiset ikkunat pysyvät auki).
5. `node walk-check.mjs kartta.png reitit.json` – kulkutarkistus: jokaiseen huoneeseen ja vyöhykkeeseen pääsee aloituspaikasta
   (hahmon kapselin säde 0,26 m), kartta näyttää kuljettavan alueen ja Rapier-fysiikkatesti kävelee reitit.
   `COLLIDERS=…json` testaa uudet esineet ennen paistoa, `NAV=../../src/components/loft/nav.json` kirjoittaa robottikoiran ruudukon.
6. `s5_screens.py` – näyttöjen pinnat (TV-seinä, työkoneen näytöt) omaksi `public/models/loft/screens.glb`:ksi.
7. Animoidut Fab-esineet (robottikäsi, robottikoira): `node opt-anim.mjs scene.gltf ../../public/models/loft/<nimi>.glb 1024 14000`
   (solmuhierarkia ja animaatiot säilyvät).

