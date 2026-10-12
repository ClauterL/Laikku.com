import { fi } from './fi'
import { en } from './en'
import type { Content, Lang } from './types'

export const content: Record<Lang, Content> = { fi, en }
export type { Content, Lang, Img, Link } from './types'
export { images, links } from './images'
