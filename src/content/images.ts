import critterData from '@/data/critters.json'
import raccoonData from '@/data/game-raccoon.json'

import type { Img } from './types'

/* Kuvat public/images-kansiossa. Henkilökuvat on generoitu Higgsfieldillä
   Claus-referenssihahmolla; esineikonit ja taustat samalla tyylillä. */
type Base = Omit<Img, 'alt'>

export const images = {
  /** hahmo keskellä (taustanpoistettu) */
  character: {
    src: '/images/character-800.webp',
    srcSet: '/images/character-800.webp 800w, /images/character-1300.webp 1300w',
    sizes: '(min-width: 1024px) 560px, 90vw',
    width: 1300,
    height: 2313,
  } satisfies Base,
  portrait: {
    src: '/images/portrait-720.webp',
    srcSet: '/images/portrait-720.webp 720w, /images/portrait-1200.webp 1200w',
    sizes: '(min-width: 1024px) 420px, 90vw',
    width: 1200,
    height: 1490,
  } satisfies Base,
  builder: { src: '/images/builder-640.webp', width: 640, height: 857 } satisfies Base,
  adventure: { src: '/images/adventure-640.webp', width: 640, height: 857 } satisfies Base,
  discipline: { src: '/images/discipline-640.webp', width: 640, height: 857 } satisfies Base,
  tyopaja: { src: '/images/tyopaja-900.webp', width: 900, height: 502 } satisfies Base,
  winter: { src: '/images/winter-720.webp', width: 720, height: 1080 } satisfies Base,
  havaida: { src: '/images/havaida-800.webp', width: 800, height: 500 } satisfies Base,
  demot: { src: '/images/demot-800.webp', width: 800, height: 500 } satisfies Base,
  /** Hero: Claus järven rannalla auringonlaskussa (Higgsfield, Claus-referenssi) */
  clausLake: {
    src: '/images/claus-lake-720.webp',
    srcSet: '/images/claus-lake-720.webp 720w, /images/claus-lake-1200.webp 1200w',
    sizes: '(min-width: 1280px) 290px, (min-width: 768px) 240px, 64px',
    width: 1200,
    height: 1500,
  } satisfies Base,
  /** Suosittelijoiden esittelykuvat (Higgsfield, heidän omista kuvistaan luvalla) */
  refNetta: {
    src: '/images/ref-netta-600.webp',
    srcSet: '/images/ref-netta-600.webp 600w, /images/ref-netta-960.webp 960w',
    sizes: '(min-width: 1024px) 620px, 100vw',
    width: 960,
    height: 1200,
  } satisfies Base,
  refRiku: {
    src: '/images/ref-riku-600.webp',
    srcSet: '/images/ref-riku-600.webp 600w, /images/ref-riku-960.webp 960w',
    sizes: '(min-width: 1024px) 620px, 100vw',
    width: 960,
    height: 1200,
  } satisfies Base,
  refChristian: {
    src: '/images/ref-christian-600.webp',
    srcSet: '/images/ref-christian-600.webp 600w, /images/ref-christian-960.webp 960w',
    sizes: '(min-width: 1024px) 620px, 100vw',
    width: 960,
    height: 1200,
  } satisfies Base,
  refMika: {
    src: '/images/ref-mika-600.webp',
    srcSet: '/images/ref-mika-600.webp 600w, /images/ref-mika-960.webp 960w',
    sizes: '(min-width: 1024px) 620px, 100vw',
    width: 960,
    height: 1200,
  } satisfies Base,
  refMiitri: {
    src: '/images/ref-miitri-600.webp',
    srcSet: '/images/ref-miitri-600.webp 600w, /images/ref-miitri-960.webp 960w',
    sizes: '(min-width: 1024px) 620px, 100vw',
    width: 960,
    height: 1200,
  } satisfies Base,
  refTeemu: {
    src: '/images/ref-teemu-600.webp',
    srcSet: '/images/ref-teemu-600.webp 600w, /images/ref-teemu-960.webp 960w',
    sizes: '(min-width: 1024px) 620px, 100vw',
    width: 960,
    height: 1200,
  } satisfies Base,
}

/** Esineikonit (1:1 WebP) */
export const icons = {
  code: '/images/icon-code.webp',
  ai: '/images/icon-ai.webp',
  electronics: '/images/icon-electronics.webp',
  drone: '/images/icon-drone.webp',
  waretrack: '/images/icon-waretrack.webp',
  kerros: '/images/icon-kerros.webp',
  nfc: '/images/icon-nfc.webp',
  games: '/images/icon-games.webp',
  compass: '/images/icon-compass.webp',
  web: '/images/icon-web.webp',
  study: '/images/icon-study.webp',
  adventure: '/images/icon-adventure.webp',
  react: '/images/icon-react.webp',
  typescript: '/images/icon-typescript.webp',
  python: '/images/icon-python.webp',
  node: '/images/icon-node.webp',
  supabase: '/images/icon-supabase.webp',
  tailwind: '/images/icon-tailwind.webp',
}

/** Tavarat-ruudukon esineet (1:1 WebP, tumma liuskekivitausta + harvinaisuushehku) */
export const goods = {
  cpu: '/images/good-cpu.webp',
  ram: '/images/good-ram.webp',
  gpu: '/images/good-gpu.webp',
  nvme: '/images/good-nvme.webp',
  ssd: '/images/good-ssd.webp',
  pool: '/images/good-pool.webp',
  mobo: '/images/good-mobo.webp',
  monitor: '/images/good-monitor.webp',
  streamdeck: '/images/good-streamdeck.webp',
  tablet: '/images/good-tablet.webp',
  esp32: '/images/good-esp32.webp',
  nfctags: '/images/good-nfctags.webp',
  drone: '/images/good-drone.webp',
  robot: '/images/good-robot.webp',
  solder: '/images/good-solder.webp',
  meter: '/images/good-meter.webp',
  keyboard: '/images/good-keyboard.webp',
  mouse: '/images/good-mouse.webp',
  headset: '/images/good-headset.webp',
  excavator: '/images/good-excavator.webp',
  boat: '/images/good-boat.webp',
  claude: '/images/good-claude.webp',
  claudecode: '/images/good-claudecode.webp',
  ollama: '/images/good-ollama.webp',
  supabase: '/images/good-supabase.webp',
  netlify: '/images/good-netlify.webp',
  github: '/images/good-github.webp',
  n8n: '/images/good-n8n.webp',
  docker: '/images/good-docker.webp',
  blender: '/images/good-blender.webp',
  tailscale: '/images/good-tailscale.webp',
  higgsfield: '/images/good-higgsfield.webp',
  oskeys: '/images/good-oskeys.webp',
  obsidian: '/images/good-obsidian.webp',
  vast: '/images/good-vast.webp',
}

/** Normaalin portfolion kuvakkeet (osaamisalueet ja projektit, id:n mukaan): Higgsfieldillä sivun oman
 *  maisemakuvituksen tyyliin – litteät kerrokselliset auringonlaskun siluetit, ei tekstiä eikä logoja */
export const pfIcons: Record<string, string> = {
  code: '/images/pf-code.webp',
  ai: '/images/pf-ai.webp',
  electronics: '/images/pf-electronics.webp',
  drones: '/images/pf-drones.webp',
  waretrack: '/images/pf-waretrack.webp',
  kerros: '/images/pf-kerros.webp',
  nfc: '/images/pf-nfc.webp',
  games: '/images/pf-games.webp',
}

/** Taustakuvat */
export const backgrounds = {
  menu: '/images/bg-menu.webp',
  map: '/images/bg-map.webp',
}

export const links = {
  instagram: 'https://www.instagram.com/cl_laikku/',
  github: 'https://github.com/ClauterL',
  havaida: 'https://havaida.com',
  demot: 'https://havaida.com/demot/',
  games: 'https://github.com/ClauterL/laikku-games',
  play: 'https://havaida-games.netlify.app',
  dev: 'https://laikku.dev',
  email: 'claikku@gmail.com',
  repo: 'https://github.com/ClauterL/Laikku.com',
}

/** Normaalin portfolion hero-maisema: Higgsfieldillä tehty oma sommitelma (Järvi-Suomi auringonlaskussa),
    leikattu läpinäkyviksi syvyystasoiksi parallaksia varten. Kaikki tasot samaa kokoa (3840×1118). */
const heroLayer = (n: string) => ({
  src: `/images/hero-${n}-2048.webp`,
  srcSet: `/images/hero-${n}-1280.webp 1280w, /images/hero-${n}-2048.webp 2048w, /images/hero-${n}-3840.webp 3840w`,
})
export const heroScene = {
  width: 3840,
  height: 1118,
  sizes: '(max-width: 923px) 960px, 104vw',
  far: heroLayer('far'),
  lake: heroLayer('lake'),
  mid: heroLayer('mid'),
  near: heroLayer('near'),
  front: heroLayer('front'),
}

/** Aloitusruudun revontuliyö: samat tasot yöväreissä (scripts/hero-night.py, luminanssin liukuväri tasoittain).
    Ladataan vain aloitusruudulla, ja ne häivytetään päivätasojen päälle. */
export const heroNight = {
  far: heroLayer('far-night'),
  lake: heroLayer('lake-night'),
  mid: heroLayer('mid-night'),
  near: heroLayer('near-night'),
  front: heroLayer('front-night'),
}

/** Alaosioiden eläinvarjot: Higgsfield-videoista (Kling 3.0 / Seedance 2.5, aloitus = lopetusruutu) irrotetut siluetit
    ruudukkoina (valkoinen + alfa), käytetään CSS-maskina currentColor-värillä. Metatiedot src/data/critters.json:
    ruutu w×h, cols×rows, frames; peura/pesukarhu ms = kunkin ruudun kesto videon ajoituksella;
    karhu stride = kehon eteneminen ruutua kohden solun pikseleinä (tassut pysyvät maassa), rest = seisovat ruudut. */
/** Dronelento (pelillistetty portfolio): Higgsfield-kuvat (GPT Image 2.5, tyyliviitteenä hero-maisema) →
    scripts/game-assets.py (taustanpoisto + yöversio), liikkuvat osat → scripts/game-props.py ja pesukarhun eleet
    Kling 3.0 -videoista → scripts/game-raccoon.py */
const gameImg = (n: string) => ({ day: `/images/game/${n}.webp`, night: `/images/game/${n}-night.webp` })
export const gameArt = {
  dock: gameImg('dock'),
  sauna: gameImg('sauna'),
  workshop: gameImg('workshop'),
  island: gameImg('island'),
  shed: gameImg('shed'),
  harbor: gameImg('harbor'),
  campfire: gameImg('campfire'),
  tower: gameImg('tower'),
  lighthouse: gameImg('lighthouse'),
  drone: gameImg('drone'),
  shore: gameImg('shore'),
  forest: gameImg('forest'),
  /** sataman kerrokset (scripts/game-props.py): keinuva vene laiturin takana, laituri ilman maalattua viiriä */
  harborBoat: gameImg('harbor-boat'),
  harborPier: gameImg('harbor-pier'),
  /** järvellä liikkuvat veneet (sivukuva) */
  rowboat: { ...gameImg('rowboat'), ar: 560 / 134 },
  sailboat: { ...gameImg('sailboat'), ar: 420 / 515 },
  waterdrone: { ...gameImg('waterdrone'), ar: 620 / 200 },
  raccoon: { src: '/images/game/raccoon.webp', ...raccoonData },
}

/** Dronelennon aitan esineet: Higgsfield GPT Image 2.5 samaan litteään auringonlaskutyyliin (yksi esine, ei tekstiä
    eikä logoja – ohjelmistot esineinä) → scripts/game-items.py. Avain = goods-esineen id. */
const GAME_ITEMS = [
  'cpu', 'ram', 'gpu', 'nvme', 'ssd', 'pool', 'mobo', 'monitor',
  'excavator', 'drone', 'robot', 'boat', 'streamdeck', 'tablet', 'esp32', 'nfctags', 'solder', 'meter', 'keyboard', 'mouse', 'headset',
  'claude', 'claudecode', 'ollama', 'higgsfield', 'supabase', 'netlify', 'n8n', 'blender', 'vast', 'github', 'docker', 'tailscale', 'oskeys', 'obsidian',
] as const
export const gameItems: Record<string, string> = Object.fromEntries(GAME_ITEMS.map((id) => [id, `/images/game/items/${id}.webp`]))

export const critterSprites = {
  bear: { src: '/images/critter-bear.webp', ...critterData.bear },
  deer: { src: '/images/critter-deer.webp', ...critterData.deer },
  raccoon: { src: '/images/critter-raccoon.webp', ...critterData.raccoon },
}
