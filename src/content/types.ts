export type Lang = 'fi' | 'en'
export type TabId = 'skills' | 'inventory' | 'items' | 'map' | 'quests' | 'order' | 'codex'
/** 3D-loftin vyöhykkeet (kävijän reitti 1–12) */
export type LoftZoneId =
  | 'elevator'
  | 'library'
  | 'hobbies'
  | 'trophies'
  | 'desk'
  | 'servers'
  | 'maker'
  | 'window'
  | 'arcade'
  | 'meeting'
  | 'warroom'
  | 'workshop'
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
  /** Oikea brändilogo (simple-icons, TechIcon-avain) – korvaa ikonikuvan slotissa */
  logo?: string
  rarity: Rarity
  tag: string
  desc: string
  level?: number // 0–100, varusteilla (ei näytetä numerona)
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
  /** quest = haaste, bucket = bucket list -kohde */
  kind: 'home' | 'travel' | 'quest' | 'bucket' | 'offmap'
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
    legend: Partial<Record<Marker['kind'], string>>
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
    /** Koodeksi pelin tietokannan tapaan: kategoriat vasemmalla, merkintä keskellä, kuva oikealla */
    book: {
      hint: string
      markAll: string
      /** Kategoriat; suosittelijat-kategorian merkinnät tulevat references-kentästä */
      categories: { id: 'about' | 'facts' | 'refs' | 'contact'; title: string; image: Img }[]
      /** Yksi merkintä per kategoria: Claus Laikku (tarina, vapaa-aika, motto), Tiedot (perustiedot, tilastot, linkit), Yhteydenotto */
      entries: Record<'about' | 'facts' | 'contact', { title: string; image: Img }>
      /** Väliotsikot merkintöjen sisällä */
      sections: Record<'free' | 'motto' | 'info' | 'stats' | 'links', string>
    }
    /** Suosittelijat: koodeksin kategoria (kuva = suosittelijan kuva, luvalla).
     *  Loftin neuvottelupöytä avaa tämän kohdan. */
    references: {
      title: string
      lead: string
      /** Näytetään, kun julkaistuja suosituksia ei vielä ole */
      empty: string
      cta: string
      /** Näppäinohje listan alla */
      hint: string
      /** Merkki luonnokselle (näkyy vain kehitystilassa ja esikatselussa) */
      draft: string
      /** Kuvan paikalla, kun suosittelijan kuvaa ei vielä ole */
      photoSoon: string
      /** Linkki suosittelijan profiiliin */
      profile: string
      items: {
        name: string
        role: string
        org?: string
        quote: string
        href?: string
        /** Suosittelijan oma kuva (public/images/ref-*.webp, luvalla) */
        photo?: Img
        /** Luonnos: ei näy julkaistulla sivulla ennen suosittelijan hyväksyntää */
        draft?: boolean
      }[]
    }
  }

  /** 3D-loft: kolmannen persoonan portfolio, esineet avaavat osiot */
  loft: {
    open: string
    openHint: string
    title: string
    exit: string
    loading: string
    noWebgl: string
    prompt: string
    quick: string
    quickHint: string
    close: string
    /** Näkymän vaihto: ensimmäinen / kolmas persoona */
    fps: string
    tps: string
    /** Ohje hiirikatseelle (pointer lock) */
    mouseLook: string
    controls: { move: string; run: string; look: string; interact: string; quick: string; view: string }
    /** Linkkikohteet (työkone, arcade, palvelimet): kortti ennen siirtymistä */
    link: { open: string; newTab: string }
    /** Työhuoneen näytöt (canvas-tekstuurit): TV-seinä, työkoneen ultrawide ja pystynäyttö */
    screens: {
      ops: { title: string; net: string; services: string; items: string[] }
      git: { title: string; contributions: string; repos: string }
      dev: { title: string; lead: string; tiles: string[] }
      code: string[]
    }
    zones: {
      id: LoftZoneId
      name: string
      note: string
      /** Ulkoinen sivu – kohde avaa linkkikortin osion sijaan */
      link?: { label: string; href: string; desc: string }
    }[]
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
