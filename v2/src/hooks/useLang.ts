import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { content, type Content, type Lang } from '@/content'

const STORAGE_KEY = 'laikku-lang'

function readInitial(): Lang {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'fi' || stored === 'en') return stored
  } catch {}
  // Ensimmäisellä kerralla selaimen kieli: englanninkieliset saavat en-version.
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'fi'
  return nav.startsWith('fi') ? 'fi' : nav.startsWith('en') ? 'en' : 'fi'
}

export interface LangState {
  lang: Lang
  setLang: (l: Lang) => void
  t: Content
}

export const LangContext = createContext<LangState | null>(null)

export function useLangState(): LangState {
  const [lang, setLangState] = useState<Lang>(readInitial)
  const t = content[lang]

  useEffect(() => {
    document.documentElement.lang = t.htmlLang
    document.title = t.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.description)
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {}
  }, [lang, t])

  const setLang = useCallback((l: Lang) => setLangState(l), [])

  return useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
}

export function useLang(): LangState {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside <LangContext.Provider>')
  return ctx
}
