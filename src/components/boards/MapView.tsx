import { useMemo } from 'react'
import { MapPin, ExternalLink } from 'lucide-react'
import { useStore } from '../../store/useStore'
import type { Card } from '../../store/schema'

interface MapViewProps {
  boardId: string
  onOpenCard: (cardId: string) => void
}

export default function MapView({ boardId, onOpenCard }: MapViewProps) {
  const { data } = useStore()
  const board = data.boards[boardId]

  const cards = useMemo(() => {
    if (!board) return []
    const lists = board.listOrder.map((id) => data.lists[id]).filter(Boolean)
    const result: (Card & { listName: string })[] = []
    for (const list of lists) {
      for (const cardId of list.cardOrder) {
        const card = data.cards[cardId]
        if (card && !card.archived) {
          result.push({ ...card, listName: list.name })
        }
      }
    }
    return result
  }, [board, data.lists, data.cards])

  const withLocation = useMemo(() => cards.filter((c) => c.location.trim()), [cards])
  const withoutLocation = useMemo(() => cards.filter((c) => !c.location.trim()), [cards])

  if (!board) return null

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border glass-subtle px-3 py-2.5 sm:px-4">
        <h2 className="font-display text-lg font-bold text-ink sm:text-xl">Map</h2>
        <span className="font-mono text-xs text-ink-muted">
          {withLocation.length} with location, {withoutLocation.length} without
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Map area */}
        <div className="flex-1 relative bg-surface-alt">
          {withLocation.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8">
              <MapPin size={40} className="text-ink-faint" />
              <p className="text-sm text-ink-muted text-center max-w-xs">
                No cards have locations yet. Add a location to a card to see it on the map.
              </p>
            </div>
          ) : (
            <div className="h-full overflow-auto p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {withLocation.map((card) => {
                  const label = card.labelIds[0] ? board.labels[card.labelIds[0]] : null
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onOpenCard(card.id)}
                      className="flex items-start gap-3 rounded-xl bg-surface p-3 text-left shadow-sm ring-1 ring-border transition hover:shadow-md hover:ring-brand/40 active:scale-[0.98]"
                    >
                      <div
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                        style={{ background: label ? label.color : '#0DABA3' }}
                      >
                        <MapPin size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{card.title}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-muted">{card.location}</p>
                        <p className="mt-0.5 text-[10px] text-ink-faint">{card.listName}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: cards without location */}
        {withoutLocation.length > 0 && (
          <div className="w-[240px] shrink-0 border-l border-border bg-surface p-3 overflow-auto hidden lg:block">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Without Location
            </p>
            <div className="space-y-1">
              {withoutLocation.slice(0, 20).map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onOpenCard(card.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-ink transition hover:bg-surface-alt active:scale-[0.98]"
                >
                  <MapPin size={12} className="shrink-0 text-ink-faint" />
                  <span className="truncate">{card.title}</span>
                </button>
              ))}
              {withoutLocation.length > 20 && (
                <p className="px-2 text-[10px] text-ink-faint">
                  +{withoutLocation.length - 20} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
