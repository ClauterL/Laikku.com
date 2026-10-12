export type Lang = 'fi' | 'en'
export type TabId = 'skills' | 'inventory' | 'items' | 'map' | 'quests' | 'order' | 'codex'
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
export type QuestStatus = 'active' | 'done' | 'planned' | 'idea'

export interface Img {
  src: string
  srcSet?: string
  sizes?: string
  alt: string
  width: number
  height: number
}

export interface Link {
  label: string
  href: string
}

/** Esine: pyöreä slotti hahmon ympärillä (varuste/projekti/kieli) tai Tavarat-ruudukon neliö (good). */
export interface Item {
  id: string
  name: string
  kind: 'gear' | 'item' | 'lang' | 'good'
  icon: string // /images/icon-*.webp
  rarity: Rarity
  tag: string
  desc: string
  level?: number // 0–100, varusteilla
  tech?: string[]
  status?: string
  links?: Link[]
  image?: Img
  /** Tavarat-ruudukko: lukumäärä ruudun kulmassa (esim. "2", "96 GB") */
  count?: string
  /** Tavarat-ruudukko: tekniset tiedot tietopaneeliin */
  spec?: { label: string; value: string }[]
}

/** Tavarat-välilehden resurssirivi (Odysseyn ylärivi: kulta, nahka, puu…) */
export interface Resource {
  id: string
  label: string
  icon: string
  /** kiinteä arvo – tai key, jolloin arvo luetaan GitHub-datasta */
  value?: string
  key?: 'commits' | 'repos'
}

export interface Quest {
  id: string
  title: string
  type: 'main' | 'side'
  status: QuestStatus
  progress: number
  giver?: string
  desc: string
  objectives: { text: string; done: boolean }[]
  reward?: string
  links?: Link[]
}

export interface Marker {
  id: string
  name: string
  caption: string
  lat: number
  lon: number
  kind: 'home' | 'travel' | 'quest' | 'offmap'
  desc: string
}

export interface Content {
  htmlLang: Lang
  title: string
  description: string
  name: string
  role: string

  start: { eyebrow: string; press: string; hint: string; loading: string }
  nav: { menu: string; tabs: { id: TabId; label: string }[]; contact: string; sound: string; soundOff: string }

  hud: {
    level: { value: string; label: string; caption: string }
    slots: { id: string; name: string; icon: string; meter: number; caption: string }[]
    bag: { title: string; rows: { key: 'commits' | 'repos' | 'sites' | 'tech' | 'projects'; label: string; value?: string }[] }
  }

  inventory: {
    title: string
    gearTitle: string
    itemsTitle: string
    gear: Item[]
    items: Item[]
    languages: Item[]
    langTitle: string
    rarity: Record<Rarity, string>
    levelLabel: string
    statusLabel: string
    techLabel: string
    linksLabel: string
    equipped: string
  }

  /** Tavarat: Odyssey-tyylinen esineruudukko */
  goods: {
    title: string
    lead: string
    resources: Resource[]
    groups: { id: string; title: string; items: Item[] }[]
    countLabel: string
    specLabel: string
    hint: string
    xp: { label: string; value: number; max: number }
  }

  skills: {
    title: string
    lead: string
    branches: { title: string; nodes: { name: string; icon: string; level: number; desc: string }[] }[]
    unlocked: string
    mastery: string
  }

  map: {
    title: string
    lead: string
    markers: Marker[]
    legend: Record<Marker['kind'], string>
    fastTravel: string
    offmapHint: string
    /** Käsin kirjoitetut aluenimet kartalla */
    regions: { name: string; lat: number; lon: number; size: 'lg' | 'md' | 'sm' }[]
    /** Reitit: merkkien id:t järjestyksessä (suurympyrä / välipisteet) */
    routes: { id: string; label: string; kind: 'travel' | 'plan'; points: [number, number][] }[]
    ui: { zoomIn: string; zoomOut: string; reset: string; fog: string; explored: string; coords: string }
  }

  quests: {
    title: string
    lead: string
    mainTitle: string
    sideTitle: string
    main: Quest
    side: Quest[]
    status: Record<QuestStatus, string>
    objectives: string
    reward: string
    progress: string
  }

  order: {
    title: string
    lead: string
    name: string
    tagline: string
    desc: string
    services: { title: string; text: string }[]
    link: Link
    cta: Link
    founded: string
  }

  codex: {
    title: string
    lead: string
    paragraphs: string[]
    quote: string
    info: { label: string; value: string; href?: string }[]
    stats: { value: string; label: string }[]
    links: { label: string; value: string; href: string }[]
    cv?: Link
    contactTitle: string
    form: { name: string; email: string; message: string; submit: string; subject: string; hint: string }
    portrait: Img
    builtWith: string
  }

  hints: { details: string; stats: string; select: string; back: string; prevTab: string; nextTab: string; mute: string; move: string }

  ui: {
    langToggle: string
    close: string
    menu: string
    settings: string
    ambient: string
    ambientHint: string
    sfx: string
    source: string
    github: string
    copyright: string
    place: string
  }
}
