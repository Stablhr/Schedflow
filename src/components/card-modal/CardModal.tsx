import { useEffect, useRef, useState } from 'react'
import { X, Eye, EyeOff, Trash2, Archive, Check, RotateCcw, MoreHorizontal, ArrowRight, Palette, ImageIcon } from 'lucide-react'
import { COVER_COLORS, BOARD_BACKGROUNDS } from '../../store/schema'
import { blendTwoStop } from '../../utils/color'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'
import CardDescription from './CardDescription'
import CardLabels from './CardLabels'
import CardMembers from './CardMembers'
import CardDueDate from './CardDueDate'
import CardLocation from './CardLocation'
import CardCover from './CardCover'
import CardAttachments from './CardAttachments'
import CardComments from './CardComments'
import CardActivity from './CardActivity'
import CoverPanel from './CoverPanel'
import MoveCardDialog from './MoveCardDialog'

interface CardModalProps {
  cardId: string
  onClose: () => void
}

export default function CardModal({ cardId, onClose }: CardModalProps) {
  const { data, updateCard, addActivity, deleteCard, archiveCard, toggleDone, setBoardBackground } = useStore()
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState('')
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [coverPanelOpen, setCoverPanelOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!overflowOpen) return
    const onDown = (e: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [overflowOpen])

  const card = data.cards[cardId]
  if (!card) return null
  const board = data.boards[card.boardId]
  const list = data.lists[card.listId]
  if (!board || !list) return null

  const commitTitle = () => {
    setEditingTitle(false)
    const t = title.trim()
    if (t && t !== card.title) {
      updateCard(card.id, { title: t })
      addActivity(card.id, 'renamed this card')
    }
  }

  const toggleWatch = () => {
    updateCard(card.id, { watching: !card.watching })
    addActivity(card.id, card.watching ? 'stopped watching this card' : 'started watching this card')
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${card.title}"? This cannot be undone.`)) {
      deleteCard(card.id)
      onClose()
    }
  }

  const handleArchive = () => {
    archiveCard(card.id)
    setOverflowOpen(false)
    onClose()
  }

  const activeCoverColor = typeof card.cover === 'string' ? card.cover : null

  const setColorCover = (color: string) => {
    updateCard(card.id, { cover: color, coverSize: 'small' })
    addActivity(card.id, 'changed the cover')
  }

  const uploadBgImage = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setBoardBackground(board.id, reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <Modal open onClose={onClose} className="h-full overflow-hidden rounded-none rounded-t-2xl sm:h-auto sm:max-w-2xl sm:rounded-2xl glass-heavy shadow-lg">
      {card.cover && (
        <div className={`w-full ${card.coverSize === 'large' ? 'h-48' : typeof card.cover === 'string' ? 'h-28' : 'h-16'}`}>
          {typeof card.cover === 'string' ? (
            <div
              className="h-full w-full"
              style={{ background: blendTwoStop(card.cover as string, '#0A8981') }}
            />
          ) : (
            <img src={card.cover.dataUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onClose}
        title="Close"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full glass-subtle text-ink-muted shadow-md transition hover:text-ink hover-rotate active:scale-95"
      >
        <X size={18} />
      </button>

      <div className="scroll-slim max-h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden sm:max-h-[calc(100vh-8rem)]">
        <div className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              {editingTitle ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTitle()
                    if (e.key === 'Escape') {
                      setTitle(card.title)
                      setEditingTitle(false)
                    }
                  }}
                  onBlur={commitTitle}
                  autoFocus
                  className="w-full rounded-lg px-2 py-1 font-display text-[20px] font-bold text-ink outline-none ring-2 ring-brand"
                />
              ) : (
                <h2
                  onClick={() => {
                    setTitle(card.title)
                    setEditingTitle(true)
                  }}
                  title="Click to rename"
                  className="cursor-text break-words rounded-lg px-2 py-1 font-display text-[20px] font-bold leading-snug text-ink transition hover:bg-surface-alt"
                >
                  {card.title}
                </h2>
              )}
              <p className="mt-0.5 px-2 text-xs text-ink-muted">
                in list{' '}
                <span className="font-semibold text-brand-dark">{list.name}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleDone(card.id)}
              title={card.done ? 'Mark as not done' : 'Mark as done'}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition active:scale-95 sm:px-2.5 ${
                card.done
                  ? 'bg-success text-white'
                  : 'bg-surface-alt text-ink-muted hover:bg-success-light hover:text-success'
              }`}
            >
              {card.done ? <RotateCcw size={14} /> : <Check size={14} />}
              <span className="hidden sm:inline">{card.done ? 'Reopen' : 'Mark as done'}</span>
            </button>

            <button
              type="button"
              onClick={toggleWatch}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition active:scale-95 sm:px-2.5 ${
                card.watching
                  ? 'bg-brand-light text-brand-dark'
                  : 'bg-surface-alt text-ink-muted hover:bg-brand-light hover:text-brand-dark'
              }`}
            >
              {card.watching ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">{card.watching ? 'Watching' : 'Watch'}</span>
            </button>

            {/* Overflow menu */}
            <div className="relative shrink-0" ref={overflowRef}>
              <button
                type="button"
                onClick={() => setOverflowOpen((o) => !o)}
                title="More actions"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-alt active:scale-95"
              >
                <MoreHorizontal size={16} />
              </button>
              {overflowOpen && (
                <div className="absolute right-0 top-9 z-30 w-52 rounded-xl glass py-1 shadow-md animate-in">
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowOpen(false)
                      setMoveDialogOpen(true)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-alt"
                  >
                    <ArrowRight size={14} className="text-ink-muted" />
                    Move
                  </button>
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-ink transition hover:bg-surface-alt"
                  >
                    <Archive size={14} className="text-ink-muted" />
                    Archive
                  </button>
                  <div className="my-1 h-px bg-border" />
                  <div className="px-3 py-2">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      <Palette size={12} />
                      Color
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COVER_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title="Set cover color"
                          onClick={() => {
                            setColorCover(color)
                            setOverflowOpen(false)
                          }}
                          className={`h-6 rounded-md transition hover:scale-110 active:scale-95 ${
                            activeCoverColor === color ? 'ring-2 ring-ink ring-offset-1' : ''
                          }`}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <div className="px-3 py-2">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                      <Palette size={12} />
                      Board background
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {BOARD_BACKGROUNDS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          title="Set board background"
                          onClick={() => {
                            setBoardBackground(board.id, color)
                            setOverflowOpen(false)
                          }}
                          className={`h-6 rounded-md transition hover:scale-110 active:scale-95 ${
                            board.background === color ? 'ring-2 ring-ink ring-offset-1' : ''
                          }`}
                          style={{ background: color }}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => bgFileRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-alt px-2.5 py-1.5 text-[11px] font-semibold text-ink-muted transition hover:bg-brand-light hover:text-brand-dark active:scale-95"
                    >
                      <ImageIcon size={12} />
                      Upload image
                    </button>
                    <input
                      ref={bgFileRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        uploadBgImage(e.target.files?.[0])
                        e.target.value = ''
                        setOverflowOpen(false)
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:mt-5 sm:gap-7 md:grid-cols-[1fr_220px]">
            <div className="min-w-0 space-y-6">
              <CardDescription card={card} />
              <CardAttachments card={card} />
              <CardComments card={card} />
            </div>

            <aside className="min-w-0 space-y-5">
              <CardLabels card={card} />
              <CardMembers card={card} />
              <CardDueDate card={card} />
              <CardLocation card={card} />
              <CardCover card={card} onOpenPanel={() => setCoverPanelOpen(true)} />
            </aside>
          </div>

          <div className="mt-7 border-t border-border pt-4">
            <CardActivity card={card} />
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger-light hover-grow active:scale-95"
            >
              <Trash2 size={14} />
              Delete card
            </button>
          </div>
        </div>
      </div>

      <CoverPanel card={card} open={coverPanelOpen} onClose={() => setCoverPanelOpen(false)} />
      {moveDialogOpen && <MoveCardDialog card={card} onClose={() => setMoveDialogOpen(false)} />}
    </Modal>
  )
}
