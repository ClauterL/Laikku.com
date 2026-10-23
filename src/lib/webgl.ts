/** Toimiiko WebGL tässä selaimessa (Kahvijahti tarvitsee sen). Tulos muistetaan; testikonteksti vapautetaan heti.
    Ilman WebGL:ää (näytönohjaimen kiihdytys pois, vanha laite, tiukka yksityisyystila) pelillistetty puoli
    avaa 2D-Dronelennon, ettei sivu kaadu mustaksi. */
let cached: boolean | null = null

export function hasWebGL(): boolean {
  if (cached !== null) return cached
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    cached = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}
