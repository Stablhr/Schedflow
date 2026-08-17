import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { blendGradient } from '../../utils/color'
import CreateBoardModal from './CreateBoardModal'

export default function BoardsHome() {
  const { data, toggleStar } = useStore()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const boards = Object.values(data.boards).sort(
    (a, b) =>
      Number(b.starred) - Number(a.starred) || b.updatedAt.localeCompare(a.updatedAt),
  )

  return (
    <div className="scroll-slim h-full overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">Boards</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95 sm:px-3.5 sm:py-2"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Create board</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="mt-10 rounded-2xl border-2 border-dashed border-border p-8 text-center sm:p-12">
          <p className="text-sm font-medium text-ink-muted">
            No boards yet — create one from a template to get started.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              className="group relative h-24 cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 ring-black/5 transition hover:shadow-md sm:h-28"
              style={{
                background: blendGradient(board.background),
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStar(board.id)
                }}
                title={board.starred ? 'Unstar' : 'Star'}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/20 opacity-0 transition hover:bg-black/30 group-hover:opacity-100"
              >
                <Star
                  size={15}
                  className={board.starred ? 'fill-warn text-warn' : 'text-white'}
                />
              </button>
              <span className="absolute bottom-3 left-3 right-3 truncate font-display text-sm font-semibold text-white">
                {board.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <CreateBoardModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
