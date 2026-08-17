import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import type { Board, ShareRole } from '../../store/schema'
import { useStore } from '../../store/useStore'
import Modal from '../shared/Modal'

const ROLE_LABELS: Record<ShareRole, string> = {
  admin: 'Admin',
  member: 'Member',
  observer: 'Observer',
}

const ROLE_DESCRIPTIONS: Record<ShareRole, string> = {
  admin: 'Full control over the board.',
  member: 'Can edit cards and lists.',
  observer: 'View only.',
}

export default function ShareModal({ board, onClose }: { board: Board; onClose: () => void }) {
  const { addShare, removeShare } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<ShareRole>('member')
  const [copied, setCopied] = useState(false)

  const shares = board.shares ?? []
  const link = `${window.location.origin}/boards/${board.id}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable
    }
  }

  const add = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    addShare(board.id, trimmed, role)
    setName('')
  }

  const inputClass =
    'rounded-lg px-2.5 py-1.5 text-sm text-ink outline-none ring-1 ring-border transition focus:ring-2 focus:ring-brand'

  return (
    <Modal open onClose={onClose} className="max-w-md rounded-2xl glass shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Share board</h2>
            <p className="mt-0.5 text-sm text-ink-muted">{board.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-surface-alt hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={copyLink}
          className="mt-5 w-full rounded-xl bg-bg px-3 py-2.5 text-left ring-1 ring-border transition hover:ring-brand hover-glow"
        >
          <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Shareable link
          </span>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-brand">{link}</span>
          <span className="mt-1 block text-xs font-semibold text-ink">
            {copied ? 'Copied to clipboard!' : 'Click to copy'}
          </span>
        </button>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
              Name or email
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder="e.g. Alex"
              className={`w-full ${inputClass}`}
            />
          </div>
          <div className="flex gap-2 sm:block">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ShareRole)}
                className={inputClass}
              >
                {(Object.keys(ROLE_LABELS) as ShareRole[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={add}
              disabled={!name.trim()}
              className="flex h-[38px] items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark active:scale-95 disabled:opacity-40"
            >
              <UserPlus size={15} />
              Add
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-1">
          {shares.length === 0 && (
            <p className="rounded-lg bg-bg px-3 py-2.5 text-xs text-ink-faint">
              No collaborators yet — invites are shared locally on this device.
            </p>
          )}
          {shares.map((share) => (
            <div key={share.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface-alt">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: '#0DABA3' }}
              >
                {share.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{share.name}</span>
              <span className="text-[11px] text-ink-muted">{ROLE_LABELS[share.role]}</span>
              <button
                type="button"
                onClick={() => removeShare(board.id, share.id)}
                title="Remove"
                className="rounded-lg p-1 text-ink-faint transition hover:bg-danger-light hover:text-danger"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[11px] leading-snug text-ink-faint">
          {ROLE_DESCRIPTIONS[role]} Collaborators are local for now — real accounts and sync arrive
          with a future backend.
        </p>
      </div>
    </Modal>
  )
}
