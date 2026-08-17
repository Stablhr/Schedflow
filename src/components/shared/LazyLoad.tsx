import { useState, useEffect, type ReactNode } from 'react'

/**
 * Wraps children to show a skeleton placeholder on the first render,
 * then reveals the real content after the browser has painted.
 * Uses requestAnimationFrame + setTimeout(0) to ensure the skeleton
 * is visible for at least one frame before the content loads.
 */
export function LazyLoad({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let raf: number
    let timer: ReturnType<typeof setTimeout>
    raf = requestAnimationFrame(() => {
      timer = setTimeout(() => setReady(true), 0)
    })
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
    }
  }, [])

  if (!ready) return <>{skeleton}</>
  return <>{children}</>
}
