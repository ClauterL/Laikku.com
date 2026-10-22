#!/usr/bin/env node
/**
 * Hakee julkiset LeetCode-tiedot build-aikana ja kirjoittaa ne
 * src/data/leetcode.json-tiedostoon. Ei vaadi kirjautumista:
 *   - julkinen GraphQL: https://leetcode.com/graphql (sama, jota profiilisivu käyttää)
 *
 * Talteen: globaali sijoitus, ratkaistut tehtävät vaikeustasoittain (ja kaikkien tehtävien määrät),
 * kielet joilla on ratkaistu sekä aihealueet. Aktiivisuuskalenteria ja viimeisimpiä lähetyksiä ei tallenneta.
 *
 * Jos verkko ei toimi (tai LeetCode vastaa virheellä), vanha JSON jätetään
 * paikalleen, jotta build ei koskaan kaadu dataan.
 *
 * Käyttö: node scripts/fetch-leetcode.mjs   (ajetaan automaattisesti `npm run build` -komennossa)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const USER = process.env.LEETCODE_USER || 'clauterl'
const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/leetcode.json')

const QUERY = `query profile($u: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $u) {
    username
    profile { ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
    languageProblemCount { languageName problemsSolved }
    tagProblemCounts {
      advanced { tagName tagSlug problemsSolved }
      intermediate { tagName tagSlug problemsSolved }
      fundamental { tagName tagSlug problemsSolved }
    }
  }
}`

const empty = {
  user: USER,
  url: `https://leetcode.com/u/${USER}/`,
  fetchedAt: null,
  ranking: null,
  solved: { all: 0, easy: 0, medium: 0, hard: 0 },
  total: { all: 0, easy: 0, medium: 0, hard: 0 },
  languages: [],
  topics: [],
}

/** [{difficulty:'Easy',count}] → {all, easy, medium, hard} */
const byDifficulty = (list) =>
  Object.fromEntries(['All', 'Easy', 'Medium', 'Hard'].map((d) => [d.toLowerCase(), list.find((x) => x.difficulty === d)?.count ?? 0]))

async function main() {
  let previous = null
  try {
    previous = JSON.parse(readFileSync(OUT, 'utf8'))
  } catch {}

  try {
    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: `https://leetcode.com/u/${USER}/`,
        'User-Agent': 'laikku.com-build (+https://laikku.com)',
      },
      body: JSON.stringify({ query: QUERY, variables: { u: USER } }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const u = json?.data?.matchedUser
    if (!u) throw new Error(json?.errors?.[0]?.message || 'user not found')

    const levels = ['fundamental', 'intermediate', 'advanced']
    const topics = levels
      .flatMap((level) => (u.tagProblemCounts?.[level] ?? []).map((t) => ({ name: t.tagName, slug: t.tagSlug, solved: t.problemsSolved, level })))
      .filter((t) => t.solved > 0)
      .sort((a, b) => b.solved - a.solved)

    const data = {
      user: u.username,
      url: `https://leetcode.com/u/${u.username}/`,
      fetchedAt: new Date().toISOString(),
      ranking: u.profile?.ranking ?? null,
      solved: byDifficulty(u.submitStatsGlobal?.acSubmissionNum ?? []),
      total: byDifficulty(json.data.allQuestionsCount ?? []),
      languages: (u.languageProblemCount ?? [])
        .map((l) => ({ name: l.languageName, solved: l.problemsSolved }))
        .filter((l) => l.solved > 0)
        .sort((a, b) => b.solved - a.solved),
      topics,
    }
    mkdirSync(dirname(OUT), { recursive: true })
    writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n')
    console.log(`[leetcode] ${data.user}: ${data.solved.all}/${data.total.all} solved, rank #${data.ranking}, ${data.languages.length} languages → ${OUT}`)
  } catch (err) {
    if (previous) {
      console.warn(`[leetcode] fetch failed (${err.message}); keeping cached data from ${previous.fetchedAt}`)
    } else {
      console.warn(`[leetcode] fetch failed (${err.message}); writing empty placeholder`)
      mkdirSync(dirname(OUT), { recursive: true })
      writeFileSync(OUT, JSON.stringify(empty, null, 2) + '\n')
    }
  }
}

main()
