import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  Star,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  MoreHorizontal,
  Check,
  Zap,
  Lock,
  Globe,
  Users,
  UserPlus,
  Settings,
  Pencil,
  Palette,
  Copy,
  Download,
  Archive,
  Trash2,
} from 'lucide-react'
import type { Board } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { useAdaptiveTheme, adaptiveVars } from '../../hooks/useAdaptiveTheme'
import ViewsMenu from './ViewsMenu'
import FilterPanel from './FilterPanel'
import type { BoardFilter } from './FilterPanel'
import type { BoardViewType } from './BoardView'
import ShareModal from './ShareModal'
import VisibilityModal from './VisibilityModal'
import Avatar from '../shared/Avatar'

interface BoardTopBarProps {
  board: Board
  search: string
  onSearch: (value: string) => void
  viewsOpen: boolean
  filterOpen: boolean
  filter: BoardFilter
  activeView: BoardViewType
  onOpenViews: () => void
  onViewChange: (view: BoardViewType) => void
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
  activeView,
  onOpenViews,
  onViewChange,
  onOpenFilter,
  onFilterChange,
  onOpenMenu,
}: BoardTopBarProps) {
  const { renameBoard, toggleStar, members, deleteBoard, setBoardBackground } = useStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(board.name)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [visOpen, setVisOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const bg = board.background || '#FFFFFF'
  const theme = useAdaptiveTheme(bg.startsWith('data:') ? '#FFFFFF' : bg)
  const vars = adaptiveVars(theme)

  const currentUser = members.find((m) => m.name === 'You') ?? members[0]

  const visIcon = {
    private: Lock,
    workspace: Users,
    public: Globe,
  }[board.visibility]

  const commitRename = () => {
    setEditing(false)
    const trimmed = name.trim()
    if (trimmed && trimmed !== board.name) renameBoard(board.id, trimmed)
    else setName(board.name)
  }

  const filterActive = filter.labelIds.length > 0 || filter.memberIds.length > 0

  const closeAll = useCallback(() => {
    setQuickOpen(false)
    setMoreOpen(false)
  }, [])

  useEffect(() => {
    if (!quickOpen && !moreOpen) return
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (!(t as HTMLElement).closest('[data-toolbar-menu]')) closeAll()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [quickOpen, moreOpen, closeAll])

  const TB = ({
    children,
    title,
    active,
    onClick,
    className = '',
    accent,
  }: {
    children: React.ReactNode
    title: string
    active?: boolean
    onClick?: () => void
    className?: string
    accent?: boolean
  }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand active:scale-95 disabled:opacity-40 ${
        accent
          ? active
            ? 'text-warn'
            : 'text-ink-faint hover:text-warn hover:bg-surface-alt'
          : active
            ? 'bg-brand/15 text-brand'
            : 'text-ink-faint hover:text-ink hover:bg-surface-alt'
      } ${className}`}
      style={accent ? undefined : { color: active ? undefined : 'var(--surface-text-faint, inherit)' }}
    >
      {children}
    </button>
  )

  const moreItems = [
    { icon: Settings, label: 'Board settings', action: onOpenMenu },
    {
      icon: Pencil,
      label: 'Rename board',
      action: () => {
        setName(board.name)
        setEditing(true)
      },
    },
    {
      icon: Palette,
      label: 'Change background',
      action: () => {
        const colors = ['#0DABA3', '#4AA8FF', '#8B7CF6', '#FF8B5E', '#33B27A', '#132A29']
        const next = colors[Math.floor(Math.random() * colors.length)]
        setBoardBackground(board.id, next)
      },
    },
    { icon: Copy, label: 'Duplicate board', action: () => {} },
    { icon: Download, label: 'Export board', action: () => {} },
    { icon: Archive, label: 'Archive board', action: () => {} },
    {
      icon: Trash2,
      label: 'Delete board',
      action: () => {
        if (window.confirm('Delete this board? This cannot be undone.')) deleteBoard(board.id)
      },
      danger: true,
    },
  ]

  return (
    <div
      className="relative flex items-center border-b px-2 py-2 sm:px-4 sm:py-2.5"
      style={{
        ...vars,
        background: 'var(--surface-bg-subtle)',
        borderColor: theme.border,
        minHeight: 52,
      }}
    >
      <div className="flex flex-1 items-center gap-1 overflow-hidden sm:gap-1.5">
        {/* ── Back ── */}
        <Link
          to="/boards"
          title="Back to boards"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-surface-alt"
          style={{ color: 'var(--surface-text-muted)' }}
        >
          <ChevronLeft size={18} />
        </Link>

        {/* ── Avatar ── */}
        {currentUser && (
          <div className="relative shrink-0">
            <Avatar member={currentUser} size={34} />
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 sm:h-3 sm:w-3"
              style={{
                background: 'var(--color-success, #33B27A)',
                ringColor: 'var(--surface-bg-subtle, #FFFFFF)',
              }}
            />
          </div>
        )}

        {/* ── Board name ── */}
        {editing ? (
          <div className="ml-0.5 flex items-center gap-1 sm:ml-1">
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
              className="w-24 rounded-lg px-2 py-1 font-display text-sm font-bold outline-none neu-input sm:w-auto sm:text-base"
              style={{ color: 'var(--surface-text)', background: 'transparent' }}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={commitRename}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white hover:bg-brand-dark"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <h2
            onClick={() => {
              setName(board.name)
              setEditing(true)
            }}
            title="Click to rename"
            className="ml-0.5 cursor-text truncate rounded-lg px-1.5 py-1 font-display text-sm font-bold transition-colors duration-150 hover:bg-surface-alt sm:ml-1 sm:text-base"
            style={{ color: 'var(--surface-text)' }}
          >
            {board.name}
          </h2>
        )}

        {/* ── Spacer ── */}
        <div className="min-w-2 flex-1 sm:min-w-4" />

        {/* ── Quick actions ── */}
        <div className="relative hidden sm:block" data-toolbar-menu>
          <TB
            title="Quick actions"
            active={quickOpen}
            onClick={() => {
              setMoreOpen(false)
              setQuickOpen((o) => !o)
            }}
          >
            <Zap size={17} className={quickOpen ? 'fill-current' : ''} />
          </TB>
          {quickOpen && (
            <div className="glass-panel animate-in absolute right-0 top-12 z-30 w-52 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setQuickOpen(false)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition-colors duration-150 hover:bg-surface-alt"
              >
                <Zap size={15} className="text-brand" />
                Automations
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickOpen(false)
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink transition-colors duration-150 hover:bg-surface-alt"
              >
                <LayoutGrid size={15} className="text-brand" />
                Board templates
              </button>
            </div>
          )}
        </div>

        {/* ── Views ── */}
        <div className="relative hidden sm:block" data-toolbar-menu>
          <TB
            title="Views"
            active={viewsOpen}
            onClick={() => {
              setQuickOpen(false)
              setMoreOpen(false)
              onOpenViews()
            }}
          >
            <LayoutGrid size={17} />
          </TB>
          <ViewsMenu open={viewsOpen} onClose={onOpenViews} activeView={activeView} onViewChange={onViewChange} />
        </div>

        {/* ── Filter ── */}
        <div className="relative" data-toolbar-menu>
          <TB
            title="Filter board"
            active={filterOpen}
            onClick={() => {
              setQuickOpen(false)
              setMoreOpen(false)
              onOpenFilter()
            }}
          >
            <SlidersHorizontal size={17} />
          </TB>
          {filterActive && (
            <span
              className="absolute right-1 top-1 h-2 w-2 rounded-full"
              style={{ background: 'var(--color-brand, #0DABA3)' }}
            />
          )}
          <FilterPanel
            board={board}
            filter={filter}
            onChange={onFilterChange}
            open={filterOpen}
            onClose={onOpenFilter}
          />
        </div>

        {/* ── Star ── */}
        <TB
          title={board.starred ? 'Unstar board' : 'Star board'}
          active={board.starred}
          onClick={() => toggleStar(board.id)}
          accent
        >
          <Star size={17} className={board.starred ? 'fill-current' : ''} />
        </TB>

        {/* ── Visibility ── */}
        <div className="hidden sm:block" data-toolbar-menu>
          <TB
            title={`Board visibility: ${board.visibility}`}
            onClick={() => setVisOpen(true)}
          >
            {(() => {
              const Icon = visIcon
              return <Icon size={17} />
            })()}
          </TB>
        </div>

        {/* ── Mobile: Search + More only ── */}
        <TB
          title="Search board"
          active={searchOpen}
          onClick={() => setSearchOpen((o) => !o)}
          className="sm:hidden"
        >
          <Search size={17} />
        </TB>

        <TB
          title="More options"
          active={moreOpen}
          onClick={() => {
            setQuickOpen(false)
            setMoreOpen((o) => !o)
          }}
          className="sm:hidden"
        >
          <MoreHorizontal size={17} />
        </TB>

        {/* ── Desktop: Share + More ── */}
        <button
          type="button"
          title="Share board"
          onClick={() => setShareOpen(true)}
          className="ml-1 hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-surface-alt active:scale-95 sm:inline-flex"
          style={{
            background: 'var(--surface-bg-subtle, rgba(255,255,255,0.08))',
            color: 'var(--surface-text, #FFFFFF)',
            border: `1px solid ${theme.border}`,
          }}
        >
          <UserPlus size={15} />
          <span className="hidden md:inline">Share</span>
        </button>

        <div className="relative hidden sm:block" data-toolbar-menu>
          <TB
            title="More options"
            active={moreOpen}
            onClick={() => {
              setQuickOpen(false)
              setMoreOpen((o) => !o)
            }}
          >
            <MoreHorizontal size={17} />
          </TB>
          {moreOpen && (
            <div className="glass-panel animate-in absolute right-0 top-12 z-30 w-52 p-1.5">
              {moreItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.action()
                      setMoreOpen(false)
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                      item.danger
                        ? 'text-danger hover:bg-danger-light hover:text-danger'
                        : 'text-ink hover:bg-surface-alt'
                    }`}
                  >
                    <Icon size={15} className={item.danger ? 'text-danger' : 'text-ink-muted'} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile search bar ── */}
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

      {/* ── Modals ── */}
      {shareOpen && <ShareModal board={board} onClose={() => setShareOpen(false)} />}
      {visOpen && <VisibilityModal board={board} onClose={() => setVisOpen(false)} />}
    </div>
  )
}
