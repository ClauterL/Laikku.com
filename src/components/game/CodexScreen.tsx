import { useState, type FormEvent } from 'react'
import { ArrowUpRight, AtSign, BadgeCheck, Download, MapPin, MessageSquareQuote, Quote, Send, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { images } from '@/content'

const INFO_ICONS = [User, AtSign, MapPin, BadgeCheck]
const field =
  'w-full rounded-sm border border-line bg-bg-2/70 px-3 py-2 text-sm text-ink placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-brass'

/* Koodeksi: kuka, tilastot, linkit ja yhteydenotto */
export function CodexScreen() {
  const { t } = useLang()
  const { play } = useSound()
  const c = t.codex
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    play('unlock')
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`
    window.location.href = `mailto:${c.info[1].value}?subject=${encodeURIComponent(c.form.subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[320px_1fr_360px]">
      {/* muotokuva + lainaus */}
      <aside className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-sm border border-line">
          <img
            src={c.portrait.src}
            srcSet={c.portrait.srcSet}
            sizes="(min-width: 1024px) 320px, 90vw"
            alt={c.portrait.alt}
            width={c.portrait.width}
            height={c.portrait.height}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg via-bg/70 to-transparent px-4 pb-4 pt-16">
            <p className="font-display text-lg tracking-[0.08em] text-ink">{t.name}</p>
            <p className="label-caps text-brass">{t.role}</p>
          </div>
        </div>
        <figure className="panel corners rounded-sm p-4">
          <Quote className="mb-2 size-4 text-ember" />
          <blockquote className="font-display text-[0.95rem] italic leading-snug text-ink-2">{c.quote}</blockquote>
        </figure>
        <div className="grid grid-cols-2 gap-2">
          {[images.builder, images.adventure, images.discipline, images.winter].map((im, i) => (
            <img key={i} src={im.src} alt="" width={im.width} height={im.height} loading="lazy" className="aspect-square w-full rounded-sm border border-line object-cover object-top" />
          ))}
        </div>
      </aside>

      {/* teksti + tiedot + tilastot */}
      <section className="flex flex-col gap-5">
        <div>
          <h2 className="brass-rule decode text-2xl tracking-[0.1em] text-ink">{c.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.lead}</p>
        </div>
        <div className="space-y-3 text-[0.95rem] leading-relaxed text-ink-2">
          {c.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="panel corners rounded-sm px-4 py-2">
          <dl className="divide-y divide-line/70">
            {c.info.map((row, i) => {
              const Icon = INFO_ICONS[i % INFO_ICONS.length]
              return (
                <div key={row.label} className="grid grid-cols-[auto_96px_1fr] items-center gap-3 py-2.5 text-sm">
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
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.label} className="rounded-sm border border-line/70 bg-bg-2/40 px-3 py-3" onMouseEnter={() => play('tick')}>
              <p className="font-display text-2xl text-brass-2 tabular-nums">{s.value}</p>
              <p className="mt-1 text-[0.66rem] uppercase leading-snug tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {c.links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                rel="noreferrer noopener"
                onMouseEnter={() => play('tick')}
                onClick={() => play('select')}
                className="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-brass-2"
              >
                <span className="label-caps">{l.label}</span>
                {l.value}
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
      </section>

      {/* yhteydenotto */}
      <aside className="panel corners h-fit rounded-sm p-5">
        <h3 className="font-display text-[0.8rem] uppercase tracking-[0.22em] text-ink">{c.contactTitle}</h3>
        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            {c.form.name}
            <input id="codex-name" name="name" autoComplete="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            {c.form.email}
            <input id="codex-email" name="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-2">
            {c.form.message}
            <textarea id="codex-message" name="message" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-y`} />
          </label>
          <Button type="submit" className="rounded-sm font-display text-[0.7rem] uppercase tracking-[0.18em]" onMouseEnter={() => play('tick')}>
            {c.form.submit}
            <Send />
          </Button>
          <p className="text-[0.7rem] text-muted-foreground">{c.form.hint}</p>
        </form>
      </aside>

      {/* suosittelijat (loftin neuvottelupöytä vierittää tähän) */}
      <section id="codex-references" aria-labelledby="codex-references-title" className="scroll-mt-4 lg:col-span-3">
        <h3 id="codex-references-title" className="brass-rule font-display text-xl tracking-[0.1em] text-ink">
          {c.references.title}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{c.references.lead}</p>
        {c.references.items.length > 0 ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {c.references.items.map((r) => (
              <li key={r.name} className="panel corners flex flex-col gap-3 rounded-sm p-4">
                <Quote className="size-4 text-ember" />
                <blockquote className="text-[0.95rem] italic leading-relaxed text-ink-2">{r.quote}</blockquote>
                <div className="mt-auto border-t border-line/70 pt-3 text-sm">
                  {r.href ? (
                    <a href={r.href} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-semibold text-ink hover:text-brass-2">
                      {r.name}
                      <ArrowUpRight className="size-3.5 text-muted-foreground" />
                    </a>
                  ) : (
                    <p className="font-semibold text-ink">{r.name}</p>
                  )}
                  <p className="label-caps mt-0.5">{[r.role, r.org].filter(Boolean).join(' · ')}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-sm border border-dashed border-line px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex max-w-prose items-start gap-3 text-sm leading-relaxed text-ink-2">
              <MessageSquareQuote className="mt-0.5 size-5 shrink-0 text-brass" />
              {c.references.empty}
            </p>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 rounded-sm border-brass/60 font-display text-[0.7rem] uppercase tracking-[0.18em]"
              onMouseEnter={() => play('tick')}
              onClick={() => {
                play('select')
                const msg = document.getElementById('codex-message')
                msg?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                msg?.focus({ preventScroll: true })
              }}
            >
              {c.references.cta}
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
