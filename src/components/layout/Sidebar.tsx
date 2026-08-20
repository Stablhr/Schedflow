import { useState, useEffect, useRef } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Inbox, Columns3, CalendarDays, PanelLeftClose, PanelLeft, Sun, Moon, Star, ChevronRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAdaptiveTheme, adaptiveVars } from '../../hooks/useAdaptiveTheme'
import { useThemeMode } from '../../hooks/useThemeMode'
import { blendTwoStop } from '../../utils/color'
import CaptureBox from '../shared/CaptureBox'
import Avatar from '../shared/Avatar'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/boards', label: 'Boards', icon: Columns3 },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ background: blendTwoStop('#0DABA3', '#0A8981') }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 7h16" opacity="0.55" />
          <path d="M4 12h16" />
          <path d="M4 17h9" opacity="0.85" />
        </svg>
      </span>
      {!collapsed && (
        <span className="font-display text-[19px] font-bold tracking-tight" style={{ color: 'var(--surface-text)' }}>SchedFlow</span>
      )}
    </div>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

function BoardDropdown({
  recentBoards,
  boardId,
  onClose,
  className = '',
}: {
  recentBoards: { id: string; name: string; background: string; starred: boolean }[]
  boardId: string | undefined
  onClose: () => void
  className?: string
}) {
  return (
    <div
      className={`glass-panel animate-in pointer-events-auto w-64 p-1.5 ${className}`}
      role="menu"
    >
      {recentBoards.length === 0 ? (
        <p className="px-3 py-4 text-center text-xs text-ink-faint">
          No boards yet
        </p>
      ) : (
        <>
          {recentBoards.map((b) => {
            const isCurrent = b.id === boardId
            return (
              <Link
                key={b.id}
                to={`/boards/${b.id}`}
                onClick={onClose}
                role="menuitem"
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${
                  isCurrent
                    ? 'bg-brand/10 font-semibold text-brand'
                    : 'text-ink hover:bg-surface-alt'
                }`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm"
                  style={{ background: b.background || '#0DABA3' }}
                />
                <span className="min-w-0 flex-1 truncate">{b.name}</span>
                {b.starred && (
                  <Star size={12} className="shrink-0 fill-warn text-warn" />
                )}
              </Link>
            )
          })}
          <div className="my-1 border-t border-border" />
          <Link
            to="/boards"
            onClick={onClose}
            role="menuitem"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors duration-150 hover:bg-surface-alt hover:text-ink"
          >
            View all boards
            <ChevronRight size={14} />
          </Link>
        </>
      )}
    </div>
  )
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data, members, setDarkMode } = useStore()
  const location = useLocation()
  const inboxCount = data.inbox.length
  const you = members.find((m) => m.name === 'You') ?? members[0]

  const boardMatch = location.pathname.match(/^\/boards\/([^/]+)$/)
  const boardId = boardMatch?.[1]
  const board = boardId ? data.boards[boardId] : null
  const bg = board?.background || ''
  const isBoard = !!(board && bg && !bg.startsWith('data:'))

  const resolved = useThemeMode()
  const mode = data.ui.darkMode ?? 'light'
  const theme = useAdaptiveTheme(isBoard ? bg : (resolved === 'dark' ? '#1A2B2A' : '#E1F5F3'))
  const sidebarVars = adaptiveVars(theme)

  const [boardsOpen, setBoardsOpen] = useState(false)
  const boardsRef = useRef<HTMLDivElement>(null)

  const recentBoards = Object.values(data.boards)
    .sort((a, b) => Number(b.starred) - Number(a.starred) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 8)

  useEffect(() => {
    if (!boardsOpen) return
    const handler = (e: MouseEvent) => {
      if (boardsRef.current && !boardsRef.current.contains(e.target as Node)) {
        setBoardsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [boardsOpen])

  useEffect(() => {
    if (!boardsOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBoardsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [boardsOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r backdrop-blur-2xl transition-[width] duration-200 md:flex ${
          isBoard ? '' : 'bg-surface-alt/60'
        } ${collapsed ? 'w-[52px]' : 'w-[236px]'}`}
        style={{ ...sidebarVars, background: isBoard ? bg : undefined, borderColor: theme.border }}
      >
        <div className="flex items-center px-2 py-2">
          {!collapsed && <Logo collapsed={collapsed} />}
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex h-8 shrink-0 items-center justify-center rounded-lg transition active:scale-95 ${
              collapsed ? 'mx-auto mt-3 w-8' : 'ml-auto'
            }`}
            style={{ color: 'var(--surface-text-muted)' }}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        <nav className={`mt-2 flex-1 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV.map((item) => {
            const Icon = item.icon
            const isBoards = item.to === '/boards'

            if (isBoards) {
              return (
                <div
                  key={item.to}
                  ref={boardsRef}
                  className="relative overflow-visible"
                  onMouseEnter={() => setBoardsOpen(true)}
                  onMouseLeave={() => setBoardsOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setBoardsOpen((o) => !o)}
                    className={
                      collapsed
                        ? `neu-compact relative flex h-9 w-9 mx-auto items-center justify-center rounded-[10px] transition hover-grow focus-visible:outline-2 focus-visible:outline-brand cursor-pointer ${
                            boardsOpen ? 'neu-compact-pressed' : ''
                          }`
                        : `neu-surface group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition hover-slide-right focus-visible:outline-2 focus-visible:outline-brand cursor-pointer ${
                            boardsOpen ? 'neu-compact-pressed' : ''
                          }`
                    }
                    style={{
                      color: boardsOpen ? 'var(--surface-text)' : 'var(--surface-text-muted)',
                      background: boardsOpen ? 'var(--surface-bg-subtle)' : undefined,
                    }}
                  >
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronRight
                          size={14}
                          className={`shrink-0 transition-transform duration-150 ${
                            boardsOpen ? 'rotate-90' : ''
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {boardsOpen && (
                    <BoardDropdown
                      recentBoards={recentBoards}
                      boardId={boardId}
                      onClose={() => setBoardsOpen(false)}
                      className="absolute left-full top-0 z-[60] ml-1 max-h-[70vh] overflow-y-auto scroll-slim"
                    />
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={() =>
                  collapsed
                    ? 'neu-compact relative flex h-9 w-9 mx-auto items-center justify-center rounded-[10px] transition hover-grow focus-visible:outline-2 focus-visible:outline-brand'
                    : 'neu-surface group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition hover-slide-right focus-visible:outline-2 focus-visible:outline-brand'
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--surface-text)' : 'var(--surface-text-muted)',
                  background: isActive ? 'var(--surface-bg-subtle)' : undefined,
                })}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {item.to === '/inbox' && inboxCount > 0 && (
                  <span
                    className="rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10px] font-medium text-white"
                  >
                    {inboxCount}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {collapsed ? (
          <div className="flex flex-col items-center gap-1 px-2 pb-2">
            <div className="flex flex-col rounded-xl bg-surface-alt/60 p-1">
              {([
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDarkMode(value)}
                  title={label}
                  className={`neu-compact flex h-8 w-8 items-center justify-center rounded-[10px] transition active:scale-95 focus-visible:outline-2 focus-visible:outline-brand ${
                    mode === value
                      ? 'neu-compact-pressed bg-brand text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-surface'
                  }`}
                >
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3">
            <CaptureBox />
            {you && (
              <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: 'var(--surface-bg-subtle)' }}>
                <Avatar member={you} size={22} />
                <span className="text-sm font-semibold" style={{ color: 'var(--surface-text)' }}>{you.name}</span>
              </div>
            )}
            <div className="grid grid-cols-2 rounded-xl bg-surface-alt/60 p-0.5">
              {([
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDarkMode(value)}
                  title={label}
                  className={`neu-compact flex flex-col items-center gap-0.5 rounded-[10px] py-1.5 text-[10px] font-semibold transition active:scale-95 focus-visible:outline-2 focus-visible:outline-brand ${
                    mode === value
                      ? 'neu-compact-pressed bg-brand text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-surface'
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 py-1.5 backdrop-blur-2xl md:hidden"
        style={{ ...sidebarVars, background: isBoard ? bg : undefined, borderColor: theme.border }}
      >
        {NAV.map((item) => {
          const Icon = item.icon
          const isBoards = item.to === '/boards'

          if (isBoards) {
            return (
              <div key={item.to} ref={boardsRef} className="relative">
                <button
                  type="button"
                  onClick={() => setBoardsOpen((o) => !o)}
                  className="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition hover:bg-brand-light/40 hover:scale-105 cursor-pointer"
                  style={{
                    color: boardsOpen ? 'var(--surface-text)' : 'var(--surface-text-muted)',
                    background: boardsOpen ? 'var(--surface-bg-subtle)' : undefined,
                  }}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>

                {boardsOpen && (
                  <BoardDropdown
                    recentBoards={recentBoards}
                    boardId={boardId}
                    onClose={() => setBoardsOpen(false)}
                    className="absolute bottom-[calc(100%+4px)] left-1/2 z-[60] -translate-x-1/2 max-h-[60vh] overflow-y-auto scroll-slim"
                  />
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition hover:bg-brand-light/40 hover:scale-105"
              style={({ isActive }) => ({
                color: isActive ? 'var(--surface-text)' : 'var(--surface-text-muted)',
                background: isActive ? 'var(--surface-bg-subtle)' : undefined,
              })}
            >
              <Icon size={20} />
              <span className="text-[10px] font-semibold">{item.label}</span>
              {item.to === '/inbox' && inboxCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-brand px-1 py-0.5 font-mono text-[8px] font-medium text-white">
                  {inboxCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
