#!/usr/bin/env node
/**
 * Hakee julkiset GitHub-tiedot build-aikana ja kirjoittaa ne
 * src/data/github.json-tiedostoon. Ei vaadi tokenia:
 *   - kontribuutiokalenteri: https://github.com/users/<user>/contributions (HTML)
 *   - julkiset repot:        https://api.github.com/users/<user>/repos
 *
 * Jos verkko ei toimi (tai GitHub vastaa virheellä), vanha JSON jätetään
 * paikalleen, jotta build ei koskaan kaadu dataan.
 *
 * Käyttö: node scripts/fetch-github.mjs   (ajetaan automaattisesti `npm run build` -komennossa)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const USER = process.env.GITHUB_USER || 'ClauterL'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/github.json')

const headers = {
  'User-Agent': 'laikku.com-build (+https://laikku.com)',
  Accept: 'application/vnd.github+json',
}
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

async function fetchText(url, init = {}) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.text()
}

/** Parsii GitHubin kontribuutiokalenterin HTML:n päiväkohtaiseksi listaksi. */
function parseContributions(html) {
  const days = new Map()
  const cellRe = /<td[^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*id="([^"]+)"[^>]*data-level="(\d)"[^>]*>/g
  for (const m of html.matchAll(cellRe)) {
    days.set(m[2], { date: m[1], level: Number(m[3]), count: 0 })
  }
  // Määrät ovat erillisissä <tool-tip for="...">-elementeissä.
  const tipRe = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g
  for (const m of html.matchAll(tipRe)) {
    const cell = days.get(m[1])
    if (!cell) continue
    const n = /^(\d[\d,]*) contribution/.exec(m[2].trim())
    cell.count = n ? Number(n[1].replace(/,/g, '')) : 0
  }
  const list = [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
  // Ryhmitellään viikoiksi (GitHubin ruudukko alkaa sunnuntaista).
  const weeks = []
  let week = []
  for (const d of list) {
    const dow = new Date(d.date + 'T00:00:00Z').getUTCDay()
    if (dow === 0 && week.length) {
      weeks.push(week)
      week = []
    }
    week.push(d)
  }
  if (week.length) weeks.push(week)
  const total = list.reduce((s, d) => s + d.count, 0)
  // Pisin putki ja nykyinen putki
  let longest = 0
  let current = 0
  let run = 0
  for (const d of list) {
    run = d.count > 0 ? run + 1 : 0
    longest = Math.max(longest, run)
  }
  for (let i = list.length - 1; i >= 0 && list[i].count > 0; i--) current++
  return { total, weeks, longestStreak: longest, currentStreak: current, days: list.length }
}

async function main() {
  let previous = null
  try {
    previous = JSON.parse(readFileSync(OUT, 'utf8'))
  } catch {}

  try {
    const [html, reposJson] = await Promise.all([
      fetchText(`https://github.com/users/${USER}/contributions`, { headers: { 'User-Agent': headers['User-Agent'] } }),
      fetchText(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&type=owner`, { headers }),
    ])
    const contributions = parseContributions(html)
    if (!contributions.days) throw new Error('contribution calendar not found in HTML')

    const repos = JSON.parse(reposJson)
      .filter((r) => !r.fork && !r.archived)
      .map((r) => ({
        name: r.name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        url: r.html_url,
        homepage: r.homepage || null,
        pushedAt: r.pushed_at,
        topics: r.topics || [],
      }))
      .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt))

    const languages = {}
    for (const r of repos) if (r.language) languages[r.language] = (languages[r.language] || 0) + 1

    const data = {
      user: USER,
      fetchedAt: new Date().toISOString(),
      contributions,
      repos,
      languages,
    }
    mkdirSync(dirname(OUT), { recursive: true })
    writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n')
    console.log(
      `[github] ${USER}: ${contributions.total} contributions / ${contributions.days} days, ${repos.length} public repos → ${OUT}`,
    )
  } catch (err) {
    if (previous) {
      console.warn(`[github] fetch failed (${err.message}); keeping cached data from ${previous.fetchedAt}`)
    } else {
      console.warn(`[github] fetch failed (${err.message}); writing empty placeholder`)
      mkdirSync(dirname(OUT), { recursive: true })
      writeFileSync(
        OUT,
        JSON.stringify(
          {
            user: USER,
            fetchedAt: null,
            contributions: { total: 0, weeks: [], longestStreak: 0, currentStreak: 0, days: 0 },
            repos: [],
            languages: {},
          },
          null,
          2,
        ) + '\n',
      )
    }
  }
}

main()
