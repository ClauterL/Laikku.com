import { Picture } from '@/components/Picture'
import { useLang } from '@/hooks/useLang'

/* Kolme pilaria: Builder · Adventure · Discipline */
export function Pillars() {
  const { t } = useLang()
  return (
    <section className="py-16 md:py-24">
      <div className="container-x grid gap-5 md:grid-cols-3 md:gap-6">
        {t.pillars.map((p, i) => (
          <article
            key={p.key}
            className={`reveal reveal-delay-${i} group relative overflow-hidden rounded-lg ${i === 1 ? 'rounded-tr-[var(--radius-hero)]' : ''}`}
          >
            <Picture
              image={p.image}
              className="aspect-[3/4]"
              imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-hiili/85 via-hiili/25 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-luu md:p-7">
              <p className="mb-2 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-hiekka">0{i + 1}</p>
              <h3 className="text-[2rem] leading-none text-luu">{p.name}</h3>
              <p className="mt-2.5 max-w-[34ch] text-[0.95rem] leading-relaxed text-luu/85">{p.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
