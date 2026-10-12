import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'laikku-theme'

function systemTheme(): Theme {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function readInitial(): { theme: Theme; explicit: boolean } {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return { theme: stored, explicit: true }
  } catch {}
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return { theme: attr, explicit: true }
  return { theme: systemTheme(), explicit: false }
}

function apply(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f0e11' : '#f3eee4')
}

/**
 * Vaalea/tumma teema: käyttäjän valinta localStoragessa, muuten seurataan
 * käyttöjärjestelmän asetusta (ja seurataan sen muutoksia kunnes käyttäjä valitsee).
 */
export function useTheme() {
  const [state, setState] = useState(readInitial)

  useEffect(() => {
    apply(state.theme)
  }, [state.theme])

  useEffect(() => {
    if (state.explicit) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setState((s) => (s.explicit ? s : { theme: mq.matches ? 'dark' : 'light', explicit: false }))
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [state.explicit])

  const setTheme = useCallback((theme: Theme) => {
    setState({ theme, explicit: true })
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [])

  const toggle = useCallback(() => setTheme(state.theme === 'dark' ? 'light' : 'dark'), [setTheme, state.theme])

  return { theme: state.theme, setTheme, toggle }
}
