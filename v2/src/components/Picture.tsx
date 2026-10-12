import type { Img } from '@/content'
import { cn } from '@/lib/utils'

/* Responsiivinen kuva srcSet/sizes-attribuuteilla; mitat estävät layout shiftin. */
export function Picture({
  image,
  className,
  imgClassName,
  priority = false,
}: {
  image: Img
  className?: string
  imgClassName?: string
  priority?: boolean
}) {
  return (
    <div className={cn('overflow-hidden bg-muted', className)}>
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={image.sizes}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        className={cn('h-full w-full object-cover', imgClassName)}
      />
    </div>
  )
}
