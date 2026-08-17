import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Inbox, Columns3, CalendarDays, PanelLeftClose, PanelLeft } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAdaptiveTheme, adaptiveVars } from '../../hooks/useAdaptiveTheme'
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

  const theme = useAdaptiveTheme(isBoard ? bg : '#E1F5F3')
  const sidebarVars = adaptiveVars(theme)

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
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={() =>
                  collapsed
                    ? `relative flex h-9 w-9 mx-auto items-center justify-center rounded-xl transition`
                    : `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition`
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

        {!collapsed && (
          <div className="space-y-3 p-3">
            <CaptureBox />
            {you && (
              <div className="flex items-center gap-2 rounded-xl px-2.5 py-2" style={{ background: 'var(--surface-bg-subtle)' }}>
                <Avatar member={you} size={22} />
                <span className="text-sm font-semibold" style={{ color: 'var(--surface-text)' }}>{you.name}</span>
              </div>
            )}
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
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition"
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
