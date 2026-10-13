import { fi } from './fi'
import { en } from './en'
import type { Content, Lang } from './types'

export const content: Record<Lang, Content> = { fi, en }
export type { Content, Lang, Img, Link, Item, Resource, Quest, Marker, TabId, Rarity, QuestStatus, LoftZoneId } from './types'
export { images, icons, goods, backgrounds, emblem, links } from './images'
