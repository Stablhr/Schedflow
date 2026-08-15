import { isDueThisWeek } from '../../utils/dates'
import { useStore } from '../../store/useStore'
import CaptureBox from '../shared/CaptureBox'
import DueSoonList from './DueSoonList'
import RecentBoardsList from './RecentBoardsList'
import PlannerPreview from './PlannerPreview'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface p-4 shadow-sm ring-1 ring-border/50">
      <p className="font-display text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
    </div>
  )
}

export default function DashboardView() {
  const { data } = useStore()

  const boardCount = Object.keys(data.boards).length
  const dueThisWeek = Object.values(data.cards).filter(
    (c) => !c.done && c.dueDate && isDueThisWeek(c.dueDate),
  ).length
  const inboxCount = data.inbox.length
  const starredCount = Object.values(data.boards).filter((b) => b.starred).length

  return (
    <div className="scroll-slim h-full overflow-y-auto p-8">
      <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome back — here's what needs attention.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Boards" value={boardCount} />
        <StatCard label="Due this week" value={dueThisWeek} />
        <StatCard label="Inbox unread" value={inboxCount} />
        <StatCard label="Starred boards" value={starredCount} />
      </div>

      <div className="mt-6 max-w-md">
        <CaptureBox variant="dash" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <DueSoonList />
          <RecentBoardsList />
        </div>
        <div className="h-max">
          <PlannerPreview />
        </div>
      </div>
    </div>
  )
}
