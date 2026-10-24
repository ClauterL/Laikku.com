import { useLang } from '@/hooks/useLang'

/* Alapalkki: näppäinvihjeet kuten peleissä */
export function BottomBar() {
  const { t } = useLang()
  const hints: { keys: string[]; label: string }[] = [
    { keys: ['↑↓←→'], label: t.hints.move },
    { keys: ['⏎'], label: t.hints.select },
    { keys: ['Esc'], label: t.hints.back },
    { keys: ['Q', 'E'], label: `${t.hints.prevTab} / ${t.hints.nextTab}` },
    { keys: ['M'], label: t.hints.mute },
  ]
  return (
    <footer className="border-t border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-3 py-2.5 text-[0.7rem] sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span className="font-display uppercase tracking-[0.2em] text-brass">{t.ui.place}</span>
          <span className="hidden sm:inline">{t.ui.copyright}</span>
        </div>
        <ul className="hidden flex-wrap items-center gap-x-5 gap-y-1 md:flex">
          {hints.map((h) => (
            <li key={h.label} className="flex items-center gap-1.5 text-ink-2">
              {h.keys.map((k) => (
                <span key={k} className="key">
                  {k}
                </span>
              ))}
              <span className="font-display text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">{h.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
