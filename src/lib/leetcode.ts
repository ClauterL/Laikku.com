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

export const fmtNum = (n: number, lang: string) => n.toLocaleString(lang === 'fi' ? 'fi-FI' : 'en-GB')
export const fmtDate = (iso: string | null, lang: string) =>
  iso ? new Date(iso).toLocaleDateString(lang === 'fi' ? 'fi-FI' : 'en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''
export const topicUrl = (slug: string) => `https://leetcode.com/problem-list/${slug}/`
