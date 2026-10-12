import { cn } from '@/lib/utils'

/* havaida.com-tyylinen osion otsikkoryhmä: eyebrow + otsikko + lead */
export function SectionHead({
  eyebrow,
  title,
  lead,
  className,
  align = 'left',
}: {
  eyebrow?: string
  title: string
  lead?: string
  className?: string
  align?: 'left' | 'center'
}) {
  return (
    <div className={cn('reveal mb-10 max-w-[720px] md:mb-12', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <span className={cn('eyebrow mb-3.5', align === 'center' && 'justify-center')}>{eyebrow}</span>}
      <h2 className="text-[2.4rem] leading-[1.02] tracking-[-0.02em] md:text-[3.2rem]">{title}</h2>
      {lead && <p className="mt-4 text-[1.0625rem] text-muted-foreground md:text-lg">{lead}</p>}
    </div>
  )
}
