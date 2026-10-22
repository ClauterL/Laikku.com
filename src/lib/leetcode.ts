import data from '@/data/leetcode.json'

/* LeetCode-tilastot (generoitu: scripts/fetch-leetcode.mjs → src/data/leetcode.json).
   Käytössä sekä normaalissa portfoliossa että pelin taitopuussa. */

export type Difficulty = 'easy' | 'medium' | 'hard'
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export interface LeetCodeData {
  user: string
  url: string
  fetchedAt: string | null
  ranking: number | null
  solved: Record<'all' | Difficulty, number>
  total: Record<'all' | Difficulty, number>
  languages: { name: string; solved: number }[]
  topics: { name: string; slug: string; solved: number; level: string }[]
}

export const leetcode = data as LeetCodeData
/** Näytetäänkö LeetCode-osio lainkaan (build ei saanut dataa → piilossa) */
export const hasLeetCode = leetcode.solved.all > 0

/** LeetCoden kielinimi → TechIcon-avain */
const ICONS: Record<string, string> = {
  Python: 'python',
  Python3: 'python',
  TypeScript: 'typescript',
  JavaScript: 'javascript',
  Pandas: 'pandas',
  PHP: 'php',
  MySQL: 'mysql',
  Bash: 'bash',
}
export const langIcon = (name: string) => ICONS[name]
/** Näyttönimi: "Python3" → "Python" */
export const langLabel = (name: string) => (name === 'Python3' ? 'Python' : name)

/** LeetCode sijoittaa vain 5 miljoonaa parasta; kaikki muut saavat arvon 5 000 001 (tarkistettu 10/2026
    profiileista, joilla 0–10 ratkaisua). Asteikko on siis #1 – #5 000 000. */
export const RANK_SCALE = 5_000_000

/** Prosentin pohja: aktiiviset ratkaisijat eli vähintään ACTIVE_MIN tehtävää ratkaisseet. Raja osuu noin sijalle
    2,725 milj. (otos 1 175 käyttäjästä 10/2026: sijoitus määräytyy ratkaisumäärästä, ei poikkeuksia järjestyksessä). */
export const ACTIVE_MIN = 50
export const ACTIVE_POOL = 2_725_000
/** Pohja miljoonina yhdellä desimaalilla (tekstiin) */
export const poolMillions = (lang: string) => fmtNum(Math.round(ACTIVE_POOL / 100_000) / 10, lang)

/** Kuinka monen prosentin parhaimmistoon sijoitus kuuluu aktiivisista – pyöristys aina ylöspäin (ei liioittele) */
export function topPercent(rank: number) {
  const pct = (rank / ACTIVE_POOL) * 100
  if (pct < 0.1) return Math.max(Math.ceil(pct * 100) / 100, 0.01)
  if (pct < 10) return Math.ceil(pct * 10) / 10
  return Math.ceil(pct)
}

export const fmtNum = (n: number, lang: string) => n.toLocaleString(lang === 'fi' ? 'fi-FI' : 'en-GB', { maximumFractionDigits: 2 })
export const fmtDate = (iso: string | null, lang: string) =>
  iso ? new Date(iso).toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''
export const topicUrl = (slug: string) => `https://leetcode.com/problem-list/${slug}/`
/** "{pct}"/"{max}"-paikkamerkit sisältötekstissä */
export const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m)
