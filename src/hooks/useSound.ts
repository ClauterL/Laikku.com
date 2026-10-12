import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import * as sfx from '@/lib/sfx'

export interface SoundState {
  muted: boolean
  ambient: boolean
  ready: boolean
  start: () => void
  toggleMute: () => void
  setAmbient: (on: boolean) => void
  play: (name: Parameters<typeof sfx.play>[0]) => void
}

export const SoundContext = createContext<SoundState | null>(null)

export function useSoundState(): SoundState {
  const [muted, setMuted] = useState(sfx.isMuted())
  const [ambient, setAmbientState] = useState(false)
  const [ready, setReady] = useState(false)

  const start = useCallback(() => {
    sfx.init()
    setReady(true)
  }, [])

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      sfx.setMuted(!m)
      return !m
    })
  }, [])

  const setAmbient = useCallback((on: boolean) => {
    sfx.setAmbient(on)
    setAmbientState(on)
  }, [])

  const play = useCallback((name: Parameters<typeof sfx.play>[0]) => sfx.play(name), [])

  return useMemo(() => ({ muted, ambient, ready, start, toggleMute, setAmbient, play }), [muted, ambient, ready, start, toggleMute, setAmbient, play])
}

export function useSound(): SoundState {
  const ctx = useContext(SoundContext)
  if (!ctx) throw new Error('useSound must be used inside <SoundContext.Provider>')
  return ctx
}
