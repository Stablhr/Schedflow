import { ImageIcon, X } from 'lucide-react'
import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'
import SectionLabel from '../shared/SectionLabel'

interface CardCoverProps {
  card: Card
  onOpenPanel: () => void
}

export default function CardCover({ card, onOpenPanel }: CardCoverProps) {
  const { updateCard, addActivity } = useStore()

  return (
    <section>
      <SectionLabel icon={<ImageIcon size={14} />}>Cover</SectionLabel>

      <div className="mt-2 space-y-2">
        <button
          type="button"
          onClick={onOpenPanel}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-xs font-semibold text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95"
        >
          <ImageIcon size={13} />
          Change cover
        </button>

        {card.cover && (
          <button
            type="button"
            onClick={() => {
              updateCard(card.id, { cover: null, coverSize: 'small' })
              addActivity(card.id, 'removed the cover')
            }}
            className="flex items-center gap-1 text-xs font-semibold text-ink-faint transition hover:text-danger"
          >
            <X size={12} />
            Remove cover
          </button>
        )}
      </div>
    </section>
  )
}
