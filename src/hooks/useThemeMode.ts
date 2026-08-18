import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import type { ThemeMode } from '../store/schema'

/**
 * Resolves the effective theme ('light' | 'dark') from the user's preference
 * and the system preference. Also applies the `dark` class to <html>.
 */
export function useThemeMode(): 'light' | 'dark' {
  const { data } = useStore()
  const mode: ThemeMode = data.ui.darkMode ?? 'system'

  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const resolved = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode

  useEffect(() => {
    const root = document.documentElement
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolved])

  return resolved
}

export function useThemeCycle() {
  const { data, setDarkMode } = useStore()
  const mode: ThemeMode = data.ui.darkMode ?? 'system'

  const cycle = () => {
    const next = mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'
    setDarkMode(next)
  }

  return { mode, cycle }
}
