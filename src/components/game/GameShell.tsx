import { lazy, Suspense, useCallback, useEffect, useState } from 'react'

import { Tabs, TabsContent } from '@/components/ui/tabs'
import { TopBar } from '@/components/game/TopBar'
import { BottomBar } from '@/components/game/BottomBar'
import { InventoryScreen } from '@/components/game/InventoryScreen'
import { GoodsScreen } from '@/components/game/GoodsScreen'
import { SkillsScreen } from '@/components/game/SkillsScreen'
import { MapScreen } from '@/components/game/MapScreen'
import { QuestsScreen } from '@/components/game/QuestsScreen'
import { OrderScreen } from '@/components/game/OrderScreen'
import { CodexScreen } from '@/components/game/CodexScreen'
import { useLang } from '@/hooks/useLang'
import { useSound } from '@/hooks/useSound'
import type { TabId } from '@/content'
import { TAB_IDS, isGameHash, isLoftHash, setHash } from '@/lib/routes'

// 3D-loft ladataan vasta kun se avataan (three + rapier omaan pakettiinsa)
const LoftView = lazy(() => import('@/components/loft/LoftView'))

function readHash(): TabId {
  const h = window.location.hash.replace('#', '') as TabId
  return TAB_IDS.includes(h) ? h : 'inventory'
}

/* Pelillistetty portfolio: pelivalikko (välilehdet) ja sen päällä 3D-loft. Loft avautuu suoraan, kun
   osoite on #loft; Esc tai "Valikkoon" loftissa tuo valikon esiin. onNormal vaihtaa normaaliin sivuun. */
export default function GameShell({ initialTab, onNormal }: { initialTab?: TabId; onNormal: () => void }) {
  const sound = useSound()
  const { t } = useLang()
  const [tab, setTabState] = useState<TabId>(() => initialTab ?? readHash())
  const [fx, setFx] = useState(0)
  const [loft, setLoft] = useState(isLoftHash)

  const openLoft = useCallback(() => {
    setLoft(true)
    setHash('#loft')
  }, [])

  const setTab = useCallback((id: TabId) => {
    setTabState(id)
    setFx((n) => n + 1)
    setHash(`#${id}`)
  }, [])

  const step = useCallback(
    (dir: 1 | -1) => {
      const i = TAB_IDS.indexOf(tab)
      const next = TAB_IDS[(i + dir + TAB_IDS.length) % TAB_IDS.length]
      sound.play('tab')
      setTab(next)
    },
    [tab, setTab, sound],
  )

  const closeLoft = useCallback(() => {
    setLoft(false)
    setHash(`#${tab}`)
  }, [tab])

  // Globaalit näppäimet: Q/E välilehdet, M mykistys (loftissa omat näppäimet)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return
      if (e.key === 'm' || e.key === 'M') return sound.toggleMute()
      if (loft) return
      if (e.key === 'q' || e.key === 'Q' || e.key === '[') step(-1)
      else if (e.key === 'e' || e.key === 'E' || e.key === ']') step(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, sound, loft])

  useEffect(() => {
    const onHash = () => {
      if (!isGameHash()) return
      setLoft(isLoftHash())
      if (!isLoftHash()) setTabState(readHash())
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(v) => {
          sound.play('tab')
          setTab(v as TabId)
        }}
        className="flex min-h-full flex-col"
      >
        <TopBar tab={tab} onSelectTab={(id) => setTab(id)} onOpenLoft={openLoft} onNormal={onNormal} />
        <main id="main" key={fx} className={fx === 0 ? 'iris-open flex-1' : 'screen-in flex-1'}>
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
      {loft && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 grid place-items-center bg-bg" role="status">
              <p className="animate-blink font-display text-[0.75rem] uppercase tracking-[0.3em] text-ink-2">{t.loft.loading}</p>
            </div>
          }
        >
          <LoftView onExit={closeLoft} />
        </Suspense>
      )}
    </>
  )
}
