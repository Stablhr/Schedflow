import { Link } from 'react-router-dom'
import { AlarmClock } from 'lucide-react'
import { useStore } from '../../store/useStore'
import DueBadge from '../shared/DueBadge'

export default function DueSoonList({ limit = 8 }: { limit?: number }) {
  const { data } = useStore()

  const cards = Object.values(data.cards)
    .filter((c) => !c.archived && !c.done && c.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, limit)

  return (
    <div className="rounded-xl glass-subtle p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-1.5">
        <AlarmClock size={14} className="text-accent" />
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Due soon
        </h2>
      </div>

      <ul className="mt-3 space-y-1">
        {cards.map((card) => {
          const board = data.boards[card.boardId]
          return (
            <li key={card.id}>
              <Link
                to={`/boards/${card.boardId}`}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-surface-alt hover-slide-right"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  {card.title}
                </span>
                <span className="hidden max-w-32 truncate text-[11px] text-ink-faint sm:block">
                  {board?.name}
                </span>
                <DueBadge due={card.dueDate!} />
              </Link>
            </li>
          )
        })}
        {cards.length === 0 && (
          <li className="rounded-lg px-2 py-3 text-center text-xs text-ink-faint">
            Nothing due soon.
          </li>
        )}
      </ul>
    </div>
  )
}
