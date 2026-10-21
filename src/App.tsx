import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { StartScreen, type Mode } from '@/components/game/StartScreen'
import { LangContext, useLangState } from '@/hooks/useLang'
import { SoundContext, useSoundState } from '@/hooks/useSound'
import { backgrounds, type TabId } from '@/content'
import { PORTFOLIO_HASH, TAB_IDS, isGameHash, setHash } from '@/lib/routes'

// Kumpikin portfolio on oma pakettinsa: normaalin valitsija ei lataa pelivalikkoa eikä 3D:tä, ja päinvastoin
const loadPortfolio = () => import('@/components/portfolio/Portfolio')
const loadGame = () => import('@/components/game/GameShell')
const loadLoft = () => import('@/components/loft/LoftView')
const Portfolio = lazy(loadPortfolio)
const GameShell = lazy(loadGame)

type View = 'start' | Mode

/* Kaksi portfoliota samassa sivustossa: aloitusruutu kysyy, kumpi avataan.
   - Normaali (#portfolio): perinteinen yhden sivun portfolio, ei ääniä eikä 3D:tä.
   - Pelillistetty: 3D-loft aukeaa suoraan; Esc vie pelivalikkoon (välilehdet).
   Suora linkki #portfolio ohittaa aloitusruudun. */
export default function App() {
  const lang = useLangState()
  const sound = useSoundState()
  const [view, setView] = useState<View>(() => (window.location.hash === PORTFOLIO_HASH ? 'normal' : 'start'))
  /** Välilehti, jolle Esc loftista vie (osoitteen #map tms. mukaan, muuten Projektit) */
  const [gameTab, setGameTab] = useState<TabId | undefined>()

  const toNormal = useCallback(() => {
    sound.setAmbient(false)
    setHash(PORTFOLIO_HASH)
    setView('normal')
    window.scrollTo(0, 0)
  }, [sound])

  /** Pelillistetty: loft aukeaa aina suoraan; osoitteen välilehti (#map …) muistetaan Esc-valikkoa varten */
  const toGame = useCallback(() => {
    sound.start()
    const h = window.location.hash.slice(1) as TabId
    setGameTab(TAB_IDS.includes(h) ? h : undefined)
    setHash('#loft')
    setView('game')
    window.scrollTo(0, 0)
  }, [sound])

  const onPick = useCallback((mode: Mode) => {
    if (mode === 'game') void Promise.all([loadGame(), loadLoft()])
    else void loadPortfolio()
  }, [])

  const onStartDone = useCallback(
    (mode: Mode) => {
      if (mode === 'normal') toNormal()
      else toGame()
    },
    [toNormal, toGame],
  )

  // Selaimen osoiterivi / takaisin-nappi vaihtaa portfoliota
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash
      if (h === PORTFOLIO_HASH) setView((v) => (v === 'start' ? v : 'normal'))
      else if (isGameHash(h)) setView((v) => (v === 'normal' ? 'game' : v))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <LangContext.Provider value={lang}>
      <SoundContext.Provider value={sound}>
        {view !== 'normal' && (
          <>
            <div className="screen-bg" style={{ ['--bg-image' as string]: `url(${backgrounds.menu})` }} />
            <div className="scanlines" aria-hidden />
          </>
        )}
        {view === 'start' && <StartScreen onPick={onPick} onDone={onStartDone} />}
        {view === 'game' && (
          <Suspense fallback={null}>
            <GameShell initialTab={gameTab} onNormal={toNormal} />
          </Suspense>
        )}
        {view === 'normal' && (
          <Suspense fallback={<div className="min-h-svh bg-bg" />}>
            <Portfolio onGame={toGame} />
          </Suspense>
        )}
      </SoundContext.Provider>
    </LangContext.Provider>
  )
}
