import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Star, Search, SlidersHorizontal, LayoutGrid, MoreHorizontal, Check } from 'lucide-react'
import type { Board } from '../../store/schema'
import { useStore } from '../../store/useStore'
import IconButton from '../shared/IconButton'
import ViewsMenu from './ViewsMenu'
import FilterPanel from './FilterPanel'
import type { BoardFilter } from './FilterPanel'

interface BoardTopBarProps {
  board: Board
  search: string
  onSearch: (value: string) => void
  viewsOpen: boolean
  filterOpen: boolean
  filter: BoardFilter
  onOpenViews: () => void
  onOpenFilter: () => void
  onFilterChange: (filter: BoardFilter) => void
  onOpenMenu: () => void
}

export default function BoardTopBar({
  board,
  search,
  onSearch,
  viewsOpen,
  filterOpen,
  filter,
  onOpenViews,
  onOpenFilter,
  onFilterChange,
  onOpenMenu,
}: BoardTopBarProps) {
  const { renameBoard, toggleStar } = useStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(board.name)

  const commitRename = () => {
    setEditing(false)
    const trimmed = name.trim()
    if (trimmed && trimmed !== board.name) renameBoard(board.id, trimmed)
    else setName(board.name)
  }

  const filterActive = filter.labelIds.length > 0 || filter.memberIds.length > 0

  return (
    <div className="flex items-center gap-2 border-b border-border/60 bg-surface/70 backdrop-blur-xl px-4 py-3">
      <Link
        to="/boards"
        title="Back to boards"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-brand-light hover:text-brand-dark"
      >
        <ChevronLeft size={20} />
      </Link>

      {editing ? (
        <div className="flex items-center gap-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setName(board.name)
                setEditing(false)
              }
            }}
            onBlur={commitRename}
            autoFocus
            className="rounded-lg px-2 py-1 font-display text-xl font-bold text-ink outline-none ring-1 ring-border focus:ring-2 focus:ring-brand"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={commitRename}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-dark"
          >
            <Check size={15} />
          </button>
        </div>
      ) : (
        <h2
          onClick={() => {
            setName(board.name)
            setEditing(true)
          }}
          title="Click to rename"
          className="cursor-text rounded-lg px-2 py-1 font-display text-xl font-bold text-ink transition hover:bg-surface-alt"
        >
          {board.name}
        </h2>
      )}

      <button
        type="button"
        onClick={() => toggleStar(board.id)}
        title={board.starred ? 'Unstar board' : 'Star board'}
        className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-surface-alt active:scale-95"
      >
        <Star size={18} className={board.starred ? 'fill-warn text-warn' : 'text-ink-faint'} />
      </button>

      <div className="relative ml-2 flex items-center rounded-lg bg-bg px-2.5 ring-1 ring-border transition focus-within:ring-2 focus-within:ring-brand">
        <Search size={14} className="text-ink-faint" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search this board"
          className="w-40 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      <div className="relative ml-auto flex items-center gap-1">
        <span className="relative">
          <IconButton title="Views" active={viewsOpen} onClick={onOpenViews}>
            <LayoutGrid size={17} />
          </IconButton>
          <ViewsMenu open={viewsOpen} onClose={onOpenViews} />
        </span>

        <span className="relative">
          <IconButton title="Filter" active={filterOpen} onClick={onOpenFilter}>
            <SlidersHorizontal size={17} />
          </IconButton>
          {filterActive && (
            <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" />
          )}
          <FilterPanel
            board={board}
            filter={filter}
            onChange={onFilterChange}
            open={filterOpen}
            onClose={onOpenFilter}
          />
        </span>

        <IconButton title="Menu" onClick={onOpenMenu}>
          <MoreHorizontal size={17} />
        </IconButton>
      </div>
    </div>
  )
}
