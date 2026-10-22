import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { StartScreen, type Mode } from '@/components/game/StartScreen'
import { LangContext, useLangState } from '@/hooks/useLang'
import { SoundContext, useSoundState } from '@/hooks/useSound'
import { backgrounds, type TabId } from '@/content'
import { FLIGHT_HASH, PORTFOLIO_HASH, TAB_IDS, isGameHash, setHash } from '@/lib/routes'

// Kumpikin portfolio on oma pakettinsa: normaalin valitsija ei lataa pelivalikkoa eikä 3D:tä, ja päinvastoin
const loadPortfolio = () => import('@/components/portfolio/Portfolio')
const loadFlight = () => import('@/components/flight/FlightGame')
const loadGame = () => import('@/components/game/GameShell')
const loadLoft = () => import('@/components/loft/LoftView')
const Portfolio = lazy(loadPortfolio)
const FlightGame = lazy(loadFlight)
const GameShell = lazy(loadGame)

/** game = dronelento (pelillistetty), loft = vanha 3D-loft + pelivalikko (varmuuskopio, vain piilo-osoitteista) */
type View = 'start' | Mode | 'loft'

/** Vanha 3D-loft avautuu vain, jos sivulle tullaan sen osoitteella (#loft, #map …) – muuten pelillistetty = dronelento */
const LEGACY = isGameHash(window.location.hash)

/* Kaksi portfoliota samassa sivustossa: aloitusruutu kysyy, kumpi avataan.
   - Normaali (#portfolio): perinteinen yhden sivun portfolio, ei ääniä eikä 3D:tä.
   - Pelillistetty (#flight): dronelento järven yli, pesukarhu kyydissä (components/flight).
   - Varmuuskopio: vanha 3D-loft + pelivalikko avautuu yhä osoitteilla #loft ja #skills, #map … (aloitusruudun kautta);
     koodi myös haarassa loft-3d-backup.
   Suora linkki #portfolio ohittaa aloitusruudun. */
export default function App() {
  const lang = useLangState()
  const sound = useSoundState()
  const [view, setView] = useState<View>(() => (window.location.hash === PORTFOLIO_HASH ? 'normal' : 'start'))
  /** Aloitusruutu pysyy päällä, kunnes se on häivytetty valitun portfolion päältä */
  const [startOpen, setStartOpen] = useState(() => window.location.hash !== PORTFOLIO_HASH)
  /** Välilehti, jolle Esc loftista vie (osoitteen #map tms. mukaan, muuten Projektit) */
  const [gameTab, setGameTab] = useState<TabId | undefined>()

  const toNormal = useCallback(() => {
    sound.setAmbient(false)
    setHash(PORTFOLIO_HASH)
    setView('normal')
    window.scrollTo(0, 0)
  }, [sound])

  /** Pelillistetty: dronelento */
  const toGame = useCallback(() => {
    sound.start()
    sound.setAmbient(false)
    setHash(FLIGHT_HASH)
    setView('game')
    window.scrollTo(0, 0)
  }, [sound])

  /** Varmuuskopio: vanha loft aukeaa suoraan; osoitteen välilehti (#map …) muistetaan Esc-valikkoa varten */
  const toLoft = useCallback(() => {
    sound.start()
    const h = window.location.hash.slice(1) as TabId
    setGameTab(TAB_IDS.includes(h) ? h : undefined)
    setHash('#loft')
    setView('loft')
    window.scrollTo(0, 0)
  }, [sound])

  /** Ennakkolataus heti valinnasta; aloitusruutu odottaa normaalin paketin ennen kuin vaihtaa näkymää */
  const onPick = useCallback(
    (mode: Mode) => (mode === 'normal' ? loadPortfolio() : LEGACY ? Promise.all([loadGame(), loadLoft()]) : loadFlight()),
    [],
  )
  const onStartExited = useCallback(() => setStartOpen(false), [])

  const onStartDone = useCallback(
    (mode: Mode) => {
      if (mode === 'normal') toNormal()
      else if (LEGACY) toLoft()
      else toGame()
    },
    [toNormal, toGame, toLoft],
  )

  // Selaimen osoiterivi / takaisin-nappi vaihtaa portfoliota
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash
      if (h === PORTFOLIO_HASH) setView((v) => (v === 'start' ? v : 'normal'))
      else if (h === FLIGHT_HASH) setView((v) => (v === 'normal' ? 'game' : v))
      else if (isGameHash(h)) setView((v) => (v === 'normal' ? 'loft' : v))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <LangContext.Provider value={lang}>
      <SoundContext.Provider value={sound}>
        {view === 'loft' && (
          <>
            <div className="screen-bg" style={{ ['--bg-image' as string]: `url(${backgrounds.menu})` }} />
            <div className="scanlines" aria-hidden />
          </>
        )}
        {startOpen && <StartScreen onPick={onPick} onDone={onStartDone} onExited={onStartExited} />}
        {view === 'game' && (
          <Suspense fallback={null}>
            <FlightGame onNormal={toNormal} />
          </Suspense>
        )}
        {view === 'loft' && (
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
