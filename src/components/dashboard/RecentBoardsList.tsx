import { Link } from 'react-router-dom'
import { Star, Clock3 } from 'lucide-react'
import { useStore } from '../../store/useStore'

function boardBgStyle(bg: string): React.CSSProperties {
  if (!bg) return {}
  if (bg.startsWith('data:')) return { background: `url(${bg}) center/cover no-repeat` }
  if (bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient')) return { background: bg }
  return { background: bg }
}

export default function RecentBoardsList({ limit = 4 }: { limit?: number }) {
  const { data } = useStore()

  const boards = Object.values(data.boards)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, limit)

  return (
    <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-1.5">
        <Clock3 size={14} className="text-primary-hover" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
          Recently active
        </h2>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {boards.map((board) => (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className="relative flex h-14 items-end overflow-hidden rounded-lg p-2.5 transition-transform duration-150 hover:-translate-y-0.5 sm:h-16"
            style={boardBgStyle(board.background)}
          >
            {board.starred && (
              <Star size={12} className="absolute right-2 top-2 fill-warning text-warning drop-shadow" />
            )}
            <span
              className="truncate text-xs font-semibold text-white"
              style={{ textShadow: '0 1px 3px rgb(0 0 0 / 0.45)' }}
            >
              {board.name}
            </span>
          </Link>
        ))}
        {boards.length === 0 && (
          <p className="col-span-2 rounded-md px-2 py-3 text-center text-xs font-medium text-text-secondary">
            No boards yet.
          </p>
        )}
      </div>
    </div>
  )
}
