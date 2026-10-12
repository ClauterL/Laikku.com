import { useEffect, useState } from 'react'
import { ArrowRight, Menu, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useLang } from '@/hooks/useLang'
import { useTheme } from '@/hooks/useTheme'
import type { Lang } from '@/content'
import { cn } from '@/lib/utils'

function Monogram() {
  return (
    <a href="#top" className="flex items-center gap-3 no-underline" aria-label="Claus Laikku – etusivu">
      <span className="grid size-9 place-items-center rounded-full border-[1.5px] border-accent bg-foreground font-display text-[0.95rem] font-semibold tracking-wider text-background">
        CL
      </span>
      <span className="font-display text-[1.35rem] font-semibold tracking-[-0.01em] text-foreground">Claus Laikku</span>
    </a>
  )
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang, t } = useLang()
  return (
    <ToggleGroup
      type="single"
      value={lang}
      onValueChange={(v) => v && setLang(v as Lang)}
      aria-label={t.ui.langToggle}
      className={className}
    >
      <ToggleGroupItem value="fi" aria-label="Suomi">
        fi
      </ToggleGroupItem>
      <ToggleGroupItem value="en" aria-label="English">
        en
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  const { t } = useLang()
  const label = theme === 'dark' ? t.ui.themeLight : t.ui.themeDark
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn('size-9 border-border', className)}
    >
      {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}

export function Header() {
  const { t } = useLang()
  const [solid, setSolid] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-[env(safe-area-inset-top,0px)] z-40 border-b transition-[background-color,border-color,box-shadow] duration-300',
        solid
          ? 'border-border bg-background/85 shadow-[0_1px_0_rgba(18,18,20,0.03)] backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
      >
        {t.ui.skipToContent}
      </a>

      <div className="container-x flex h-[76px] items-center justify-between gap-6">
        <Monogram />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Päävalikko">
          {t.nav.items.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="border-b-2 border-transparent py-1.5 text-[0.9375rem] font-semibold text-foreground/80 transition-colors hover:border-accent hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LangSwitch className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <a href={t.nav.cta.href}>
              {t.nav.cta.label}
              <ArrowRight />
            </a>
          </Button>

          {/* Mobiilivalikko: shadcn Sheet (Radix Dialog) hoitaa fokusloukun,
              vieritysluk on ja Escapen. */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label={t.ui.menu}>
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" closeLabel={t.ui.closeMenu} className="w-[85vw] max-w-sm p-0">
              <div className="flex h-full flex-col">
                <div className="border-b px-6 py-5">
                  <SheetTitle className="font-display text-xl font-semibold">Claus Laikku</SheetTitle>
                </div>
                <nav className="flex flex-col px-2 py-3" aria-label={t.ui.menu}>
                  {t.nav.items.map((l) => (
                    <SheetClose asChild key={l.href}>
                      <a
                        href={l.href}
                        className="rounded-md px-4 py-3 text-lg font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        {l.label}
                      </a>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-auto flex items-center justify-between gap-4 border-t px-6 py-5">
                  <LangSwitch />
                  <SheetClose asChild>
                    <Button asChild size="sm">
                      <a href={t.nav.cta.href}>
                        {t.nav.cta.label}
                        <ArrowRight />
                      </a>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
