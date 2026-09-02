import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Inbox, Columns3, CalendarDays, Share2, PanelLeftClose, PanelLeft, Sun, Moon, Monitor } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useAdaptiveTheme, adaptiveVars } from '../../hooks/useAdaptiveTheme'
import { useThemeMode } from '../../hooks/useThemeMode'
import CaptureBox from '../shared/CaptureBox'
import Avatar from '../shared/Avatar'
import StorageMeter from '../shared/StorageMeter'
import type { ThemeMode } from '../../store/schema'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/boards', label: 'Boards', icon: Columns3 },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
  { to: '/social', label: 'Social', icon: Share2 },
]

const THEME_OPTIONS: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-4">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 7h16" opacity="0.55" />
          <path d="M4 12h16" />
          <path d="M4 17h9" opacity="0.85" />
        </svg>
      </span>
      {!collapsed && (
        <span className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--surface-text)' }}>SchedFlow</span>
      )}
    </div>
  )
}

function ThemeToggle({ collapsed, mode, setDarkMode }: { collapsed: boolean; mode: ThemeMode; setDarkMode: (m: ThemeMode) => void }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 px-2">
        <div className="flex flex-col rounded-lg p-1" style={{ background: 'var(--surface-bg-subtle)' }}>
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setDarkMode(value)}
              title={label}
              aria-pressed={mode === value}
              className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98] ${
                mode === value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
              }`}
              style={{ color: mode === value ? undefined : 'var(--surface-text-muted)' }}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 rounded-lg p-0.5" style={{ background: 'var(--surface-bg-subtle)' }}>
      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => setDarkMode(value)}
          title={label}
          aria-pressed={mode === value}
          className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] font-medium transition-colors duration-150 outline-none focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98] ${
            mode === value
              ? 'bg-primary text-primary-foreground font-semibold'
              : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
          }`}
          style={{ color: mode === value ? undefined : 'var(--surface-text-muted)' }}
        >
          <Icon size={14} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data, members, setDarkMode } = useStore()
  const inboxCount = data.inbox.length
  const you = members.find((m) => m.name === 'You') ?? members[0]
  const mode = data.ui.darkMode ?? 'system'

  const resolved = useThemeMode()
  const theme = useAdaptiveTheme(resolved === 'dark' ? '#1A2B2A' : '#EDF2F2')
  const sidebarVars = adaptiveVars(theme)

  const boards = Object.values(data.boards)
    .sort((a, b) => Number(b.starred) - Number(a.starred) || b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  const themeBg = 'var(--surface-bg-subtle)'

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r transition-[width] duration-200 md:flex bg-surface-alt ${
          collapsed ? 'w-[52px]' : 'w-[236px]'
        }`}
        style={{ ...sidebarVars, borderColor: theme.border }}
      >
        {/* Logo + toggle */}
        <div className="flex items-center px-2 py-2">
          {!collapsed && <Logo collapsed={collapsed} />}
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex h-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] active:scale-[0.98] ${
              collapsed ? 'mx-auto mt-3 w-8' : 'ml-auto'
            }`}
            style={{ color: 'var(--surface-text-muted)' }}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`mt-1 flex-1 space-y-0.5 ${collapsed ? 'px-2' : 'px-3'}`}>
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
                    ? `relative mx-auto flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
                        isActive
                          ? 'bg-primary-subtle text-primary-hover'
                          : 'text-text-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-text-primary'
                      }`
                    : `relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-primary ${
                        isActive
                          ? 'bg-primary-subtle font-semibold text-primary-hover'
                          : 'font-medium text-text-secondary hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-text-primary'
                      }`
                }
                style={({ isActive }) => {
                  if (!collapsed || !isActive) return undefined
                  return {}
                }}
              >
                {({ isActive }) => (
                  <>
                    {/* Left accent bar */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-primary" />
                    )}
                    {isActive && collapsed && (
                      <span className="absolute left-1 top-1 bottom-1 w-[3px] rounded-full bg-primary" />
                    )}
                    <Icon size={16} className="shrink-0" />
                    {!collapsed && <span className="flex-1">{item.label}</span>}
                    {item.to === '/inbox' && inboxCount > 0 && (
                      <span className="rounded-full bg-primary px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary-foreground">
                        {inboxCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}

          {/* Boards quick-access */}
          {!collapsed && boards.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                Your Boards
              </p>
              <div className="space-y-0.5">
                {boards.map((board) => {
                  const isBgUrl = board.background?.startsWith('data:') || board.background?.startsWith('http')
                  return (
                    <NavLink
                      key={board.id}
                      to={`/boards/${board.id}`}
                      className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-text-primary"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10"
                        style={
                          isBgUrl
                            ? { background: `url(${board.background}) center/cover no-repeat` }
                            : { background: board.background || 'var(--color-surface-alt)' }
                        }
                      />
                      <span className="truncate">{board.name}</span>
                      {board.starred && (
                        <span className="ml-auto text-[10px] text-warning">&#9733;</span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer: CaptureBox → User → Theme → Storage */}
        {collapsed ? (
          <div className="flex flex-col items-center gap-2 border-t px-2 py-3" style={{ borderColor: theme.border }}>
            <ThemeToggle collapsed={collapsed} mode={mode} setDarkMode={setDarkMode} />
            <StorageMeter collapsed />
          </div>
        ) : (
          <div className="border-t p-3 space-y-2.5" style={{ borderColor: theme.border }}>
            <CaptureBox />
            {you && (
              <div className="flex items-center gap-2 rounded-md px-2.5 py-2" style={{ background: themeBg }}>
                <Avatar member={you} size={22} />
                <span className="text-[13px] font-semibold" style={{ color: 'var(--surface-text)' }}>{you.name}</span>
              </div>
            )}
            <ThemeToggle collapsed={collapsed} mode={mode} setDarkMode={setDarkMode} />
            <StorageMeter />
          </div>
        )}
      </aside>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t px-2 py-1.5 md:hidden bg-surface-alt"
        style={{ ...sidebarVars, borderColor: theme.border }}
      >
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="relative flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 transition-colors duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              style={({ isActive }) => ({
                color: isActive ? 'var(--surface-text)' : 'var(--surface-text-muted)',
                background: isActive ? 'var(--surface-bg-subtle)' : undefined,
              })}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.to === '/inbox' && inboxCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-primary px-1 py-0.5 font-mono text-[8px] font-medium text-primary-foreground">
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