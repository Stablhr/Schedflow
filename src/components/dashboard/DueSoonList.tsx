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
    <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-1.5">
        <AlarmClock size={14} className="text-warning-text" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
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
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-surface-alt"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                  {card.title}
                </span>
                <span className="hidden max-w-32 truncate text-[11px] font-medium text-text-muted sm:block">
                  {board?.name}
                </span>
                <DueBadge due={card.dueDate!} />
              </Link>
            </li>
          )
        })}
        {cards.length === 0 && (
          <li className="rounded-md px-2 py-3 text-center text-xs font-medium text-text-secondary">
            Nothing due soon.
          </li>
        )}
      </ul>
    </div>
  )
}
