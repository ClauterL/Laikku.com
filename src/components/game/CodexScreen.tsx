import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { ArrowUpRight, AtSign, BadgeCheck, CheckCheck, ChevronDown, Download, MapPin, PenLine, Quote, Send, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { Content, Img } from '@/content'
import { cn } from '@/lib/utils'

type Codex = Content['codex']
type Ref = Codex['references']['items'][number]
type CatId = Codex['book']['categories'][number]['id']
type Kind = 'about' | 'facts' | 'contact' | 'ref' | 'refsEmpty'

interface Entry {
  key: string
  cat: CatId
  kind: Kind
  title: string
  subtitle?: string
  image: Img
  ref?: Ref
}

/** Luonnokset (suosittelija ei vielä hyväksynyt) näkyvät vain kehitystilassa ja esikatselussa (VITE_SHOW_DRAFTS=1) */
const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === '1'
/** Pelin tietokannan nuolikärkinen rivi */
const ARROW = 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
const INFO_ICONS = [User, AtSign, MapPin, BadgeCheck]
const field =
  'w-full rounded-sm border border-line bg-bg/70 px-3 py-2 text-sm text-ink placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-brass'

function initials(name: string) {
  return name
    .replace(/[[\]]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

/** Väliotsikko merkinnän sisällä */
function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h4 className="label-caps mb-3 mt-8 flex items-center gap-2 text-brass first:mt-0">
      <span className="size-1.5 rotate-45 bg-brass" aria-hidden />
      {children}
    </h4>
  )
}

/** Ohut viiva, jonka keskellä messinkitimantti */
function DiamondRule() {
  return (
    <div className="relative my-5 h-px w-full max-w-xl bg-gradient-to-r from-line-2/30 via-line-2 to-line-2/30" aria-hidden>
      <span className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-brass bg-bg" />
    </div>
  )
}

/* Koodeksi pelin tietokannan tapaan: kategoriat vasemmalla (kuvanauha, luetut / kaikki), merkintä keskellä
   (otsikko, timanttiviiva, sisältö) ja merkinnän kuva oikealla taustaan häivyttyen.
   section = loftin kohde (neuvottelupöytä avaa suosittelijat). */
export function CodexScreen({ section }: { section?: string }) {
  const { t } = useLang()
  const { play } = useSound()
  const c = t.codex
  const b = c.book
  const r = c.references

  const entries = useMemo<Entry[]>(() => {
    const e = b.entries
    const refsImage = b.categories.find((cat) => cat.id === 'refs')?.image ?? e.facts.image
    const refs = r.items.filter((it) => SHOW_DRAFTS || !it.draft)
    return [
      { key: 'about', cat: 'about', kind: 'about', title: e.about.title, subtitle: `${t.name} · ${t.role}`, image: e.about.image },
      { key: 'facts', cat: 'facts', kind: 'facts', title: e.facts.title, image: e.facts.image },
      ...(refs.length
        ? refs.map<Entry>((it, i) => ({
            key: `ref-${i}`,
            cat: 'refs',
            kind: 'ref',
            title: it.name,
            subtitle: [it.role, it.org].filter(Boolean).join(' · '),
            image: it.photo ?? refsImage,
            ref: it,
          }))
        : [{ key: 'ref-empty', cat: 'refs' as const, kind: 'refsEmpty' as const, title: r.title, image: refsImage }]),
      { key: 'contact', cat: 'contact', kind: 'contact', title: e.contact.title, image: e.contact.image },
    ]
  }, [b.entries, b.categories, r, t.name, t.role])

  const wantRefs = section === 'codex-references'
  const firstRef = entries.find((e) => e.cat === 'refs')?.key ?? 'about'
  const [selKey, setSelKey] = useState(wantRefs ? firstRef : 'about')
  const [open, setOpen] = useState<Record<CatId, boolean>>({ about: true, facts: true, refs: true, contact: true })
  const [seen, setSeen] = useState<Set<string>>(() => new Set([wantRefs ? firstRef : 'about']))
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const listRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLElement>(null)
  const focusMessage = useRef(false)

  const sel = entries.find((e) => e.key === selKey) ?? entries[0]

  const choose = (key: string, sound = true) => {
    if (sound && key !== selKey) play('tick')
    setSelKey(key)
    setSeen((s) => (s.has(key) ? s : new Set(s).add(key)))
  }

  // "Kirjoita suositus" vie yhteydenottoon ja kohdistaa viestikenttään
  const writeReference = () => {
    play('select')
    focusMessage.current = true
    setOpen((o) => ({ ...o, contact: true }))
    choose('contact', false)
  }
  useEffect(() => {
    if (sel.kind === 'contact' && focusMessage.current) {
      focusMessage.current = false
      document.getElementById('codex-message')?.focus()
    }
  }, [sel.kind])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    play('unlock')
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`
    window.location.href = `mailto:${c.info[1].value}?subject=${encodeURIComponent(c.form.subject)}&body=${encodeURIComponent(body)}`
  }

  // ylös/alas selaa avointen kategorioiden merkintöjä
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    if ((e.target as HTMLElement).closest('input, textarea')) return
    const flat = entries.filter((x) => open[x.cat])
    if (!flat.length) return
    e.preventDefault()
    const i = flat.findIndex((x) => x.key === selKey)
    const next = flat[(i + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length]
    choose(next.key)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-entry="${next.key}"]`)?.focus()
  }

  const content: Record<Kind, () => ReactNode> = {
    about: () => (
      <div className="flex max-w-[62ch] flex-col">
        <p className="text-[1.02rem] leading-relaxed text-ink-2">{c.paragraphs[0]}</p>
        <SubHeading>{b.sections.free}</SubHeading>
        <p className="text-[1.02rem] leading-relaxed text-ink-2">{c.paragraphs[1]}</p>
        <SubHeading>{b.sections.motto}</SubHeading>
        <figure className="max-w-[46ch] border-l-2 border-ember/70 pl-4">
          <Quote className="mb-2 size-5 text-ember" />
          <blockquote className="font-display text-xl italic leading-snug text-ink [text-wrap:balance]">{c.quote}</blockquote>
          <figcaption className="label-caps mt-3 text-brass">— {t.name}</figcaption>
        </figure>
      </div>
    ),
    facts: () => (
      <div className="flex max-w-xl flex-col">
        <SubHeading>{b.sections.info}</SubHeading>
        <dl className="divide-y divide-line/70 border-y border-line/70">
          {c.info.map((row, i) => {
            const Icon = INFO_ICONS[i % INFO_ICONS.length]
            return (
              <div key={row.label} className="grid grid-cols-[auto_minmax(80px,110px)_1fr] items-center gap-3 py-3 text-sm">
                <Icon className="size-4 text-brass" />
                <dt className="label-caps">{row.label}</dt>
                <dd className="min-w-0 break-words font-semibold text-ink">
                  {row.href ? (
                    <a href={row.href} className="hover:underline">
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            )
          })}
        </dl>
        <SubHeading>{b.sections.stats}</SubHeading>
        <div className="grid grid-cols-2 gap-3">
          {c.stats.map((s) => (
            <div key={s.label} className="rounded-sm border border-line/70 bg-bg/60 px-4 py-4" onMouseEnter={() => play('tick')}>
              <p className="font-display text-3xl text-brass-2 tabular-nums">{s.value}</p>
              <p className="mt-1 text-[0.68rem] uppercase leading-snug tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <SubHeading>{b.sections.links}</SubHeading>
        <div className="flex flex-col gap-4">
          <ul className="divide-y divide-line/70 border-y border-line/70">
            {c.links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noreferrer noopener"
                  onMouseEnter={() => play('tick')}
                  onClick={() => play('select')}
                  className="flex items-center gap-3 py-3 text-sm font-semibold text-ink hover:text-brass-2"
                >
                  <span className="label-caps w-24 shrink-0">{l.label}</span>
                  <span className="min-w-0 flex-1 truncate">{l.value}</span>
                  {!l.href.startsWith('mailto:') && <ArrowUpRight className="size-3.5 text-muted-foreground" />}
                </a>
              </li>
            ))}
          </ul>
          {c.cv && (
            <Button asChild variant="outline" className="w-fit rounded-sm border-brass/60 font-display text-[0.7rem] uppercase tracking-[0.18em]">
              <a href={c.cv.href} download onClick={() => play('select')}>
                <Download />
                {c.cv.label}
              </a>
            </Button>
          )}
          <p className="text-xs text-muted-foreground">{c.builtWith}</p>
        </div>
      </div>
    ),
    contact: () => (
      <form onSubmit={onSubmit} className="grid max-w-xl gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            {c.form.name}
            <input id="codex-name" name="name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            {c.form.email}
            <input id="codex-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
          </label>
        </div>
        <label className="grid gap-1 text-xs font-semibold text-ink-2">
          {c.form.message}
          <textarea id="codex-message" name="message" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-y`} />
        </label>
        <Button type="submit" className="w-fit rounded-sm font-display text-[0.7rem] uppercase tracking-[0.18em]" onMouseEnter={() => play('tick')}>
          {c.form.submit}
          <Send />
        </Button>
        <p className="text-[0.7rem] text-muted-foreground">{c.form.hint}</p>
      </form>
    ),
    ref: () =>
      sel.ref ? (
        <div className="flex max-w-[62ch] flex-col gap-4">
          <blockquote className="text-[1.02rem] leading-relaxed text-ink-2">
            <Quote className="mb-2 size-5 text-ember" />
            {sel.ref.quote}
          </blockquote>
          {sel.ref.href && (
            <a href={sel.ref.href} target="_blank" rel="noreferrer noopener" onMouseEnter={() => play('tick')} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink hover:text-brass-2">
              <span className="label-caps">{r.profile}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </a>
          )}
          {sel.ref.draft && <p className="w-fit border border-dashed border-ember/60 px-2.5 py-1.5 text-[0.7rem] uppercase tracking-[0.14em] text-ember-2">{r.draft}</p>}
          <Button type="button" variant="outline" className="w-fit rounded-sm border-brass/60 font-display text-[0.68rem] uppercase tracking-[0.18em]" onMouseEnter={() => play('tick')} onClick={writeReference}>
            <PenLine />
            {r.cta}
          </Button>
        </div>
      ) : null,
    refsEmpty: () => (
      <div className="flex max-w-[62ch] flex-col gap-4">
        <p className="text-[1.02rem] leading-relaxed text-ink-2">{r.empty}</p>
        <Button type="button" variant="outline" className="w-fit rounded-sm border-brass/60 font-display text-[0.68rem] uppercase tracking-[0.18em]" onMouseEnter={() => play('tick')} onClick={writeReference}>
          <PenLine />
          {r.cta}
        </Button>
      </div>
    ),
  }

  const medallion = sel.kind === 'ref' && sel.ref && !sel.ref.photo && (
    <figcaption className="absolute bottom-4 left-4 flex items-center gap-3 lg:bottom-8 lg:left-[18%]">
      <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full border border-brass/60 bg-bg/85 font-display text-2xl tracking-[0.08em] text-brass-2 shadow-[0_0_0_5px_rgba(20,17,15,0.75),0_0_0_6px_rgba(201,168,106,0.3)]">
        {initials(sel.ref.name) || '?'}
      </span>
      <span className="label-caps rounded-sm bg-bg/70 px-2 py-1 text-ink-2">{r.photoSoon}</span>
    </figcaption>
  )

  /* suosittelijan oma kuva: kasvot näkyviin, vähemmän häivytystä */
  const isPhoto = sel.kind === 'ref' && !!sel.ref?.photo

  return (
    <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5">
      <header>
        <h2 className="brass-rule decode text-2xl tracking-[0.1em] text-ink">{c.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{c.lead}</p>
      </header>

      <div className="panel relative mt-4 overflow-hidden rounded-sm lg:min-h-[600px]">
        {/* merkinnän kuva oikealla, häivytys vasemmalle (työpöytä) */}
        <figure className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] lg:block" aria-hidden={sel.kind !== 'ref'}>
          <img
            key={sel.image.src}
            src={sel.image.src}
            srcSet={sel.image.srcSet}
            sizes="(min-width: 1024px) 620px, 100vw"
            alt={sel.image.alt}
            width={sel.image.width}
            height={sel.image.height}
            className={cn(
              'screen-in size-full object-cover',
              isPhoto
                ? 'object-[50%_20%] [mask-image:linear-gradient(to_right,transparent,black_28%)]'
                : 'object-[50%_25%] [mask-image:linear-gradient(to_right,transparent,black_45%)]',
            )}
          />
          {medallion}
        </figure>

        <div className="relative grid lg:min-h-[600px] lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)_38%]">
          {/* kategoriat ja merkinnät */}
          <div ref={listRef} onKeyDown={onKey} className="flex flex-col gap-2 border-b border-line/70 bg-bg/40 p-4 backdrop-blur-[2px] lg:border-b-0 lg:border-r">
            {b.categories.map((cat) => {
              const list = entries.filter((e) => e.cat === cat.id)
              const isOpen = open[cat.id]
              const read = list.filter((e) => seen.has(e.key)).length
              return (
                <div key={cat.id} id={cat.id === 'refs' ? 'codex-references' : undefined} className="flex scroll-mt-4 flex-col gap-1.5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => {
                      play(isOpen ? 'close' : 'open')
                      setOpen((o) => ({ ...o, [cat.id]: !isOpen }))
                    }}
                    style={{ clipPath: ARROW }}
                    className="group relative flex min-h-16 w-full items-center gap-3 overflow-hidden border border-line-2/70 bg-bg-2 py-2.5 pl-3 pr-6 text-left cursor-pointer outline-none"
                  >
                    <img
                      src={cat.image.src}
                      alt=""
                      aria-hidden
                      loading="lazy"
                      className="absolute inset-y-0 right-0 h-full w-3/5 object-cover object-[50%_30%] opacity-70 grayscale-[35%] transition-[opacity,filter] duration-300 [mask-image:linear-gradient(to_right,transparent,black_65%)] group-hover:opacity-90 group-hover:grayscale-0 group-focus-visible:opacity-90"
                    />
                    <span className="absolute inset-0 bg-gradient-to-r from-panel-2 via-panel-2/80 to-transparent" aria-hidden />
                    <ChevronDown className={cn('relative size-4 shrink-0 text-brass transition-transform', !isOpen && '-rotate-90')} />
                    <span className="relative min-w-0 flex-1 [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">
                      <span className="block truncate font-display text-[0.95rem] tracking-[0.06em] text-ink">{cat.title}</span>
                      <span className="block font-display text-[0.7rem] tabular-nums text-ink-2">
                        {read} / {list.length}
                      </span>
                    </span>
                  </button>
                  {isOpen &&
                    list.map((e) => {
                      const active = e.key === sel.key
                      return (
                        <button
                          key={e.key}
                          type="button"
                          data-entry={e.key}
                          onClick={() => {
                            play('select')
                            choose(e.key, false)
                            // puhelimella merkintä on listan alla: vieritä siihen
                            if (window.matchMedia('(max-width: 1023px)').matches)
                              requestAnimationFrame(() => articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
                          }}
                          onFocus={() => choose(e.key)}
                          style={{ clipPath: ARROW }}
                          className={cn(
                            'relative ml-4 flex items-center gap-2 border py-2 pl-3 pr-7 text-left transition-colors outline-none cursor-pointer',
                            active ? 'border-brass-2 bg-ink/90 text-bg' : 'border-line/70 bg-bg-2/70 text-ink-2 hover:border-line-2 hover:text-ink',
                          )}
                        >
                          {!seen.has(e.key) && <span className="size-1.5 shrink-0 rotate-45 bg-ember" aria-hidden />}
                          <span className="min-w-0 flex-1 truncate font-display text-[0.82rem] tracking-[0.04em]">{e.title}</span>
                          {active && (
                            <span className="absolute right-6 grid size-6 place-items-center rounded-full border border-bg/50" aria-hidden>
                              <span className="size-1 rounded-full bg-bg/70" />
                            </span>
                          )}
                        </button>
                      )
                    })}
                </div>
              )
            })}
          </div>

          {/* merkintä */}
          <article key={sel.key} ref={articleRef} className="screen-in flex min-w-0 scroll-mt-16 flex-col p-5 sm:p-8">
            {/* puhelimella kuva merkinnän yläpuolella */}
            <figure className={cn('relative -mx-5 -mt-5 mb-5 overflow-hidden sm:-mx-8 sm:-mt-8 lg:hidden', isPhoto ? 'h-80 sm:h-96' : 'h-56 sm:h-72')}>
              <img
                src={sel.image.src}
                srcSet={sel.image.srcSet}
                sizes="100vw"
                alt={sel.image.alt}
                width={sel.image.width}
                height={sel.image.height}
                className={cn(
                  'size-full object-cover [mask-image:linear-gradient(to_top,transparent,black_45%)]',
                  isPhoto ? 'object-[50%_18%]' : 'object-[50%_25%]',
                )}
              />
              {medallion}
            </figure>
            <h3 className="font-display text-2xl tracking-[0.04em] text-ink [text-wrap:balance] sm:text-3xl">{sel.title}</h3>
            {sel.subtitle && <p className="label-caps mt-2 text-brass">{sel.subtitle}</p>}
            <DiamondRule />
            {content[sel.kind]()}
          </article>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </div>

      {/* ohjeet pelin alapalkin tapaan */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[0.7rem] text-muted-foreground">
        <span className="hidden items-center gap-1.5 sm:flex">
          <span className="key">↑</span>
          <span className="key">↓</span>
          {b.hint}
        </span>
        <button
          type="button"
          onClick={() => {
            play('unlock')
            setSeen(new Set(entries.map((e) => e.key)))
          }}
          onMouseEnter={() => play('tick')}
          className="inline-flex items-center gap-1.5 hover:text-brass-2 cursor-pointer"
        >
          <CheckCheck className="size-3.5" />
          {b.markAll}
        </button>
      </div>
    </div>
  )
}
