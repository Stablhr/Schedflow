export type Urgency = 'none' | 'normal' | 'soon' | 'overdue'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function getUrgency(due: string | null, now: Date = new Date()): Urgency {
  if (!due) return 'none'
  const dueDate = new Date(`${due}T00:00:00`)
  if (Number.isNaN(dueDate.getTime())) return 'none'
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const diffDays = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'overdue'
  if (diffDays < 2) return 'soon'
  return 'normal'
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function isDueThisWeek(iso: string, now: Date = new Date()): boolean {
  const dueDate = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(dueDate.getTime())) return false
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(today)
  end.setDate(today.getDate() + 6)
  return dueDate >= today && dueDate <= end
}

export function startOfWeek(now: Date = new Date()): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b)
}
