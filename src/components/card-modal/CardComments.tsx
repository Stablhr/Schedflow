import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import type { Card } from '../../store/schema'
import { YOU_ID } from '../../store/schema'
import { useStore } from '../../store/useStore'
import { uid } from '../../utils/id'
import { formatDateTime } from '../../utils/dates'
import SectionLabel from '../shared/SectionLabel'
import Avatar from '../shared/Avatar'

export default function CardComments({ card }: { card: Card }) {
  const store = useStore()
  const [text, setText] = useState('')
  const you = store.data.members[YOU_ID]

  const submit = () => {
    const t = text.trim()
    if (!t) return
    store.updateCard(card.id, {
      comments: [
        ...card.comments,
        { id: uid(), authorId: YOU_ID, text: t, createdAt: new Date().toISOString() },
      ],
    })
    store.addActivity(card.id, 'added a comment')
    setText('')
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
          className="flex-1 rounded-xl px-3 py-2 text-sm text-ink outline-none ring-1 ring-border transition placeholder:text-ink-faint focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="mt-3 space-y-3">
        {card.comments.map((comment) => {
          const author = store.data.members[comment.authorId]
          if (!author) return null
          return (
            <div key={comment.id} className="flex items-start gap-2">
              <Avatar member={author} size={24} />
              <div className="flex-1 rounded-xl bg-bg px-3 py-2">
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
