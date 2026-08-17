import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Inbox, Columns3, CalendarDays, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { isColorDark, withAlpha } from '../../utils/colorUtils'
import CaptureBox from '../shared/CaptureBox'
import Avatar from '../shared/Avatar'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/boards', label: 'Boards', icon: Columns3 },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
]

function Logo({ collapsed, dark }: { collapsed: boolean; dark: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 7h16" opacity="0.55" />
          <path d="M4 12h16" />
          <path d="M4 17h9" opacity="0.85" />
        </svg>
      </span>
      {!collapsed && (
        <span className={`font-display text-[19px] font-bold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>SchedFlow</span>
      )}
    </div>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data, members } = useStore()
  const location = useLocation()
  const inboxCount = data.inbox.length
  const you = members.find((m) => m.name === 'You') ?? members[0]

  const boardMatch = location.pathname.match(/^\/boards\/([^/]+)$/)
  const boardId = boardMatch?.[1]
  const board = boardId ? data.boards[boardId] : null
  const bg = board?.background || ''
  const isBoard = !!(board && bg && !bg.startsWith('data:'))
  const dark = isBoard && isColorDark(bg)

  const sidebarBg = isBoard
    ? withAlpha(bg, 0.08)
    : ''

  return (
    <aside
      className={`flex shrink-0 flex-col border-r transition-[width] duration-200 ${
        isBoard ? '' : 'bg-surface-alt'
      } ${dark ? 'border-white/10' : 'border-border'} ${collapsed ? 'w-[52px]' : 'w-[236px]'}`}
      style={isBoard ? { background: sidebarBg } : undefined}
    >
      <div className="flex items-center px-2 py-2">
        {!collapsed && <Logo collapsed={collapsed} dark={dark} />}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex h-8 shrink-0 items-center justify-center rounded-lg transition active:scale-95 ${
            dark
              ? 'text-white/50 hover:bg-white/10 hover:text-white'
              : 'text-ink-muted hover:bg-surface hover:text-ink'
          } ${collapsed ? 'mx-auto mt-3 w-8' : 'ml-auto'}`}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav className={`mt-2 flex-1 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                collapsed
                  ? `relative flex h-9 w-9 mx-auto items-center justify-center rounded-xl transition ${
                      isActive
                        ? dark
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'bg-surface text-brand-dark shadow-sm'
                        : dark
                          ? 'text-white/50 hover:bg-white/10 hover:text-white'
                          : 'text-ink-muted hover:bg-brand/10 hover:text-ink'
                    }`
                  : `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isActive
                        ? dark
                          ? 'bg-white/10 text-white shadow-sm'
                          : 'bg-surface text-brand-dark shadow-sm'
                        : dark
                          ? 'text-white/50 hover:bg-white/10 hover:text-white'
                          : 'text-ink-muted hover:bg-brand/10 hover:text-ink'
                    }`
              }
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.to === '/inbox' && inboxCount > 0 && (
                <span
                  className={`font-mono text-[10px] font-medium text-white ${
                    collapsed
                      ? 'absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1'
                      : 'rounded-full bg-brand px-1.5 py-0.5 text-[10.5px]'
                  }`}
                >
                  {inboxCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="space-y-3 p-3">
          <CaptureBox />
          {you && (
            <div className={`flex items-center gap-2 rounded-xl px-2.5 py-2 ${
              dark ? 'bg-white/5' : 'bg-surface/60'
            }`}>
              <Avatar member={you} size={22} />
              <span className={`text-sm font-semibold ${dark ? 'text-white' : 'text-ink'}`}>{you.name}</span>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
