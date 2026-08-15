export function shade(hex: string, amount = -16): string {
  const n = parseInt(hex.slice(1), 16)
  if (Number.isNaN(n) || hex.length !== 7) return hex
  const r = Math.max(0, Math.min(255, (n >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (n & 0xff) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}
