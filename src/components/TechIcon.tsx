import type { ComponentType, SVGProps } from 'react'
import {
  siArduino,
  siBlender,
  siClaude,
  siDocker,
  siGit,
  siGithub,
  siInstagram,
  siNetlify,
  siNextdotjs,
  siNodedotjs,
  siPython,
  siRaspberrypi,
  siReact,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVite,
} from 'simple-icons'
import { Cpu, Drone, FlaskConical, Lightbulb, Printer } from 'lucide-react'

import { cn } from '@/lib/utils'

/* Teknologiaikonit: simple-icons (CC0) brändilogoille, lucide muille.
   `mono: true` → väri periytyy tekstistä (tummat logot toimivat molemmissa teemoissa). */
type SimpleIcon = { title: string; hex: string; path: string }
type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

const registry: Record<string, { si?: SimpleIcon; lucide?: LucideIcon; mono?: boolean }> = {
  react: { si: siReact },
  typescript: { si: siTypescript },
  vite: { si: siVite },
  nextjs: { si: siNextdotjs, mono: true },
  nodejs: { si: siNodedotjs },
  supabase: { si: siSupabase },
  tailwind: { si: siTailwindcss },
  git: { si: siGit },
  netlify: { si: siNetlify },
  python: { si: siPython },
  claude: { si: siClaude },
  docker: { si: siDocker },
  arduino: { si: siArduino },
  raspberrypi: { si: siRaspberrypi },
  blender: { si: siBlender },
  github: { si: siGithub, mono: true },
  instagram: { si: siInstagram },
  playwright: { lucide: FlaskConical, mono: true },
  drone: { lucide: Drone, mono: true },
  electronics: { lucide: Cpu, mono: true },
  printer: { lucide: Printer, mono: true },
  lighting: { lucide: Lightbulb, mono: true },
}

export type TechKey = keyof typeof registry

/** Onko nimelle ikoni (muuten TechIcon ei piirrä mitään) */
export const hasTechIcon = (name: string) => name in registry

export function TechIcon({
  name,
  className,
  brandColor = true,
}: {
  name: string
  className?: string
  /** false → aina currentColor */
  brandColor?: boolean
}) {
  const entry = registry[name]
  if (!entry) return null
  if (entry.lucide) {
    const Icon = entry.lucide
    return <Icon className={cn('size-5', className)} strokeWidth={1.75} aria-hidden />
  }
  const icon = entry.si!
  const color = brandColor && !entry.mono ? `#${icon.hex}` : 'currentColor'
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label={icon.title} className={cn('size-5', className)} style={{ color }}>
      <path d={icon.path} fill="currentColor" />
    </svg>
  )
}
