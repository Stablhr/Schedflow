import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { addDays, isSameDay, toISODate } from '../../utils/dates'
import type { Card } from '../../store/schema'

interface CalendarViewProps {
  boardId: string
  onOpenCard: (cardId: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const days: Date[] = []

  for (let i = startOffset - 1; i >= 0; i--) {
    days.push(addDays(firstDay, -(i + 1)))
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push(addDays(lastDay, i))
  }
  return days
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function CalendarView({ boardId, onOpenCard }: CalendarViewProps) {
  const { data } = useStore()
  const board = data.boards[boardId]
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth])

  const cards = useMemo(() => {
    if (!board) return []
    const lists = board.listOrder.map((id) => data.lists[id]).filter(Boolean)
    const result: Card[] = []
    for (const list of lists) {
      for (const cardId of list.cardOrder) {
        const card = data.cards[cardId]
        if (card && !card.archived && card.dueDate) {
          result.push(card)
        }
      }
    }
    return result
  }, [board, data.lists, data.cards])

  const cardsByDate = useMemo(() => {
    const map = new Map<string, Card[]>()
    for (const card of cards) {
      if (!card.dueDate) continue
      const existing = map.get(card.dueDate) ?? []
      existing.push(card)
      map.set(card.dueDate, existing)
    }
    return map
  }, [cards])

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const goToday = () => {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
  }

  if (!board) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border glass-subtle px-3 py-2.5 sm:px-4">
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">Calendar</h2>

        <div className="ml-2 flex items-center gap-1 sm:ml-4">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95"
            onClick={prevMonth}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-brand transition hover:bg-brand-light active:scale-95"
          >
            Today
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95"
            onClick={nextMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <span className="ml-1 font-display text-sm font-bold text-ink">
          {MONTHS[currentMonth]} {currentYear}
        </span>
      </div>

      <div className="scroll-slim flex-1 overflow-auto p-3">
        <div className="grid min-w-[700px] grid-cols-7 gap-px rounded-xl bg-border overflow-hidden">
          {WEEKDAYS.map((day) => (
            <div key={day} className="bg-surface-alt px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              {day}
            </div>
          ))}

          {days.map((day, i) => {
            const dateStr = toISODate(day)
            const dayCards = cardsByDate.get(dateStr) ?? []
            const isCurrentMonth = day.getMonth() === currentMonth
            const isToday = isSameDay(day, today)

            return (
              <div
                key={i}
                className={`min-h-[80px] bg-surface p-1.5 transition ${
                  isCurrentMonth ? '' : 'opacity-40'
                } ${isToday ? 'ring-2 ring-inset ring-brand' : ''}`}
              >
                <div className={`mb-1 text-right text-xs font-semibold ${
                  isToday ? 'text-brand' : 'text-ink-muted'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayCards.slice(0, 3).map((card) => {
                    const boardLabels = board.labels
                    const label = card.labelIds[0] ? boardLabels[card.labelIds[0]] : null
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => onOpenCard(card.id)}
                        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] font-medium transition hover:bg-brand-light active:scale-[0.98]"
                        style={label ? { borderLeft: `2px solid ${label.color}` } : undefined}
                      >
                        <span className="truncate text-ink">{card.title}</span>
                      </button>
                    )
                  })}
                  {dayCards.length > 3 && (
                    <span className="block px-1 text-[9px] font-medium text-ink-faint">
                      +{dayCards.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
