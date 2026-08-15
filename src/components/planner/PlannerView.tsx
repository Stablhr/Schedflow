import { CalendarDays } from 'lucide-react'

export default function PlannerView() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">
        <CalendarDays size={26} />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">Planner</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Drag cards onto a week grid to schedule them. This view arrives in a later phase.
      </p>
    </div>
  )
}
