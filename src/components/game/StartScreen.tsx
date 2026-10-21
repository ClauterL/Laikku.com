import { useCallback, useEffect, useRef, useState } from 'react'
import { Gamepad2, Newspaper } from 'lucide-react'

import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { Logo } from '@/components/Logo'
import { backgrounds } from '@/content'
import { cn } from '@/lib/utils'

export type Mode = 'normal' | 'game'
const MODES: Mode[] = ['normal', 'game']
const MODE_ICON = { normal: Newspaper, game: Gamepad2 }

/* Aloitusruutu: tunnuksen animoitu paljastus (Higgsfield image-to-video), nimi dekoodautuu esiin ja
   kävijä valitsee normaalin tai pelillistetyn portfolion. Pelillistetty valinta avaa äänen (selaimet
   vaativat käyttäjän eleen ennen AudioContextia); normaali pysyy hiljaisena. Video on mykkä, joten se
   saa käynnistyä automaattisesti. onPick kutsutaan heti (ennakkolataus), onDone häivytyksen jälkeen. */
export function StartScreen({ onPick, onDone }: { onPick?: (mode: Mode) => void; onDone: (mode: Mode) => void }) {
  const { t } = useLang()
  const { start, play } = useSound()
  const [phase, setPhase] = useState<'idle' | 'loading' | 'out'>('idle')
  const [revealed, setRevealed] = useState(false)
  const [sel, setSel] = useState<Mode>('game')
  const [picked, setPicked] = useState<Mode | null>(null)
  const buttons = useRef<Partial<Record<Mode, HTMLButtonElement | null>>>({})

  // Nimi ja kehote tulevat esiin, kun tunnuksen paljastus on edennyt hetken.
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 1400)
    return () => window.clearTimeout(id)
  }, [])

  const go = useCallback(
    (mode: Mode) => {
      if (phase !== 'idle') return
      setPicked(mode)
      onPick?.(mode)
      // pelillistetty: ääni päälle ja pidempi latausanimaatio (loft latautuu taustalla)
      const [load, out] = mode === 'game' ? [1650, 2250] : [700, 1200]
      if (mode === 'game') {
        start()
        play('boot')
      }
      setPhase('loading')
      window.setTimeout(() => setPhase('out'), load)
      window.setTimeout(() => onDone(mode), out)
    },
    [phase, start, play, onPick, onDone],
  )

  // Näppäimet: nuolet vaihtavat valintaa, Enter/välilyönti aloittaa, 1/2 valitsee suoraan
  useEffect(() => {
    if (phase !== 'idle') return
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        setRevealed(true)
        setSel((m) => {
          const next = m === 'game' ? 'normal' : 'game'
          buttons.current[next]?.focus()
          return next
        })
      } else if (e.key === '1' || e.key === '2') {
        go(e.key === '1' ? 'normal' : 'game')
      } else if ((e.key === 'Enter' || e.key === ' ') && !(document.activeElement instanceof HTMLButtonElement)) {
        e.preventDefault()
        go(sel)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, sel, go])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] grid place-items-center overflow-y-auto overflow-x-hidden bg-bg py-6 text-center transition-opacity duration-700',
        phase === 'out' && 'pointer-events-none opacity-0',
      )}
      aria-live="polite"
    >
      <div className="screen-bg" style={{ ['--bg-image' as string]: `url(${backgrounds.menu})` }} />

      <div className="relative flex w-full max-w-[520px] flex-col items-center gap-5 px-6">
        {/* tunnus: kuvake läppärin takana, <#> – pääsiäismunana SMART morsena + hehku */}
        <div className={cn('relative w-[min(62vw,340px,38svh)] transition-transform duration-[2000ms] ease-out', phase !== 'idle' && 'scale-[1.08]')}>
          <div
            aria-hidden
            className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgba(226,222,214,0.14),transparent_70%)] animate-pulse-ring [animation-duration:4s]"
          />
          <div className="relative grid aspect-square w-full place-items-center rounded-full bg-[radial-gradient(closest-side,rgba(24,20,17,0.96)_60%,rgba(20,17,15,0.7)_85%,transparent_100%)]">
            <Logo play="loop" className="w-[66%] text-ink drop-shadow-[0_0_22px_rgba(232,207,150,0.22)]" />
          </div>
          {/* ohut kehä, joka piirtyy */}
          <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-[-6%] size-[112%] -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="var(--brass)"
              strokeWidth="0.6"
              strokeDasharray="301.6"
              strokeDashoffset={revealed ? 0 : 301.6}
              className="transition-[stroke-dashoffset] duration-[1800ms] ease-out"
              opacity="0.7"
            />
          </svg>
        </div>

        <div className={cn('flex flex-col items-center gap-3 transition-opacity duration-700', revealed ? 'opacity-100' : 'opacity-0')}>
          <h1 className="decode text-[2rem] leading-none tracking-[0.14em] text-ink sm:text-[2.8rem]">{t.name}</h1>
        </div>

        <div className={cn('mt-2 w-full transition-opacity duration-700', revealed ? 'opacity-100' : 'pointer-events-none opacity-0')}>
          {phase === 'idle' ? (
            <div className="flex flex-col items-center gap-3">
              <p id="start-choose" className="font-display text-[0.72rem] uppercase tracking-[0.25em] text-ink-2">
                {t.start.choose}
              </p>
              <div role="group" aria-labelledby="start-choose" className="grid w-full grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                {MODES.map((mode, i) => {
                  const Icon = MODE_ICON[mode]
                  const m = t.start.modes[mode]
                  const active = sel === mode
                  return (
                    <button
                      key={mode}
                      ref={(el) => {
                        buttons.current[mode] = el
                      }}
                      type="button"
                      onClick={() => go(mode)}
                      onMouseEnter={() => setSel(mode)}
                      onFocus={() => setSel(mode)}
                      aria-describedby="start-keys"
                      className={cn(
                        'group relative flex flex-col items-center gap-2 rounded-sm border px-4 py-4 text-center outline-none transition-[border-color,background-color,box-shadow] duration-200 cursor-pointer',
                        active
                          ? 'border-brass bg-brass/10 shadow-[0_0_0_1px_rgba(201,168,106,0.35),0_0_28px_rgba(201,168,106,0.18)]'
                          : 'border-line bg-bg-2/70 hover:border-line-2',
                      )}
                    >
                      <span className="absolute left-2 top-1.5 font-display text-[0.6rem] text-muted-foreground" aria-hidden>
                        {i + 1}
                      </span>
                      <Icon className={cn('size-6 transition-colors', active ? 'text-brass-2' : 'text-ink-2')} strokeWidth={1.6} />
                      <span className="font-display text-[0.95rem] uppercase tracking-[0.2em] text-ink">{m.title}</span>
                      <span className="text-xs leading-snug text-muted-foreground">{m.desc}</span>
                    </button>
                  )
                })}
              </div>
              <p id="start-keys" className="hidden font-display text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground sm:block">
                {t.start.keys}
              </p>
            </div>
          ) : (
            <div className="flex h-16 flex-col items-center justify-center gap-2">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.25em] text-muted-foreground">
                {picked ? `${t.start.modes[picked].title} · ` : ''}
                {t.start.loading}
              </p>
              <div className="h-[3px] w-56 overflow-hidden rounded-full bg-line">
                <div
                  className={cn(
                    'h-full w-full origin-left bg-ember',
                    picked === 'normal' ? 'animate-[grow_0.65s_ease-out_forwards]' : 'animate-[grow_1.5s_ease-out_forwards]',
                  )}
                />
              </div>
            </div>
          )}
        </div>
        <p className={cn('text-xs text-muted-foreground transition-opacity duration-700', revealed ? 'opacity-100' : 'opacity-0')}>
          {t.start.hint}
        </p>
      </div>
      <style>{`@keyframes grow { from { transform: scaleX(0) } to { transform: scaleX(1) } }`}</style>
    </div>
  )
}
