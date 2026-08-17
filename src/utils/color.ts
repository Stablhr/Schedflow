export function shade(hex: string, amount = -16): string {
  const n = parseInt(hex.slice(1), 16)
  if (Number.isNaN(n) || hex.length !== 7) return hex
  const r = Math.max(0, Math.min(255, (n >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function hexToHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) / 255
  const g = ((n >> 8) & 0xff) / 255
  const b = (n & 0xff) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s * 100, l * 100]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }
  return `#${((1 << 24) + (f(0) << 16) + (f(8) << 8) + f(4)).toString(16).slice(1)}`
}

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
 * Generates a smooth multi-stop gradient that blends seamlessly.
 * Uses 5 color stops with eased interpolation for a soft, diffused look.
 */
export function blendGradient(hex: string, angle = 135): string {
  const [h, s, l] = hexToHsl(hex)
  const light = hslToHex(h, Math.min(s * 0.85, 100), Math.min(l + 14, 96))
  const mid = hslToHex(h, s, Math.max(l - 4, 8))
  const dark = hslToHex(h, Math.min(s * 1.1, 100), Math.max(l - 16, 5))
  const deeper = hslToHex(h, Math.min(s * 1.15, 100), Math.max(l - 26, 3))
  return `linear-gradient(${angle}deg, ${light} 0%, ${hex} 30%, ${mid} 50%, ${dark} 75%, ${deeper} 100%)`
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
