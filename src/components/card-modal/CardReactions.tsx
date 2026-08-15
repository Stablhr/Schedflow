import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'

const EMOJIS = ['👍', '🎉', '👀', '❤️']

export default function CardReactions({ card }: { card: Card }) {
  const updateCard = useStore().updateCard

  const react = (emoji: string) => {
    updateCard(card.id, {
      reactions: { ...card.reactions, [emoji]: (card.reactions[emoji] ?? 0) + 1 },
    })
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => react(emoji)}
          title="React"
          className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-sm transition hover:bg-brand-light active:scale-95"
        >
          <span>{emoji}</span>
          <span className="font-mono text-[11px] font-medium text-ink-muted">
            {card.reactions[emoji] ?? 0}
          </span>
        </button>
      ))}
    </div>
  )
}
