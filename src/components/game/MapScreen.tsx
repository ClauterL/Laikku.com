import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Anchor, Flag, Home, Minus, Plus, Scan, Star, Swords } from 'lucide-react'
import { geoGraticule10, geoNaturalEarth1, geoPath } from 'd3-geo'
import { select } from 'd3-selection'
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom'
import 'd3-transition'
import { merge, mesh } from 'topojson-client'
import type { GeometryCollection, MultiPolygon, Polygon, Topology } from 'topojson-specification'

import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import { backgrounds, type Marker } from '@/content'
import worldJson from '@/data/world.json'
import { cn } from '@/lib/utils'

/* Kartta: oikea maailmankartta (Natural Earth 50m, kevennetty) piirrettynä SVG:nä
   AC-tyyliin – pergamenttimaa, teal-meri, käsin kirjoitetut aluenimet, fog of war
   tutkimattomilla alueilla, reitit ja pikamatkustus. Zoom/panorointi d3-zoomilla. */

const W = 1600
const H = 1000
const MAX_K = 16

const topo = worldJson as unknown as Topology
const countries = topo.objects.countries as GeometryCollection
const projection = geoNaturalEarth1()
  .rotate([-10, 0])
  .fitExtent(
    [
      [16, 16],
      [W - 16, H - 16],
    ],
    { type: 'Sphere' },
  )
const path = geoPath(projection)
const LAND_D = path(merge(topo, countries.geometries as (Polygon | MultiPolygon)[])) ?? ''
const BORDER_D = path(mesh(topo, countries, (a, b) => a !== b)) ?? ''
const GRAT_D = path(geoGraticule10()) ?? ''
const SPHERE_D = path({ type: 'Sphere' }) ?? ''

const ICON: Record<Marker['kind'], typeof Home> = {
  home: Home,
  travel: Flag,
  quest: Swords,
  bucket: Star,
  offmap: Anchor,
}
const COLOR: Record<Marker['kind'], string> = {
  home: 'var(--gold)',
  travel: 'var(--ember-2)',
  quest: 'var(--teal-2)',
  bucket: '#b48ce6', // sama violetti kuin eeppinen harvinaisuus (Slot.tsx)
  offmap: 'var(--brass)',
}
/* Järjestys selitteessä, pikamatkustuksessa ja päällekkäisyyksissä (ensimmäinen voittaa) */
const KIND_ORDER: Marker['kind'][] = ['home', 'travel', 'quest', 'bucket', 'offmap']
/* Fog of war -paljastuksen säde kartan yksiköissä (1 yksikkö ≈ 26 km päiväntasaajalla) */
const REVEAL: Record<Marker['kind'], number> = { home: 84, travel: 58, quest: 40, bucket: 36, offmap: 0 }
/* Merkkien välimatka CSS-pikseleinä (täysikokoisina), jota lähempänä alemman prioriteetin merkki
   niputetaan tärkeämpään (+N-merkki); klikkaus zoomaa niin lähelle, että nippu aukeaa */
const CLUSTER_PX = 34
const DEFAULT_K = 5.5
/* Merkit pienempinä koko maailman näkymässä */
const markerSize = (k: number) => (k < 1.8 ? 0.8 : k < 3.5 ? 0.9 : 1)
/* Nimen arvioitu leveys CSS-pikseleinä (11 px Cinzel, versaalit, 0,18 em välistys) */
const labelW = (name: string) => name.length * 9.6 + 8
const REGION_SIZE = { lg: 21, md: 16, sm: 12 }
const SEA_REGIONS = /meri|ocean|sea|lahti|gulf|valtameri/i

function CompassRose() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-16 text-brass drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:size-20"
      aria-hidden
    >
      <circle cx="50" cy="50" r="46" fill="rgba(20,17,15,0.55)" stroke="currentColor" strokeWidth="1" opacity="0.9" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" />
      <path d="M50 6 L55 45 L50 50 L45 45 Z" fill="var(--ember-2)" />
      <path
        d="M50 94 L55 55 L50 50 L45 55 Z M6 50 L45 45 L50 50 L45 55 Z M94 50 L55 45 L50 50 L55 55 Z"
        fill="currentColor"
      />
      <path
        d="M22 22 L47 47 L50 50 L45 45 Z M78 22 L53 47 L50 50 L55 45 Z M22 78 L47 53 L50 50 L45 55 Z M78 78 L53 53 L50 50 L55 55 Z"
        fill="currentColor"
        opacity="0.55"
      />
      <text x="50" y="4" textAnchor="middle" fontSize="7" fontFamily="var(--font-display)" fill="currentColor">
        N
      </text>
    </svg>
  )
}

export function MapScreen() {
  const { t } = useLang()
  const { play } = useSound()
  const m = t.map
  const [active, setActive] = useState<Marker>(m.markers[0])
  const [tf, setTf] = useState<ZoomTransform>(zoomIdentity)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  /* Näkyvä alue viewBox-yksiköissä (preserveAspectRatio=slice rajaa) ja yksikköä / CSS-pikseli */
  const view = useRef({ ox: 0, oy: 0, w: W, h: H })
  const [px, setPx] = useState(1)

  const points = useMemo(
    () =>
      m.markers
        .map((mk) => ({ mk, xy: projection([mk.lon, mk.lat]) ?? [0, 0] }))
        .sort((a, b) => KIND_ORDER.indexOf(a.mk.kind) - KIND_ORDER.indexOf(b.mk.kind)),
    [m.markers],
  )
  const kinds = useMemo(() => KIND_ORDER.filter((kind) => m.markers.some((mk) => mk.kind === kind)), [m.markers])
  const routes = useMemo(
    () => m.routes.map((r) => ({ ...r, d: path({ type: 'LineString', coordinates: r.points }) ?? '' })),
    [m.routes],
  )
  const regions = useMemo(() => m.regions.map((r) => ({ ...r, xy: projection([r.lon, r.lat]) ?? [0, 0] })), [m.regions])

  /* Alkunäkymä: kaikki merkit näkyviin reilulla marginaalilla */
  const fitAll = useCallback(() => {
    const xs = points.map((p) => p.xy[0])
    const ys = points.map((p) => p.xy[1])
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys)
    const v = view.current
    const k = Math.max(1, Math.min(MAX_K, 0.7 / Math.max((x1 - x0) / v.w, (y1 - y0) / v.h, 0.05)))
    const cx = (x0 + x1) / 2,
      cy = (y0 + y1) / 2 - 10
    return zoomIdentity
      .translate(W / 2, H / 2)
      .scale(k)
      .translate(-cx, -cy)
  }, [points])

  useEffect(() => {
    const el = svgRef.current!
    const measure = () => {
      const cw = el.clientWidth || W
      const ch = el.clientHeight || H
      const sc = Math.max(cw / W, ch / H)
      const w = cw / sc
      const h = ch / sc
      view.current = { ox: (W - w) / 2, oy: (H - h) / 2, w, h }
      setPx(1 / sc)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)

    const svg = select(el)
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_K])
      .extent(() => {
        const v = view.current
        return [
          [v.ox, v.oy],
          [v.ox + v.w, v.oy + v.h],
        ]
      })
      .translateExtent([
        [0, 0],
        [W, H],
      ])
      .on('zoom', (e) => setTf(e.transform))
    svg.call(z)
    svg.call(z.transform, fitAll())
    zoomRef.current = z
    return () => {
      ro.disconnect()
      svg.on('.zoom', null)
    }
  }, [fitAll])

  const animateTo = useCallback((target: ZoomTransform) => {
    const z = zoomRef.current
    if (!z || !svgRef.current) return
    select(svgRef.current).transition().duration(750).call(z.transform, target)
  }, [])

  /* Zoom, jolla merkki erottuu lähinaapureistaan (ei jää nippuun) */
  const separateK = useCallback(
    (mk: Marker) => {
      const p = points.find((q) => q.mk.id === mk.id)
      if (!p) return DEFAULT_K
      let need = DEFAULT_K
      for (const q of points) {
        if (q.mk.id === mk.id) continue
        const d = Math.hypot(q.xy[0] - p.xy[0], q.xy[1] - p.xy[1])
        const ki = (CLUSTER_PX * 1.5 * px) / Math.max(d, 0.01)
        if (ki > need && ki <= MAX_K) need = ki
      }
      return need
    },
    [points, px],
  )

  const zoomTo = useCallback(
    (mk: Marker, k = separateK(mk)) => {
      const [x, y] = projection([mk.lon, mk.lat]) ?? [W / 2, H / 2]
      animateTo(
        zoomIdentity
          .translate(W / 2, H / 2)
          .scale(k)
          .translate(-x, -y),
      )
    },
    [animateTo, separateK],
  )

  const zoomBy = (f: number) => {
    const z = zoomRef.current
    if (!z || !svgRef.current) return
    play('tick')
    select(svgRef.current).transition().duration(300).call(z.scaleBy, f)
  }

  const k = tf.k
  const inv = 1 / k
  const size = markerSize(k)
  const markerScale = inv * px * size // merkit CSS-pikseleinä zoomista riippumatta
  const regionScale = Math.pow(inv, 0.6) * Math.sqrt(px)

  /* Päällekkäisyydet: tärkeämpi merkki (KIND_ORDER, aktiivinen ensin) piirretään, liian lähellä olevat
     niputetaan sen alle (+N). Nimi näytetään vain, jos se ei osu jo sijoitettuun nimeen. */
  const layout = useMemo(() => {
    const placed: { id: string; x: number; y: number }[] = []
    const labels: { x: number; y: number; w: number }[] = []
    const hidden = new Set<string>()
    const count = new Map<string, number>()
    const label = new Set<string>()
    const thr = CLUSTER_PX * size
    const order = [...points].sort((a, b) => Number(b.mk.id === active.id) - Number(a.mk.id === active.id))
    for (const { mk, xy } of order) {
      const x = (xy[0] * k) / px
      const y = (xy[1] * k) / px
      const host = placed.find((q) => Math.hypot(q.x - x, q.y - y) < thr)
      if (host) {
        hidden.add(mk.id)
        count.set(host.id, (count.get(host.id) ?? 0) + 1)
        continue
      }
      placed.push({ id: mk.id, x, y })
    }
    // nimet: ei toisen nimen eikä toisen merkin päälle (merkki ≈ ±16 px)
    const r = 16 * size
    for (const pl of placed) {
      const w = labelW(points.find((q) => q.mk.id === pl.id)?.mk.name ?? '') * size
      const ly = pl.y + 32 * size
      const hitsLabel = labels.some((l) => Math.abs(l.x - pl.x) < (l.w + w) / 2 && Math.abs(l.y - ly) < 15)
      const hitsMarker = placed.some(
        (q) => q.id !== pl.id && Math.abs(q.x - pl.x) < w / 2 + r && Math.abs(q.y - ly) < r + 6,
      )
      if (!hitsLabel && !hitsMarker) {
        labels.push({ x: pl.x, y: ly, w })
        label.add(pl.id)
      }
    }
    return { hidden, count, label }
  }, [points, k, px, size, active.id])
  /* Piirtojärjestys: tärkein päällimmäiseksi, aktiivinen kaikkien päälle */
  const drawOrder = useMemo(
    () =>
      [...points]
        .filter((p) => !layout.hidden.has(p.mk.id))
        .reverse()
        .sort((a, b) => Number(a.mk.id === active.id) - Number(b.mk.id === active.id)),
    [points, layout, active.id],
  )

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[1fr_300px]">
      <section
        className="corners relative self-start overflow-hidden rounded-sm border border-line bg-[#1f3a3d]"
        aria-label={m.title}
      >
        <div
          className="relative aspect-square w-full sm:aspect-[4/3] lg:aspect-[16/10]"
          style={{ backgroundImage: `url(${backgrounds.map})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            className="map-svg absolute inset-0 size-full cursor-grab active:cursor-grabbing"
            role="img"
            aria-label={m.title}
          >
            <defs>
              <radialGradient id="map-hole">
                <stop offset="50%" stopColor="#000" />
                <stop offset="100%" stopColor="#fff" />
              </radialGradient>
              <filter id="map-cloud-edge" x="-30%" y="-30%" width="160%" height="160%">
                <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="map-cloud-tex" x="0" y="0" width="100%" height="100%">
                <feTurbulence type="fractalNoise" baseFrequency="0.0045" numOctaves="3" seed="3" result="n" />
                <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.75  0 0 0 0 0.8  0 0 0 0 0.8  0 0 0 0.9 -0.25" />
              </filter>
              <mask id="map-fog" maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <rect width={W} height={H} fill="#fff" />
                <g filter="url(#map-cloud-edge)">
                  {points
                    .filter((p) => REVEAL[p.mk.kind] > 0)
                    .map((p) => (
                      <circle key={p.mk.id} cx={p.xy[0]} cy={p.xy[1]} r={REVEAL[p.mk.kind]} fill="url(#map-hole)" />
                    ))}
                </g>
              </mask>
              <linearGradient id="map-land-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4ab80" />
                <stop offset="100%" stopColor="#ad9269" />
              </linearGradient>
            </defs>

            <g transform={tf.toString()}>
              {/* pallon reuna + astegridi */}
              <path d={GRAT_D} className="map-grat" />
              {/* matalikot: leveä vaalea reunus meren puolella */}
              <path d={LAND_D} className="map-shallows" />
              {/* maa */}
              <path d={LAND_D} className="map-land" fill="url(#map-land-grad)" />
              <path d={BORDER_D} className="map-border" />
              <path d={LAND_D} className="map-coast" />
              <path d={SPHERE_D} className="map-sphere" />

              {/* aluenimet */}
              {regions.map((r) => (
                <text
                  key={r.name}
                  className={cn('map-region', SEA_REGIONS.test(r.name) && 'map-region-sea')}
                  transform={`translate(${r.xy[0]},${r.xy[1]}) scale(${regionScale})`}
                  fontSize={REGION_SIZE[r.size]}
                >
                  {r.name}
                </text>
              ))}

              {/* fog of war */}
              <g mask="url(#map-fog)" pointerEvents="none">
                <rect width={W} height={H} fill="#07131a" opacity="0.55" />
                <rect width={W} height={H} filter="url(#map-cloud-tex)" opacity="0.42" />
              </g>

              {/* reitit */}
              {routes.map((r) => (
                <path
                  key={r.id}
                  d={r.d}
                  className={cn('map-route', r.kind === 'travel' ? 'map-route-travel' : 'map-route-plan')}
                >
                  <title>{r.label}</title>
                </path>
              ))}

              {/* merkit – pysyvät samankokoisina zoomatessa */}
              {drawOrder.map(({ mk, xy }) => {
                const Icon = ICON[mk.kind]
                const isActive = active.id === mk.id
                const color = COLOR[mk.kind]
                const more = layout.count.get(mk.id) ?? 0
                return (
                  <g
                    key={mk.id}
                    className="marker cursor-pointer outline-none"
                    transform={`translate(${xy[0]},${xy[1]}) scale(${markerScale})`}
                    tabIndex={0}
                    role="button"
                    aria-label={more ? `${mk.name} (+${more})` : mk.name}
                    aria-pressed={isActive}
                    onMouseEnter={() => {
                      if (!isActive) play('tick')
                      setActive(mk)
                    }}
                    onFocus={() => setActive(mk)}
                    onClick={() => {
                      play('select')
                      setActive(mk)
                      zoomTo(mk)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        play('select')
                        zoomTo(mk)
                      }
                    }}
                  >
                    {isActive && (
                      <circle
                        r={22}
                        fill="none"
                        stroke={color}
                        strokeWidth={1.5}
                        className="animate-pulse-ring"
                        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                      />
                    )}
                    <circle r={19} fill="rgba(20,17,15,0.35)" />
                    <path
                      d="M0 -16 L14 0 L0 16 L-14 0 Z"
                      fill="#1c1714"
                      stroke={color}
                      strokeWidth={isActive ? 2 : 1.4}
                      strokeDasharray={mk.kind === 'offmap' ? '3 2' : undefined}
                      className="marker-frame"
                    />
                    <Icon x={-7} y={-7} width={14} height={14} color={color} strokeWidth={2} />
                    {more > 0 && (
                      <g transform="translate(13,-13)" aria-hidden>
                        <circle r={8.5} fill="#1c1714" stroke="var(--brass)" strokeWidth={1.2} />
                        <text y={3.2} textAnchor="middle" fontSize={9} fontWeight={700} fill="var(--brass-2)">
                          +{more}
                        </text>
                      </g>
                    )}
                    {(layout.label.has(mk.id) || isActive) && (
                      <text y={32} className="map-label" fill={isActive ? 'var(--brass-2)' : 'var(--ink-2)'}>
                        {mk.name}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          </svg>

          {/* sisävarjo */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

          {/* kompassiruusu */}
          <div className="pointer-events-none absolute right-3 top-3">
            <CompassRose />
          </div>

          {/* zoom-napit */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1">
            {(
              [
                [Plus, m.ui.zoomIn, () => zoomBy(1.6)],
                [Minus, m.ui.zoomOut, () => zoomBy(1 / 1.6)],
                [
                  Scan,
                  m.ui.reset,
                  () => {
                    play('tick')
                    animateTo(fitAll())
                  },
                ],
              ] as const
            ).map(([Ic, label, fn]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                onClick={fn}
                onMouseEnter={() => play('tick')}
                className="grid size-9 place-items-center rounded-sm border border-line bg-bg/80 text-ink-2 backdrop-blur-sm transition-colors hover:border-brass hover:text-brass-2 cursor-pointer"
              >
                <Ic className="size-4" />
              </button>
            ))}
          </div>

          {/* selite */}
          <div className="pointer-events-none absolute left-3 bottom-3 hidden gap-x-4 gap-y-1 rounded-sm border border-line/70 bg-bg/70 px-3 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-ink-2 backdrop-blur-sm sm:flex sm:flex-wrap">
            {kinds.map((kind) => (
              <span key={kind} className="flex items-center gap-1.5">
                <span className="size-2 rotate-45" style={{ background: COLOR[kind] }} />
                {m.legend[kind]}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-[#1b2b31] ring-1 ring-ink/30" />
              {m.ui.fog}
            </span>
          </div>

          {/* zoom-taso */}
          <div className="pointer-events-none absolute left-3 top-3 rounded-sm border border-line/70 bg-bg/70 px-2 py-1 font-mono text-[0.62rem] text-muted-foreground backdrop-blur-sm">
            {k.toFixed(1)}×
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="panel corners rounded-sm p-4">
          <h2 className="brass-rule decode text-xl tracking-[0.1em] text-ink">{m.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{m.lead}</p>
        </div>
        <div key={active.id} className="panel corners glitch-x animate-in fade-in-0 rounded-sm p-4 duration-300">
          <p className="label-caps" style={{ color: COLOR[active.kind] }}>
            {m.legend[active.kind]}
            {active.kind === 'offmap' && ` · ${m.offmapHint}`}
          </p>
          <h3 className="mt-1 text-lg tracking-[0.08em] text-ink">{active.name}</h3>
          <p className="text-xs text-ink-2">{active.caption}</p>
          <p className="mt-3 text-sm text-ink-2">{active.desc}</p>
          <p className="mt-3 font-mono text-[0.68rem] text-muted-foreground">
            {m.ui.coords}: {Math.abs(active.lat).toFixed(2)}° {active.lat < 0 ? 'S' : 'N'} ·{' '}
            {Math.abs(active.lon).toFixed(2)}° {active.lon < 0 ? 'W' : 'E'}
          </p>
        </div>
        <div className="panel rounded-sm p-3">
          <p className="label-caps mb-2 px-1">{m.fastTravel}</p>
          <div className="flex flex-col gap-2 lg:max-h-[24rem] lg:overflow-y-auto lg:pr-1">
            {kinds.map((kind) => (
              <div key={kind}>
                <p
                  className="flex items-center gap-2 px-2 pb-1 pt-1 text-[0.62rem] uppercase tracking-[0.18em]"
                  style={{ color: COLOR[kind] }}
                >
                  <span className="size-1.5 rotate-45" style={{ background: COLOR[kind] }} />
                  {m.legend[kind]}
                </p>
                <ul className="flex flex-col">
                  {m.markers
                    .filter((mk) => mk.kind === kind)
                    .map((mk) => (
                      <li key={mk.id}>
                        <button
                          type="button"
                          onMouseEnter={() => play('tick')}
                          onClick={() => {
                            play('select')
                            setActive(mk)
                            zoomTo(mk)
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-sm px-2 py-2 text-left text-sm transition-colors hover:bg-brass/10 cursor-pointer',
                            active.id === mk.id && 'bg-brass/10 text-brass-2',
                          )}
                        >
                          {(() => {
                            const Ic = ICON[mk.kind]
                            return <Ic className="size-3.5 shrink-0" style={{ color: COLOR[mk.kind] }} />
                          })()}
                          <span className="flex-1">{mk.name}</span>
                          <span className="truncate text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                            {mk.caption.split(' · ')[1] ?? ''}
                          </span>
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-2 border-t border-line/70 px-1 pt-2">
            {routes.map((r) => (
              <p
                key={r.id}
                className="flex items-center gap-2 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground"
              >
                <span
                  className={cn(
                    'h-0 w-5 border-t-2',
                    r.kind === 'travel' ? 'border-dashed border-ember-2' : 'border-dotted border-teal-2',
                  )}
                />
                {r.label}
              </p>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
