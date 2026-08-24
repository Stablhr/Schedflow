function lerpColor(from: string, to: string, t: number): string {
  if (from.length !== 7 || to.length !== 7) return from
  const fn = parseInt(from.slice(1), 16)
  const tn = parseInt(to.slice(1), 16)
  const r = Math.round(((fn >> 16) & 0xff) * (1 - t) + ((tn >> 16) & 0xff) * t)
  const g = Math.round(((fn >> 8) & 0xff) * (1 - t) + ((tn >> 8) & 0xff) * t)
  const b = Math.round((fn & 0xff) * (1 - t) + (tn & 0xff) * t)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Generates a smooth 2-color blend gradient with intermediate stops.
 */
export function blendTwoStop(from: string, to: string, angle = 135): string {
  const mid = lerpColor(from, to, 0.5)
  const q1 = lerpColor(from, to, 0.25)
  const q3 = lerpColor(from, to, 0.75)
  return `linear-gradient(${angle}deg, ${from} 0%, ${q1} 25%, ${mid} 50%, ${q3} 75%, ${to} 100%)`
}
