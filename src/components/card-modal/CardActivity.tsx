import { ListChecks } from 'lucide-react'
import type { Card } from '../../store/schema'
import { formatDateTime } from '../../utils/dates'
import SectionLabel from '../shared/SectionLabel'

export default function CardActivity({ card }: { card: Card }) {
  return (
    <section>
      <SectionLabel icon={<ListChecks size={14} />}>Activity</SectionLabel>
      {card.activity.length === 0 ? (
        <p className="mt-2 text-xs text-ink-faint">No activity yet.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {card.activity.map((item) => (
            <li key={item.id} className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm text-ink">{item.text}</span>
              <span className="font-mono text-[10.5px] text-ink-faint">
                {formatDateTime(item.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
