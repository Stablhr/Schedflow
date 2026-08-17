import { useState } from 'react'
import { FolderInput, Inbox, ArrowRight } from 'lucide-react'
import type { Card } from '../../store/schema'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'

interface MoveCardDialogProps {
  card: Card
  onClose: () => void
}

export default function MoveCardDialog({ card, onClose }: MoveCardDialogProps) {
  const store = useStore()
  const [tab, setTab] = useState<'board' | 'inbox'>('board')
  const [confirmInbox, setConfirmInbox] = useState(false)

  const boards = Object.values(store.data.boards).sort(
    (a, b) => Number(b.starred) - Number(a.starred) || b.updatedAt.localeCompare(a.updatedAt),
  )

  const currentBoard = store.data.boards[card.boardId]
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '')
  const lists = store.getLists(boardId)
  const [listId, setListId] = useState(lists[0]?.id ?? '')
  const targetCards = store.getCards(listId)
  const [position, setPosition] = useState(targetCards.length)

  const inputClass =
    'w-full rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none ring-1 ring-border transition focus:ring-2 focus:ring-brand'

  const handleBoardMove = () => {
    if (!listId) return
    store.moveCard(card.id, listId, position)
    // moveCard only updates listId — also update boardId when moving across boards
    const targetBoardId = store.data.lists[listId]?.boardId
    if (targetBoardId && targetBoardId !== card.boardId) {
      store.updateCard(card.id, { boardId: targetBoardId })
    }
    onClose()
  }

  const handleInboxMove = () => {
    if (!confirmInbox) {
      setConfirmInbox(true)
      return
    }
    store.addActivity(card.id, 'moved to Inbox')
    store.addInboxItem(card.title)
    store.deleteCard(card.id)
    onClose()
  }

  return (
    <Modal open onClose={onClose} className="max-w-md rounded-2xl bg-surface shadow-lg">
      <div className="p-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
            <ArrowRight size={18} />
          </span>
          <h2 className="font-display text-xl font-bold text-ink">Move card</h2>
        </div>
        <p className="mt-1.5 truncate text-sm text-ink-muted" title={card.title}>
          &ldquo;{card.title}&rdquo;
        </p>

        {/* Tabs */}
        <div className="mt-5 flex gap-1 rounded-lg bg-surface-alt p-0.5">
          <button
            type="button"
            onClick={() => setTab('board')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === 'board'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <FolderInput size={13} className="mr-1 inline" />
            Board
          </button>
          <button
            type="button"
            onClick={() => setTab('inbox')}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              tab === 'inbox'
                ? 'bg-surface text-ink shadow-sm'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Inbox size={13} className="mr-1 inline" />
            Inbox
          </button>
        </div>

        {tab === 'board' && (
          <>
            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Board
                </label>
                <select
                  value={boardId}
                  onChange={(e) => {
                    const next = e.target.value
                    setBoardId(next)
                    const nextLists = store.getLists(next)
                    setListId(nextLists[0]?.id ?? '')
                    setPosition(store.getCards(nextLists[0]?.id ?? '').length)
                  }}
                  className={inputClass}
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}{b.id === card.boardId ? ' (current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  List
                </label>
                <select
                  value={listId}
                  onChange={(e) => {
                    setListId(e.target.value)
                    setPosition(store.getCards(e.target.value).length)
                  }}
                  className={inputClass}
                >
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                  Position
                </label>
                <select
                  value={position}
                  onChange={(e) => setPosition(Number(e.target.value))}
                  className={inputClass}
                >
                  {Array.from({ length: targetCards.length + 1 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'Top' : i === targetCards.length ? 'Bottom' : `${i + 1}${ordinal(i + 1)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBoardMove}
              disabled={!listId}
              className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95 disabled:opacity-40"
            >
              <ArrowRight size={15} />
              Move
            </button>
          </>
        )}

        {tab === 'inbox' && (
          <>
            <div className="mt-5 rounded-xl bg-bg p-4">
              <p className="text-sm text-ink-muted">
                This will remove the card from <span className="font-semibold text-ink">{currentBoard?.name ?? 'its board'}</span> and
                convert it to a plain Inbox item.
              </p>
              <p className="mt-2 text-xs text-ink-faint">
                All labels, cover, attachments, comments, and reactions will be discarded.
                {/* MVP: discards card data on demotion. Preserve for re-promotion in a future iteration. */}
              </p>
            </div>

            <button
              type="button"
              onClick={handleInboxMove}
              className={`mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold shadow-sm transition active:scale-95 ${
                confirmInbox
                  ? 'bg-danger text-white hover:bg-danger/90'
                  : 'bg-warn text-ink hover:bg-warn/90'
              }`}
            >
              <Inbox size={15} />
              {confirmInbox ? 'Confirm move to Inbox' : 'Move to Inbox'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
