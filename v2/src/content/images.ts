import type { Img } from './types'

/* Kuvat ovat public/images-kansiossa WebP-muodossa kahdessa koossa.
   Kaikki henkilökuvat on generoitu Higgsfieldillä Claus-referenssihahmolla.
   Polut ovat tarkoituksella kirjoitettu auki (ei template-merkkijonoja),
   jotta ne löytyvät buildista sellaisenaan. */
type Base = Omit<Img, 'alt'>

export const images: Record<
  'hero' | 'cutout' | 'portrait' | 'builder' | 'adventure' | 'discipline' | 'tyopaja' | 'winter' | 'vest' | 'havaida' | 'demot',
  Base
> = {
  hero: {
    src: '/images/hero-720.webp',
    srcSet: '/images/hero-720.webp 720w, /images/hero-1200.webp 1200w',
    sizes: '(min-width: 1024px) 520px, 90vw',
    width: 1200,
    height: 1490,
  },
  cutout: {
    src: '/images/cutout-720.webp',
    srcSet: '/images/cutout-720.webp 720w, /images/cutout-1200.webp 1200w',
    sizes: '(min-width: 1024px) 520px, 80vw',
    width: 1200,
    height: 1775,
  },
  portrait: {
    src: '/images/portrait-720.webp',
    srcSet: '/images/portrait-720.webp 720w, /images/portrait-1200.webp 1200w',
    sizes: '(min-width: 1024px) 480px, 90vw',
    width: 1200,
    height: 1490,
  },
  builder: {
    src: '/images/builder-640.webp',
    srcSet: '/images/builder-640.webp 640w, /images/builder-1000.webp 1000w',
    sizes: '(min-width: 1024px) 380px, 90vw',
    width: 1000,
    height: 1339,
  },
  adventure: {
    src: '/images/adventure-640.webp',
    srcSet: '/images/adventure-640.webp 640w, /images/adventure-1000.webp 1000w',
    sizes: '(min-width: 1024px) 380px, 90vw',
    width: 1000,
    height: 1339,
  },
  discipline: {
    src: '/images/discipline-640.webp',
    srcSet: '/images/discipline-640.webp 640w, /images/discipline-1000.webp 1000w',
    sizes: '(min-width: 1024px) 380px, 90vw',
    width: 1000,
    height: 1339,
  },
  tyopaja: {
    src: '/images/tyopaja-900.webp',
    srcSet: '/images/tyopaja-900.webp 900w, /images/tyopaja-1400.webp 1400w',
    sizes: '(min-width: 1024px) 400px, 90vw',
    width: 1400,
    height: 781,
  },
  winter: {
    src: '/images/winter-720.webp',
    srcSet: '/images/winter-720.webp 720w, /images/winter-1200.webp 1024w',
    sizes: '(min-width: 1024px) 420px, 90vw',
    width: 1024,
    height: 1536,
  },
  vest: {
    src: '/images/vest-640.webp',
    srcSet: '/images/vest-640.webp 640w, /images/vest-1000.webp 1000w',
    sizes: '(min-width: 1024px) 320px, 60vw',
    width: 1000,
    height: 1500,
  },
  havaida: {
    src: '/images/havaida-800.webp',
    sizes: '(min-width: 1024px) 400px, 90vw',
    width: 800,
    height: 500,
  },
  demot: {
    src: '/images/demot-800.webp',
    sizes: '(min-width: 1024px) 400px, 90vw',
    width: 800,
    height: 500,
  },
}

export const links = {
  instagram: 'https://www.instagram.com/claus.laikku',
  github: 'https://github.com/ClauterL',
  havaida: 'https://havaida.com',
  demot: 'https://havaida.com/demot/',
  email: 'claus@laikku.com',
  repo: 'https://github.com/ClauterL/Laikku.com',
}
