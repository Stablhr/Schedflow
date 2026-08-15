import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Inbox, Columns3, CalendarDays } from 'lucide-react'
import { useStore } from '../../store/useStore'
import CaptureBox from '../shared/CaptureBox'
import Avatar from '../shared/Avatar'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/boards', label: 'Boards', icon: Columns3 },
  { to: '/planner', label: 'Planner', icon: CalendarDays },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 7h16" opacity="0.55" />
          <path d="M4 12h16" />
          <path d="M4 17h9" opacity="0.85" />
        </svg>
      </span>
      <span className="font-display text-[19px] font-bold tracking-tight text-ink">SchedFlow</span>
    </div>
  )
}

export default function Sidebar() {
  const { data, members } = useStore()
  const inboxCount = data.inbox.length
  const you = members.find((m) => m.name === 'You') ?? members[0]

  return (
    <aside className="flex w-[236px] shrink-0 flex-col border-r border-border bg-surface-alt">
      <Logo />

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-surface text-brand-dark shadow-sm'
                    : 'text-ink-muted hover:bg-brand/10 hover:text-ink'
                }`
              }
            >
              <Icon size={17} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.to === '/inbox' && inboxCount > 0 && (
                <span className="rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-white">
                  {inboxCount}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-3 p-3">
        <CaptureBox />
        {you && (
          <div className="flex items-center gap-2 rounded-xl bg-surface/60 px-2.5 py-2">
            <Avatar member={you} size={22} />
            <span className="text-sm font-semibold text-ink">{you.name}</span>
          </div>
        )}
      </div>
    </aside>
  )
}
