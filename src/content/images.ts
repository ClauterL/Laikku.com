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

/** Taustakuvat */
export const backgrounds = {
  menu: '/images/bg-menu.webp',
  map: '/images/bg-map.webp',
}

export const links = {
  instagram: 'https://www.instagram.com/claus.laikku',
  github: 'https://github.com/ClauterL',
  havaida: 'https://havaida.com',
  demot: 'https://havaida.com/demot/',
  games: 'https://github.com/ClauterL/laikku-games',
  play: 'https://havaida-games.netlify.app',
  dev: 'https://laikku.dev',
  email: 'claus@laikku.com',
  repo: 'https://github.com/ClauterL/Laikku.com',
}
