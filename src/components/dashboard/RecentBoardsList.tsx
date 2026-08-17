import { Link } from 'react-router-dom'
import { Star, Clock3 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { shade } from '../../utils/color'

export default function RecentBoardsList({ limit = 4 }: { limit?: number }) {
  const { data } = useStore()

  const boards = Object.values(data.boards)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)

  return (
    <div className="rounded-xl glass-subtle p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-1.5">
        <Clock3 size={14} className="text-brand" />
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
          Recently active
        </h2>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className="relative flex h-14 items-end overflow-hidden rounded-lg p-2.5 shadow-sm ring-1 ring-black/5 transition hover:shadow-md sm:h-16"
            style={{
              background: `linear-gradient(135deg, ${board.background}, ${shade(board.background, -22)})`,
            }}
          >
            {board.starred && (
              <Star size={12} className="absolute right-2 top-2 fill-warn text-warn" />
            )}
            <span className="truncate font-display text-xs font-semibold text-white">
              {board.name}
            </span>
          </Link>
        ))}
        {boards.length === 0 && (
          <p className="col-span-2 rounded-lg px-2 py-3 text-center text-xs text-ink-faint">
            No boards yet.
          </p>
        )}
      </div>
    </div>
  )
}
