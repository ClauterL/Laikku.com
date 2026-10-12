import { useEffect, useRef, useState } from 'react'

import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { backgrounds, emblem } from '@/content'
import { cn } from '@/lib/utils'

/* Aloitusruutu: tunnuksen animoitu paljastus (Higgsfield image-to-video),
   nimi dekoodautuu esiin, "Paina mitä tahansa". Ensimmäinen ele avaa äänen
   (selaimet vaativat käyttäjän eleen ennen AudioContextia). Video on mykkä,
   joten se saa käynnistyä automaattisesti. */
export function StartScreen({ onDone }: { onDone: () => void }) {
  const { t } = useLang()
  const { start, play } = useSound()
  const [phase, setPhase] = useState<'idle' | 'loading' | 'out'>('idle')
  const [revealed, setRevealed] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  // Nimi ja kehote tulevat esiin, kun tunnuksen paljastus on edennyt hetken.
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 1400)
    return () => window.clearTimeout(id)
  }, [])

  useEffect(() => {
    if (phase !== 'idle') return
    const go = () => {
      start()
      play('boot')
      setPhase('loading')
      window.setTimeout(() => setPhase('out'), 1650)
      window.setTimeout(onDone, 2250)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return
      go()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', go)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', go)
    }
  }, [phase, start, play, onDone])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-bg text-center transition-opacity duration-700',
        phase === 'out' && 'pointer-events-none opacity-0',
      )}
      aria-live="polite"
    >
      <div className="screen-bg" style={{ ['--bg-image' as string]: `url(${backgrounds.menu})` }} />

      <div className="relative flex w-full max-w-[520px] flex-col items-center gap-5 px-6">
        {/* tunnus: video (mykkä, automaattinen) + hehku; still-kuva fallbackina */}
        <div className={cn('relative w-[min(62vw,340px)] transition-transform duration-[2000ms] ease-out', phase !== 'idle' && 'scale-[1.08]')}>
          <div
            aria-hidden
            className="absolute inset-[-30%] rounded-full bg-[radial-gradient(closest-side,rgba(226,222,214,0.14),transparent_70%)] animate-pulse-ring [animation-duration:4s]"
          />
          <video
            ref={video}
            poster={emblem.poster}
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            aria-label={t.name}
            className="relative aspect-square w-full rounded-full object-cover [mask-image:radial-gradient(closest-side,#000_62%,transparent_100%)] [-webkit-mask-image:radial-gradient(closest-side,#000_62%,transparent_100%)]"
          >
            <source src={emblem.video} type="video/mp4" />
            <source src={emblem.videoWebm} type="video/webm" />
          </video>
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
          <p className="label-caps decode">{t.start.eyebrow}</p>
          <h1 className="decode text-[2rem] leading-none tracking-[0.14em] text-ink sm:text-[2.8rem]">{t.name}</h1>
          <p className="decode font-display text-[0.78rem] uppercase tracking-[0.32em] text-brass">{t.role}</p>
        </div>

        <div className={cn('mt-2 h-10 transition-opacity duration-700', revealed ? 'opacity-100' : 'opacity-0')}>
          {phase === 'idle' ? (
            <p className="animate-blink font-display text-[0.78rem] uppercase tracking-[0.25em] text-ink-2">{t.start.press}</p>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.25em] text-muted-foreground">{t.start.loading}</p>
              <div className="h-[3px] w-56 overflow-hidden rounded-full bg-line">
                <div className="h-full w-full origin-left animate-[grow_1.5s_ease-out_forwards] bg-ember" />
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
