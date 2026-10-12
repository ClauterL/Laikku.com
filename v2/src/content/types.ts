export type Lang = 'fi' | 'en'

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

export interface Content {
  htmlLang: Lang
  title: string
  description: string
  name: string
  nav: { items: Link[]; cta: Link }
  hero: {
    eyebrow: string
    firstName: string
    lastName: string
    role: string
    pitch: string
    primary: Link
    secondary: Link
    available: boolean
    availability: string
    note: string
    image: Img
    cutout: Img
    badges: { label: string; icon: string }[]
  }
  now: { heading: string; items: { title: string; caption: string }[] }
  pillars: { key: string; name: string; text: string; image: Img }[]
  projects: {
    eyebrow: string
    heading: string
    lead: string
    items: {
      tag: string
      title: string
      text: string
      tech: string[]
      image: Img
      href?: string
      linkLabel?: string
    }[]
  }
  dev: {
    eyebrow: string
    heading: string
    lead: string
    activity: {
      title: string
      summary: string
      note: string
      less: string
      more: string
      link: Link
      contributions: string
      streak: string
      longest: string
      repos: string
    }
    repos: { title: string; empty: string; link: Link; updated: string }
    desk: { title: string; lead: string; items: { title: string; text: string; status: string }[] }
    stack: { title: string; items: { name: string; icon: string }[] }
    exploring: { title: string; items: string[] }
    hood: { title: string; rows: { label: string; value: string }[]; updated: string; link: Link }
  }
  about: {
    eyebrow: string
    heading: string
    title: string
    paragraphs: string[]
    quote: string
    portrait: Img
    info: { label: string; value: string; href?: string }[]
    stats: { value: string; label: string }[]
    cv?: Link
    signature: string
  }
  skills: {
    eyebrow: string
    heading: string
    lead: string
    bars: { name: string; level: number }[]
    gridTitle: string
    grid: { name: string; icon: string }[]
    groups: { title: string; items: string[] }[]
  }
  testimonials: {
    eyebrow: string
    heading: string
    lead: string
    placeholder: string
    items: { quote: string; name: string; role: string; placeholder?: boolean }[]
    prev: string
    next: string
  }
  services: { eyebrow: string; heading: string; lead: string; items: { title: string; text: string }[]; link: Link }
  cta: { eyebrow: string; heading: string; text: string; button: Link; image: Img }
  contact: {
    eyebrow: string
    heading: string
    lead: string
    email: string
    location: string
    form: { name: string; email: string; message: string; submit: string; subject: string; hint: string }
    image: Img
  }
  links: { label: string; value: string; href: string }[]
  footer: { place: string; copyright: string; built: string }
  ui: {
    langToggle: string
    skipToContent: string
    externalLink: string
    menu: string
    closeMenu: string
    themeDark: string
    themeLight: string
    months: string[]
    weekdays: string[]
    contributionsOn: (n: number, date: string) => string
  }
}
