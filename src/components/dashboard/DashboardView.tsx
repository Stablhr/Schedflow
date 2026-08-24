import { isDueThisWeek } from '../../utils/dates'
import { useStore } from '../../store/useStore'
import CaptureBox from '../shared/CaptureBox'
import DueSoonList from './DueSoonList'
import RecentBoardsList from './RecentBoardsList'
import PlannerPreview from './PlannerPreview'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <p className="text-2xl font-semibold text-text-primary sm:text-3xl">{value}</p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">{label}</p>
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
    <div className="scroll-slim h-full overflow-y-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-text-secondary">Welcome back — here's what needs attention.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-4">
        <StatCard label="Boards" value={boardCount} />
        <StatCard label="Due this week" value={dueThisWeek} />
        <StatCard label="Inbox unread" value={inboxCount} />
        <StatCard label="Starred boards" value={starredCount} />
      </div>

      <div className="mt-4 max-w-md sm:mt-6">
        <CaptureBox variant="dash" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:mt-8 lg:grid-cols-[1fr_320px]">
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
