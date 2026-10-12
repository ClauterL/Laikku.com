import { useCallback, useEffect, useState } from 'react'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { StartScreen } from '@/components/game/StartScreen'
import { TopBar } from '@/components/game/TopBar'
import { BottomBar } from '@/components/game/BottomBar'
import { InventoryScreen } from '@/components/game/InventoryScreen'
import { GoodsScreen } from '@/components/game/GoodsScreen'
import { SkillsScreen } from '@/components/game/SkillsScreen'
import { MapScreen } from '@/components/game/MapScreen'
import { QuestsScreen } from '@/components/game/QuestsScreen'
import { OrderScreen } from '@/components/game/OrderScreen'
import { CodexScreen } from '@/components/game/CodexScreen'
import { LangContext, useLangState } from '@/hooks/useLang'
import { SoundContext, useSoundState } from '@/hooks/useSound'
import { backgrounds, type TabId } from '@/content'

const TAB_IDS: TabId[] = ['skills', 'inventory', 'items', 'map', 'quests', 'order', 'codex']

function readHash(): TabId {
  const h = window.location.hash.replace('#', '') as TabId
  return TAB_IDS.includes(h) ? h : 'inventory'
}

export default function App() {
  const lang = useLangState()
  const sound = useSoundState()
  const [started, setStarted] = useState(false)
  const [tab, setTabState] = useState<TabId>(readHash)
  const [fx, setFx] = useState(0)

  const setTab = useCallback(
    (id: TabId) => {
      setTabState(id)
      setFx((n) => n + 1)
      try {
        window.history.replaceState(null, '', `#${id}`)
      } catch {}
    },
    [],
  )

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = TAB_IDS.indexOf(tab)
      const next = TAB_IDS[(i + dir + TAB_IDS.length) % TAB_IDS.length]
      sound.play('tab')
      setTab(next)
    },
    [tab, setTab, sound],
  )

  // Globaalit näppäimet: Q/E välilehdet, M mykistys
  useEffect(() => {
    if (!started) return
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.key === 'q' || e.key === 'Q' || e.key === '[') step(-1)
      else if (e.key === 'e' || e.key === 'E' || e.key === ']') step(1)
      else if (e.key === 'm' || e.key === 'M') sound.toggleMute()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, step, sound])

  useEffect(() => {
    const onHash = () => setTabState(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <LangContext.Provider value={lang}>
      <SoundContext.Provider value={sound}>
        <div className="screen-bg" style={{ ['--bg-image' as string]: `url(${backgrounds.menu})` }} />
        <div className="scanlines" aria-hidden />
        {!started && <StartScreen onDone={() => setStarted(true)} />}

        <Tabs
          value={tab}
          onValueChange={(v) => {
            sound.play('tab')
            setTab(v as TabId)
          }}
          className="flex min-h-full flex-col"
        >
          <TopBar tab={tab} onSelectTab={(id) => setTab(id)} />
          <main id="main" key={fx} className={started ? 'screen-in flex-1' : 'iris-open flex-1'}>
            <TabsContent value="skills">
              <SkillsScreen />
            </TabsContent>
            <TabsContent value="inventory">
              <InventoryScreen />
            </TabsContent>
            <TabsContent value="items">
              <GoodsScreen />
            </TabsContent>
            <TabsContent value="map">
              <MapScreen />
            </TabsContent>
            <TabsContent value="quests">
              <QuestsScreen />
            </TabsContent>
            <TabsContent value="order">
              <OrderScreen onSelectTab={setTab} />
            </TabsContent>
            <TabsContent value="codex">
              <CodexScreen />
            </TabsContent>
          </main>
          <BottomBar />
        </Tabs>
      </SoundContext.Provider>
    </LangContext.Provider>
  )
}
