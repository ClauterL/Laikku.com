import { useEffect, useRef } from 'react'
import { Mail, Menu, Volume2, VolumeX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { Lang, TabId } from '@/content'
import { links } from '@/content'

export function LangSwitch() {
  const { lang, setLang, t } = useLang()
  const { play } = useSound()
  return (
    <ToggleGroup
      type="single"
      value={lang}
      onValueChange={(v) => {
        if (v) {
          play('select')
          setLang(v as Lang)
        }
      }}
      aria-label={t.ui.langToggle}
      className="border-line bg-bg-2"
    >
      <ToggleGroupItem value="fi" aria-label="Suomi" className="data-[state=on]:bg-brass data-[state=on]:text-bg">
        fi
      </ToggleGroupItem>
      <ToggleGroupItem value="en" aria-label="English" className="data-[state=on]:bg-brass data-[state=on]:text-bg">
        en
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export function SoundToggle() {
  const { muted, toggleMute, play } = useSound()
  const { t } = useLang()
  return (
    <button
      type="button"
      onClick={() => {
        toggleMute()
        // soitetaan vasta kun mute on pois – play tarkistaa tilan itse
        window.setTimeout(() => play('select'), 0)
      }}
      aria-label={muted ? t.nav.soundOff : t.nav.sound}
      title={`${muted ? t.nav.soundOff : t.nav.sound} (M)`}
      className="grid size-9 place-items-center rounded-sm border border-line bg-bg-2/70 text-ink-2 transition-colors hover:border-brass hover:text-brass-2 cursor-pointer"
    >
      {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  )
}

export function TopBar({ tab, onSelectTab }: { tab: TabId; onSelectTab: (id: TabId) => void }) {
  const { t } = useLang()
  const { play, ambient, setAmbient } = useSound()
  const listRef = useRef<HTMLDivElement>(null)

  // Mobiilissa välilehtirivi vierii: pidetään aktiivinen näkyvissä.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-state="active"]')
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [tab])

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-40 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-3 sm:px-5">
        {/* Valikko */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={() => play('open')}
              onMouseEnter={() => play('tick')}
              className="flex items-center gap-2 rounded-sm border border-line bg-bg-2/70 px-2.5 py-1.5 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-2 transition-colors hover:border-brass hover:text-brass-2 cursor-pointer"
            >
              <Menu className="size-4" />
              <span className="hidden sm:inline">{t.nav.menu}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" closeLabel={t.ui.close} className="panel w-[88vw] max-w-sm border-line p-0">
            <div className="border-b border-line px-6 py-5">
              <SheetTitle className="font-display text-lg tracking-[0.1em] text-ink">{t.ui.menu}</SheetTitle>
              <p className="mt-1 text-xs text-muted-foreground">{t.ui.place}</p>
            </div>
            <nav className="flex flex-col px-3 py-3" aria-label={t.ui.menu}>
              {t.nav.tabs.map((tab) => (
                <SheetClose asChild key={tab.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(tab.id)}
                    onMouseEnter={() => play('tick')}
                    className="rounded-sm px-3 py-3 text-left font-display text-[0.8rem] uppercase tracking-[0.2em] text-ink-2 transition-colors hover:bg-brass/10 hover:text-brass-2 cursor-pointer"
                  >
                    {tab.label}
                  </button>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-auto space-y-4 border-t border-line px-6 py-5">
              <p className="label-caps">{t.ui.settings}</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">{t.ui.langToggle}</span>
                <LangSwitch />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm">{t.ui.sfx}</span>
                <SoundToggle />
              </div>
              <label className="flex items-center justify-between gap-4 text-sm">
                <span>
                  {t.ui.ambient}
                  <span className="block text-xs text-muted-foreground">{t.ui.ambientHint}</span>
                </span>
                <input
                  id="ambient-toggle"
                  type="checkbox"
                  checked={ambient}
                  onChange={(e) => {
                    setAmbient(e.target.checked)
                    play('select')
                  }}
                  className="size-4 accent-[var(--ember)]"
                />
              </label>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs">
                <a href={links.repo} target="_blank" rel="noreferrer noopener" className="text-brass hover:underline">
                  {t.ui.source}
                </a>
                <a href={links.github} target="_blank" rel="noreferrer noopener" className="text-brass hover:underline">
                  {t.ui.github}
                </a>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Välilehdet (Radix Tabs) */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <span className="hidden lg:block" aria-hidden>
            <span className="key">Q</span>
          </span>
          <TabsList ref={listRef} className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {t.nav.tabs.map((tb) => (
              <TabsTrigger key={tb.id} value={tb.id} onMouseEnter={() => play('tick')} className="px-2 text-[0.64rem] sm:px-3 sm:text-[0.72rem]">
                {tb.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="hidden lg:block" aria-hidden>
            <span className="key">E</span>
          </span>
        </div>

        {/* Oikea: kieli, ääni, yhteys */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LangSwitch />
          </div>
          <SoundToggle />
          <Button
            size="sm"
            className="hidden rounded-sm font-display text-[0.68rem] uppercase tracking-[0.18em] md:inline-flex"
            onClick={() => {
              play('select')
              onSelectTab('codex')
            }}
            onMouseEnter={() => play('tick')}
          >
            <Mail />
            {t.nav.contact}
          </Button>
        </div>
      </div>
    </header>
  )
}
