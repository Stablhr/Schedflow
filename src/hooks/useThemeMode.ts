import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import type { ThemeMode } from '../store/schema'

/**
 * Resolves the effective theme: follows the user's stored preference,
 * falling back to the OS `prefers-color-scheme` when set to 'system'.
 * Applies the `dark` class to <html> so all `--color-*` tokens update.
 */
export function useThemeMode(): 'light' | 'dark' {
  const { data } = useStore()
  const mode: ThemeMode = data.ui.darkMode ?? 'system'

  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode

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