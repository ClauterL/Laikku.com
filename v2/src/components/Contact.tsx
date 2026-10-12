import { useState, type FormEvent } from 'react'
import { ArrowUpRight, Mail, MapPin, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Picture } from '@/components/Picture'
import { SectionHead } from '@/components/SectionHead'
import { useLang } from '@/hooks/useLang'

const field =
  'w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-[0.95rem] text-foreground placeholder:text-muted-foreground/70 outline-none transition-[border-color,box-shadow] focus-visible:border-viini focus-visible:ring-[3px] focus-visible:ring-viini/20'

export function Contact() {
  const { t } = useLang()
  const c = t.contact
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  /* Staattinen sivu ilman backendia: lomake koostaa mailto-linkin.
     Jos haluat oikean lomakkeen, vaihda tähän esim. Formspree/Netlify Forms. */
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const body = `${form.message}\n\n— ${form.name}${form.email ? ` (${form.email})` : ''}`
    const url = `mailto:${c.email}?subject=${encodeURIComponent(c.form.subject)}&body=${encodeURIComponent(body)}`
    window.location.href = url
  }

  return (
    <section id="contact" className="scroll-mt-24 border-t border-border py-16 md:py-24">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div>
          <SectionHead eyebrow={c.eyebrow} title={c.heading} lead={c.lead} className="mb-8" />

          <div className="reveal grid grid-cols-[112px_1fr] items-start gap-5 sm:grid-cols-[150px_1fr]">
            <Picture image={c.image} className="aspect-[2/3] rounded-lg rounded-tl-[22px]" imgClassName="object-top" />
            <ul className="flex flex-col gap-3 pt-1">
              <li className="flex items-center gap-2.5 text-[0.95rem]">
                <Mail className="size-4 shrink-0 text-viini" />
                <a href={`mailto:${c.email}`} className="font-semibold hover:underline">
                  {c.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-[0.95rem]">
                <MapPin className="size-4 shrink-0 text-viini" />
                {c.location}
              </li>
              <li className="mt-2 border-t pt-4">
                <ul className="flex flex-col gap-2">
                  {t.links.map((l) => (
                    <li key={l.label} className="flex items-baseline gap-2 text-sm">
                      <span className="w-20 shrink-0 text-[0.7rem] font-bold uppercase tracking-wider text-muted-foreground">
                        {l.label}
                      </span>
                      <a
                        href={l.href}
                        target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 font-semibold hover:underline"
                      >
                        {l.value}
                        {!l.href.startsWith('mailto:') && <ArrowUpRight className="size-3.5 text-muted-foreground" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <Card className="reveal reveal-delay-1 py-0">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-semibold">
                  {c.form.name}
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={field}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold">
                  {c.form.email}
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={field}
                  />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-semibold">
                {c.form.message}
                <textarea
                  name="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${field} resize-y`}
                />
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{c.form.hint}</p>
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  {c.form.submit}
                  <Send />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
