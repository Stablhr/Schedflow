import { useEffect, useState } from 'react'
import { Webhook, Plus, Trash2, Webhook as WebhookIcon, Loader2, CheckCircle2, XCircle, X } from 'lucide-react'
import { webhooksApi, WEBHOOK_EVENT_OPTIONS } from '../../lib/api/webhooks'
import { Input } from '../shared/Input'
import SectionLabel from '../shared/SectionLabel'
import Button from '../shared/Button'
import { useToast } from '../shared/useToastState'

function EventCheckbox({ value, label, checked, onChange }: {
  value: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium text-text-secondary">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-3.5 w-3.5 accent-[var(--primary)]" />
      {label}
    </label>
  )
}

export default function WebhooksPanel({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const data = await webhooksApi.list()
      setWebhooks(data)
    } catch {
      setWebhooks([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const toggleEvent = (v: string) => {
    setEvents((prev) => (prev.includes(v) ? prev.filter((e) => e !== v) : [...prev, v]))
  }

  const create = async () => {
    if (!name || !url || events.length === 0) {
      toast('Name, URL, and at least one event required', 'info')
      return
    }
    setSaving(true)
    try {
      await webhooksApi.create({ name, url, events, secret: secret || undefined })
      setName(''); setUrl(''); setSecret(''); setEvents([])
      setShowForm(false)
      await load()
      toast('Webhook created', 'success')
    } catch {
      toast('Failed to create webhook', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleEnable = async (w: Webhook) => {
    try {
      await webhooksApi.update(w._id, { enabled: !w.enabled })
      await load()
    } catch { /* ignore */ }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this webhook?')) return
    try {
      await webhooksApi.remove(id)
      await load()
      toast('Webhook deleted', 'success')
    } catch { /* ignore */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f1a19]/50" onClick={onClose} />
      <div className="animate-in relative z-10 flex h-full max-h-[620px] w-full max-w-lg flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-modal">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <WebhookIcon size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Webhooks</h2>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
          >
            <Plus size={12} />
            New Webhook
          </button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-text-muted hover:bg-surface-alt hover:text-text-primary">
            <X size={16} />
          </button>
        </div>

        <div className="scroll-slim flex-1 overflow-y-auto p-4 space-y-4">
          {showForm && (
            <div className="rounded-lg border border-border bg-surface-alt p-3 space-y-3">
              <SectionLabel>New Webhook</SectionLabel>
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="text-xs" />
              <Input placeholder="https://your-app.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} className="text-xs" />
              <Input placeholder="Secret (optional)" value={secret} onChange={(e) => setSecret(e.target.value)} className="text-xs" />
              <div>
                <p className="text-[11px] font-medium text-text-secondary mb-1.5">Events</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEBHOOK_EVENT_OPTIONS.map((e) => (
                    <EventCheckbox key={e.value} value={e.value} label={e.label} checked={events.includes(e.value)} onChange={() => toggleEvent(e.value)} />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={create} disabled={saving}>
                  {saving ? <><Loader2 size={12} className="animate-spin" />Saving…</> : 'Create'}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-text-muted">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-xs">Loading webhooks…</span>
            </div>
          ) : webhooks.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">No webhooks configured yet.</p>
          ) : (
            webhooks.map((w) => (
              <div key={w._id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{w.name}</span>
                  <span className={`text-[10px] font-medium ${w.enabled ? 'text-success-text' : 'text-text-muted'}`}>
                    {w.enabled ? 'Active' : 'Disabled'}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    {w.lastDeliveryStatus === 'delivered' && <CheckCircle2 size={13} className="text-success-text" />}
                    {w.lastDeliveryStatus === 'failed' && <XCircle size={13} className="text-danger-text" />}
                    <button type="button" onClick={() => remove(w._id)} aria-label="Delete webhook" className="rounded p-1 text-text-muted hover:bg-danger-subtle hover:text-danger-text">
                      <Trash2 size={13} />
                    </button>
                  </span>
                </div>
                <p className="mt-1 truncate text-[11px] text-text-muted">{w.url}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  {w.events.map((ev) => (
                    <span key={ev} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] text-text-secondary">{ev}</span>
                  ))}
                  <button type="button" onClick={() => toggleEnable(w)} className="ml-auto text-[11px] font-medium text-primary hover:underline">
                    {w.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
