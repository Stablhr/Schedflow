import { useRef, useState } from 'react'
import { MessageSquare, SmilePlus } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import type { Card } from '../../store/schema'
import { YOU_ID } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { uid } from '../../utils/id'
import { formatDateTime } from '../../utils/dates'
import { hasUserCommentReaction, toggleUserCommentReaction } from '../../utils/reactions'
import SectionLabel from '../shared/SectionLabel'
import Avatar from '../shared/Avatar'

export default function CardComments({ card }: { card: Card }) {
  const store = useStore()
  const [text, setText] = useState('')
  const [activePicker, setActivePicker] = useState<string | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const you = store.data.members[YOU_ID]

  const submit = () => {
    const t = text.trim()
    if (!t) return
    store.updateCard(card.id, {
      comments: [
        ...card.comments,
        { id: uid(), authorId: YOU_ID, text: t, reactions: {}, createdAt: new Date().toISOString() },
      ],
    })
    store.addActivity(card.id, 'added a comment')
    setText('')
  }

  const toggleCommentReaction = (commentId: string, emoji: string) => {
    const comments = card.comments.map((c) => {
      if (c.id !== commentId) return c
      const current = c.reactions[emoji] ?? 0
      const added = toggleUserCommentReaction(card.id, commentId, emoji)
      return {
        ...c,
        reactions: {
          ...c.reactions,
          [emoji]: added ? current + 1 : Math.max(0, current - 1),
        },
      }
    })
    const cleaned = comments.map((c) => {
      const r = { ...c.reactions }
      for (const [k, v] of Object.entries(r)) {
        if (v <= 0) delete r[k]
      }
      return { ...c, reactions: r }
    })
    store.updateCard(card.id, { comments: cleaned })
    store.addActivity(card.id, `Reacted ${emoji} to a comment`)
  }

  return (
    <section>
      <SectionLabel icon={<MessageSquare size={14} />}>Comments</SectionLabel>

      <div className="mt-2 flex items-start gap-2">
        {you && <Avatar member={you} size={24} />}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="Write a comment…"
          className="flex-1 rounded-xl px-3 py-2 text-sm text-ink outline-none neu-input transition placeholder:text-ink-faint focus:neu-input-focus"
        />
      </div>

      <div className="mt-3 space-y-3">
        {card.comments.map((comment) => {
          const author = store.data.members[comment.authorId]
          if (!author) return null
          const reactionEntries = Object.entries(comment.reactions).filter(([, c]) => c > 0)
          const pickerOpen = activePicker === comment.id

          return (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar member={author} size={24} />
              <div className="min-w-0 flex-1">
                <div className="rounded-xl bg-bg px-3 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-ink">{author.name}</span>
                    <span className="font-mono text-[10.5px] text-ink-faint">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
                    {comment.text}
                  </p>
                </div>

                {reactionEntries.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {reactionEntries.map(([emoji, count]) => {
                      const active = hasUserCommentReaction(card.id, comment.id, emoji)
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleCommentReaction(comment.id, emoji)}
                          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs transition active:scale-95 ${
                            active
                              ? 'bg-brand-light text-brand-dark ring-1 ring-brand'
                              : 'bg-surface-alt text-ink-muted hover:bg-brand-light'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span className="font-mono text-[10px]">{count}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="relative mt-1" ref={pickerRef}>
                  <button
                    type="button"
                    onClick={() => setActivePicker(pickerOpen ? null : comment.id)}
                    className="inline-flex items-center gap-1 rounded-lg p-1 text-ink-faint transition hover:bg-surface-alt hover:text-ink-muted"
                    title="Add reaction"
                  >
                    <SmilePlus size={14} />
                  </button>

                  {pickerOpen && (
                    <div className="absolute left-0 top-8 z-30 max-w-[min(320px,100%)] animate-in">
                      <EmojiPicker
                        onEmojiClick={(emojiData) => {
                          toggleCommentReaction(comment.id, emojiData.emoji)
                          setActivePicker(null)
                        }}
                        theme={'light' as any}
                        width={320}
                        height={380}
                        lazyLoadEmojis
                        autoFocusSearch
                        skinTonesDisabled
                        previewConfig={{ showPreview: false }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {card.comments.length === 0 && (
          <p className="text-xs text-ink-faint">No comments yet.</p>
        )}
      </div>
    </section>
  )
}
