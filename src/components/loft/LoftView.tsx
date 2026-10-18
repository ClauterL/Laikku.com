import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { Canvas } from '@react-three/fiber'
import { useProgress } from '@react-three/drei'
import { Joystick } from 'ecctrl/input'
import { ArrowLeft, ArrowUpRight, Eye, LayoutGrid, Mouse, User, X } from 'lucide-react'

import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { Content, LoftZoneId, TabId } from '@/content'
import { SkillsScreen } from '@/components/game/SkillsScreen'
import { InventoryScreen } from '@/components/game/InventoryScreen'
import { GoodsScreen } from '@/components/game/GoodsScreen'
import { MapScreen } from '@/components/game/MapScreen'
import { QuestsScreen } from '@/components/game/QuestsScreen'
import { OrderScreen } from '@/components/game/OrderScreen'
import { CodexScreen } from '@/components/game/CodexScreen'
import { LoftScene, type CamView } from './LoftScene'
import { ZONES } from './zones'

const SCREENS: Record<Exclude<TabId, 'order'>, ComponentType> = {
  skills: SkillsScreen,
  inventory: InventoryScreen,
  items: GoodsScreen,
  map: MapScreen,
  quests: QuestsScreen,
  codex: CodexScreen,
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function isTouch(): boolean {
  try {
    return window.matchMedia('(pointer: coarse)').matches
  } catch {
    return false
  }
}

/** Latausilmaisin mallien haun ajan (asunto on ~11 Mt) */
function Loading() {
  const { t } = useLang()
  const { active, progress } = useProgress()
  if (!active && progress >= 100) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-bg/80">
      <div className="w-64 text-center">
        <p className="label-caps">{t.loft.loading}…</p>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-bg-2">
          <div className="h-full bg-brass transition-[width] duration-300" style={{ width: `${Math.round(progress)}%` }} />
        </div>
        <p className="mt-2 font-display text-xs text-ink-2">{Math.round(progress)} %</p>
      </div>
    </div>
  )
}

type ZoneLink = NonNullable<Content['loft']['zones'][number]['link']>

/** Avattu osio loftin päällä; section = kohta, johon vieritetään (esim. suosittelijat) */
function Panel({
  title,
  tab,
  section,
  onTab,
  onClose,
}: {
  title: string
  tab: TabId
  section?: string
  onTab: (t: TabId) => void
  onClose: () => void
}) {
  const { t } = useLang()
  const Screen = tab === 'order' ? null : SCREENS[tab]
  const bodyRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!section) return
    const id = requestAnimationFrame(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>(`#${section}`)
      el?.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(id)
  }, [section, tab])
  return (
    <div className="absolute inset-0 z-30 flex justify-end bg-bg/40 backdrop-blur-[2px]" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="panel screen-in flex h-full w-full max-w-[1100px] flex-col border-l border-line"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="font-display text-sm uppercase tracking-[0.2em] text-brass-2">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.loft.close}
            title={`${t.loft.close} (Esc)`}
            className="grid size-9 place-items-center rounded-sm border border-line bg-bg-2/70 text-ink-2 transition-colors hover:border-brass hover:text-brass-2 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </header>
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto">
          {Screen ? <Screen /> : <OrderScreen onSelectTab={onTab} />}
        </div>
      </section>
    </div>
  )
}

/** Linkkikohde (työkone, palvelinkaappi, arcade): kortti, josta ulkoinen sivu aukeaa uuteen välilehteen */
function LinkCard({ name, link, onClose }: { name: string; link: ZoneLink; onClose: () => void }) {
  const { t } = useLang()
  const { play } = useSound()
  const ref = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    ref.current?.focus()
  }, [])
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg/50 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={name}
        className="panel corners screen-in w-full max-w-md rounded-sm border border-line p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="label-caps">{name}</p>
            <h2 className="mt-1 break-words font-display text-lg tracking-[0.06em] text-brass-2">{link.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.loft.close}
            title={`${t.loft.close} (Esc)`}
            className="grid size-9 shrink-0 place-items-center rounded-sm border border-line bg-bg-2/70 text-ink-2 transition-colors hover:border-brass hover:text-brass-2 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{link.desc}</p>
        <a
          ref={ref}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => play('tick')}
          onClick={() => {
            play('select')
            onClose()
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-sm border border-brass/70 bg-brass/10 px-4 py-2.5 font-display text-[0.72rem] uppercase tracking-[0.2em] text-brass-2 outline-none transition-colors hover:bg-brass/20 focus-visible:ring-2 focus-visible:ring-brass"
        >
          {t.loft.link.open}
          <ArrowUpRight className="size-4" />
        </a>
        <p className="mt-2 text-xs text-muted-foreground">{t.loft.link.newTab}</p>
      </section>
    </div>
  )
}

export default function LoftView({ onExit }: { onExit: () => void }) {
  const { t } = useLang()
  const { play } = useSound()
  const [webgl] = useState(hasWebGL)
  const [touch] = useState(isTouch)
  const [near, setNear] = useState<LoftZoneId | null>(null)
  const [open, setOpen] = useState<{ zone: LoftZoneId; tab?: TabId; section?: string } | null>(null)
  const [quick, setQuick] = useState(false)
  const [view, setView] = useState<CamView>('tps')
  const [locked, setLocked] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Hiirikatse: osoittimen lukitus näkymään (työpöytä)
  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement === canvasRef.current)
    document.addEventListener('pointerlockchange', onChange)
    return () => {
      document.removeEventListener('pointerlockchange', onChange)
      if (document.pointerLockElement) document.exitPointerLock()
    }
  }, [])
  const requestLook = useCallback(() => {
    const c = canvasRef.current
    if (!c || touch || document.pointerLockElement === c) return
    try {
      const r = c.requestPointerLock() as unknown as Promise<void> | undefined
      r?.catch?.(() => undefined)
    } catch {
      /* selain ei tue: katse vedetään hiirellä */
    }
  }, [touch])
  const toggleView = useCallback(() => {
    play('tick')
    setView((v) => (v === 'tps' ? 'fps' : 'tps'))
  }, [play])

  const zoneText = useMemo(() => new Map(t.loft.zones.map((z) => [z.id, z])), [t])
  const tabLabel = useMemo(() => new Map(t.nav.tabs.map((x) => [x.id, x.label])), [t])

  const openZone = useCallback(
    (id: LoftZoneId) => {
      const z = ZONES.find((x) => x.id === id)
      if (!z || (!z.tab && !zoneText.get(id)?.link)) return
      play('open')
      setQuick(false)
      setOpen({ zone: id, tab: z.tab, section: z.section })
    },
    [play, zoneText],
  )

  const onNear = useCallback(
    (id: LoftZoneId | null) => {
      setNear(id)
      if (id) play('tick')
    },
    [play],
  )

  const close = useCallback(() => {
    play('close')
    setOpen(null)
  }, [play])

  // E / Enter avaa lähimmän, Esc sulkee, Q pikavalikko
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (e.key === 'Escape') {
        if (open) close()
        else if (quick) setQuick(false)
        return
      }
      if (open) return
      if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter') && near) {
        e.preventDefault()
        openZone(near)
      } else if (e.key === 'q' || e.key === 'Q') {
        play(quick ? 'close' : 'open')
        setQuick((v) => !v)
      } else if (e.key === 'v' || e.key === 'V') {
        toggleView()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [near, open, quick, close, openZone, play, toggleView])

  const nearZone = near ? zoneText.get(near) : null
  const nearTab = near ? ZONES.find((z) => z.id === near)?.tab : undefined
  /** Kehotteen ja pikavalikon kohde: osion nimi tai linkin osoite */
  const target = (id: LoftZoneId, tab?: TabId) => {
    const link = zoneText.get(id)?.link
    return link ? `${link.label} ↗` : tab ? tabLabel.get(tab) : ''
  }
  const openText = open ? zoneText.get(open.zone) : undefined
  const openTitle = open ? `${openText?.name ?? ''} · ${open.tab ? tabLabel.get(open.tab) ?? '' : ''}` : ''

  return (
    <div className="fixed inset-0 z-50 bg-bg" role="application" aria-label={t.loft.title}>
      {webgl ? (
        <>
          <Canvas
            ref={canvasRef}
            onPointerMissed={() => {
              if (!open && !quick) requestLook()
            }}
            shadows={!touch}
            dpr={touch ? [1, 1.5] : [1, 1.75]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            camera={{ fov: 55, near: 0.05, far: 120 }}
          >
            <Suspense fallback={null}>
              <LoftScene enabled={!open && !quick} shadows={!touch} view={view} screens={t.loft.screens} onNear={onNear} onSelect={openZone} />
            </Suspense>
          </Canvas>
          <Loading />
        </>
      ) : (
        <p className="grid h-full place-items-center px-6 text-center text-ink-2">{t.loft.noWebgl}</p>
      )}

      {/* Yläpalkki */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-3 sm:p-4">
        <button
          type="button"
          onClick={() => {
            play('back')
            onExit()
          }}
          className="pointer-events-auto flex items-center gap-2 rounded-sm border border-line bg-bg-2/80 px-3 py-2 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2 backdrop-blur hover:border-brass hover:text-brass-2 cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          {t.loft.exit}
        </button>
        <p className="hidden font-display text-sm uppercase tracking-[0.3em] text-brass-2 sm:block">{t.loft.title}</p>
        <div className="pointer-events-auto flex items-start gap-2">
        <button
          type="button"
          onClick={toggleView}
          aria-pressed={view === 'fps'}
          title={`${view === 'fps' ? t.loft.tps : t.loft.fps} (V)`}
          className="flex items-center gap-2 rounded-sm border border-line bg-bg-2/80 px-3 py-2 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2 backdrop-blur hover:border-brass hover:text-brass-2 cursor-pointer"
        >
          {view === 'fps' ? <User className="size-4" /> : <Eye className="size-4" />}
          <span className="hidden md:inline">{view === 'fps' ? t.loft.tps : t.loft.fps}</span>
          <span className="hidden lg:inline">
            <span className="key">V</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            play(quick ? 'close' : 'open')
            setQuick((v) => !v)
          }}
          aria-expanded={quick}
          className="pointer-events-auto flex items-center gap-2 rounded-sm border border-line bg-bg-2/80 px-3 py-2 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2 backdrop-blur hover:border-brass hover:text-brass-2 cursor-pointer"
        >
          <LayoutGrid className="size-4" />
          <span className="hidden sm:inline">{t.loft.quick}</span>
          <span className="hidden lg:inline">
            <span className="key">Q</span>
          </span>
        </button>
        </div>
      </div>

      {/* Tähtäin ensimmäisessä persoonassa */}
      {view === 'fps' && !open && !quick && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/80 ring-1 ring-bg/60" />
      )}

      {/* Hiirikatseen ohje, kunnes osoitin on lukittu */}
      {!touch && webgl && !locked && !open && !quick && (
        <p className="pointer-events-none absolute inset-x-0 top-16 z-20 text-center text-xs text-ink-2/80">{t.loft.mouseLook}</p>
      )}

      {/* Pikavalikko: kaikki vyöhykkeet reitin järjestyksessä */}
      {quick && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-bg/60 p-4 backdrop-blur-sm" onClick={() => setQuick(false)}>
          <nav className="panel w-full max-w-md rounded-sm border border-line p-4" aria-label={t.loft.quick} onClick={(e) => e.stopPropagation()}>
            <p className="label-caps">{t.loft.quick}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t.loft.quickHint}</p>
            <ol className="mt-3 grid gap-1">
              {ZONES.map((z, i) => {
                const txt = zoneText.get(z.id)
                return (
                  <li key={z.id}>
                    <button
                      type="button"
                      onClick={() => openZone(z.id)}
                      onMouseEnter={() => play('tick')}
                      className="flex w-full items-baseline gap-3 rounded-sm px-3 py-2 text-left hover:bg-brass/10 cursor-pointer"
                    >
                      <span className="w-4 font-display text-brass">{i + 1}</span>
                      <span className="text-ink">{txt?.name}</span>
                      <span className="ml-auto truncate pl-2 text-xs text-muted-foreground">{target(z.id, z.tab)}</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        </div>
      )}

      {/* Kehote, kun hahmo on esineen luona */}
      {nearZone && !open && !quick && (
        <div className={`pointer-events-none absolute inset-x-0 z-20 flex justify-center px-4 ${touch ? 'bottom-44' : 'bottom-16'}`}>
          <button
            type="button"
            onClick={() => near && openZone(near)}
            className="pointer-events-auto screen-in flex items-center gap-3 rounded-sm border border-brass/60 bg-bg-2/90 px-4 py-2.5 backdrop-blur cursor-pointer"
          >
            {!touch && <span className="key">E</span>}
            <span className="font-display text-[0.75rem] uppercase tracking-[0.2em] text-brass-2">
              {t.loft.prompt}: {near ? target(near, nearTab) : ''}
            </span>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {nearZone.name} — {nearZone.note}
            </span>
          </button>
        </div>
      )}

      {/* Ohjeet (työpöytä) ja joystick (kosketus) */}
      {!touch && !open && (
        <ul className="pointer-events-none absolute bottom-3 right-4 z-20 hidden flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-ink-2 md:flex">
          <li className="flex items-center gap-1.5">
            <span className="key">WASD</span>
            <span className="label-caps">{t.loft.controls.move}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="key">Shift</span>
            <span className="label-caps">{t.loft.controls.run}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="key">
              <Mouse className="inline size-3.5" />
            </span>
            <span className="label-caps">{t.loft.controls.look}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="key">V</span>
            <span className="label-caps">{t.loft.controls.view}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="key">E</span>
            <span className="label-caps">{t.loft.controls.interact}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="key">Q</span>
            <span className="label-caps">{t.loft.controls.quick}</span>
          </li>
        </ul>
      )}
      {touch && webgl && !open && !quick && (
        <Joystick
          joystickWrapperStyle={{ left: '12px', bottom: 'calc(12px + env(safe-area-inset-bottom, 0px))', width: '150px', height: '150px', zIndex: 25 }}
          joystickBaseStyle={{ width: '96px', height: '96px', background: 'rgba(20,17,15,0.45)', border: '2px solid rgba(201,168,106,0.7)' }}
          joystickKnobStyle={{ width: '52px', height: '52px', background: 'rgba(232,207,150,0.85)' }}
        />
      )}

      {open && openText?.link && <LinkCard name={openText.name} link={openText.link} onClose={close} />}
      {open && !openText?.link && open.tab && (
        <Panel
          title={openTitle}
          tab={open.tab}
          section={open.section}
          onTab={(tab) => setOpen((o) => (o ? { ...o, tab, section: undefined } : o))}
          onClose={close}
        />
      )}
    </div>
  )
}
