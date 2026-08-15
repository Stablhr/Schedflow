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
