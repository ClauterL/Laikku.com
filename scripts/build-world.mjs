// Rakentaa kevennetyn maailmankartan (Natural Earth 50m, world-atlas) → src/data/world.json
// Ajetaan käsin: node scripts/build-world.mjs  (tulos on commitoitu, ei tarvita buildissa)
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { presimplify, simplify, quantile, filter, filterWeight } from 'topojson-simplify'
import { quantize } from 'topojson-client'

const require = createRequire(import.meta.url)
const src = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'))

// Yksinkertaista: säilytä ~35 % pisteistä, pudota alle ~0.01°² saaret
let topo = presimplify(src)
topo = simplify(topo, quantile(topo, 0.35))
topo = filter(topo, filterWeight(topo, 0.01))
topo = quantize(topo, 1e5)

// Pudota ominaisuudet, joita ei tarvita (nimi riittää)
for (const g of topo.objects.countries.geometries) {
  g.properties = { name: g.properties?.name }
}

const out = JSON.stringify(topo)
writeFileSync(new URL('../src/data/world.json', import.meta.url), out)
console.log('world.json', (out.length / 1024).toFixed(0), 'KB')
