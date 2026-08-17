import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Star, Search, SlidersHorizontal, LayoutGrid, MoreHorizontal, Check } from 'lucide-react'
import type { Board } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { useAdaptiveTheme, adaptiveVars } from '../../hooks/useAdaptiveTheme'
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
  const [searchOpen, setSearchOpen] = useState(false)

  const bg = board.background || '#FFFFFF'
  const theme = useAdaptiveTheme(bg.startsWith('data:') ? '#FFFFFF' : bg)
  const vars = adaptiveVars(theme)

  const commitRename = () => {
    setEditing(false)
    const trimmed = name.trim()
    if (trimmed && trimmed !== board.name) renameBoard(board.id, trimmed)
    else setName(board.name)
  }

  const filterActive = filter.labelIds.length > 0 || filter.memberIds.length > 0

  return (
    <div
      className="flex items-center gap-1.5 border-b backdrop-blur-2xl px-2 py-2 sm:gap-2 sm:px-4 sm:py-3"
      style={{ ...vars, background: 'var(--surface-bg-subtle)', borderColor: theme.border }}
    >
      <Link
        to="/boards"
        title="Back to boards"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-brand-light hover:text-brand-dark"
        style={{ color: 'var(--surface-text-muted)' }}
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
            className="w-28 rounded-lg px-2 py-1 font-display text-lg font-bold outline-none ring-1 ring-border focus:ring-2 focus:ring-brand sm:w-auto sm:text-xl"
            style={{ color: 'var(--surface-text)', background: 'transparent' }}
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
          className="cursor-text truncate rounded-lg px-1.5 py-1 font-display text-base font-bold transition hover:bg-surface-alt sm:px-2 sm:text-xl"
          style={{ color: 'var(--surface-text)' }}
        >
          {board.name}
        </h2>
      )}

      <button
        type="button"
        onClick={() => toggleStar(board.id)}
        title={board.starred ? 'Unstar board' : 'Star board'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-surface-alt active:scale-95"
        style={{ color: 'var(--surface-text-faint)' }}
      >
        <Star size={18} className={board.starred ? 'fill-warn text-warn' : ''} />
      </button>

      {/* Desktop search */}
      <div
        className="relative ml-2 hidden items-center rounded-lg px-2.5 ring-1 transition focus-within:ring-2 focus-within:ring-brand sm:flex"
        style={{ background: 'var(--surface-bg-subtle)', color: 'var(--surface-text-faint)', borderColor: theme.border }}
      >
        <Search size={14} />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search this board"
          className="w-40 bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink-faint"
          style={{ color: 'var(--surface-text)' }}
        />
      </div>

      {/* Mobile search toggle */}
      <button
        type="button"
        onClick={() => setSearchOpen((o) => !o)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-surface-alt sm:hidden"
        style={{ color: 'var(--surface-text-muted)' }}
      >
        <Search size={16} />
      </button>

      <div className="relative ml-auto flex items-center gap-0.5 sm:gap-1">
        <span className="relative">
          <IconButton title="Views" active={viewsOpen} onClick={onOpenViews} style={{ color: 'var(--surface-text-muted)' }}>
            <LayoutGrid size={17} />
          </IconButton>
          <ViewsMenu open={viewsOpen} onClose={onOpenViews} />
        </span>

        <span className="relative">
          <IconButton title="Filter" active={filterOpen} onClick={onOpenFilter} style={{ color: 'var(--surface-text-muted)' }}>
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

        <IconButton title="Menu" onClick={onOpenMenu} style={{ color: 'var(--surface-text-muted)' }}>
          <MoreHorizontal size={17} />
        </IconButton>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div
          className="absolute left-0 right-0 top-full z-30 flex items-center gap-2 border-b px-3 py-2 backdrop-blur-2xl sm:hidden"
          style={{ ...vars, background: 'var(--surface-bg-subtle)', borderColor: theme.border }}
        >
          <Search size={14} style={{ color: 'var(--surface-text-faint)' }} />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search this board"
            autoFocus
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
            style={{ color: 'var(--surface-text)' }}
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false)
              onSearch('')
            }}
            className="text-xs font-semibold"
            style={{ color: 'var(--surface-text-muted)' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
