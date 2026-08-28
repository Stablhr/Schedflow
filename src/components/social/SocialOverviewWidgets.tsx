import { useEffect, useState } from 'react'
import { CalendarClock, XCircle, Link2, TrendingUp, RefreshCw, Loader2, Trash2 } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { useToast } from '../shared/useToastState'
import { isDueThisWeek, toISODate } from '../../utils/dates'
import { socialAccountsApi, type SocialAccount } from '../../lib/api/social-accounts'

function Widget({ label, value, icon: Icon, hint }: {
  label: string
  value: string | number
  icon: typeof CalendarClock
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <Icon size={15} className="text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-text-primary">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-text-muted">{hint}</p>}
    </div>
  )
}

export default function SocialOverviewWidgets() {
  const { socialPosts, retrySocialPost, refreshSocialJobs, deleteSocialPost } = useStore()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    let active = true
    socialAccountsApi
      .list()
      .then((data) => {
        if (active) setAccounts(data)
      })
      .catch(() => {
        if (active) setAccounts([])
      })
    return () => {
      active = false
    }
  }, [])

  const today = toISODate(new Date())

  const scheduledToday = socialPosts.filter(
    (p) => p.status === 'scheduled' && p.scheduledDate === today,
  ).length

  const scheduledThisWeek = socialPosts.filter(
    (p) => p.status === 'scheduled' && isDueThisWeek(p.scheduledDate ?? ''),
  ).length

  const failed = socialPosts.filter((p) => p.status === 'failed')

  const retryAll = async () => {
    if (failed.length === 0 || retrying) return
    setRetrying(true)
    let ok = 0
    for (const post of failed) {
      const result = await retrySocialPost(post.id)
      if (result) ok += 1
    }
    await refreshSocialJobs()
    setRetrying(false)
    toast(
      ok === failed.length
        ? `Re-queued ${ok} failed post${ok === 1 ? '' : 's'}`
        : `Re-queued ${ok} of ${failed.length} posts`,
      ok === failed.length ? 'success' : 'info',
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Widget
        label="Scheduled Today"
        value={scheduledToday}
        icon={CalendarClock}
        hint="Posts due to publish now"
      />
      <Widget
        label="This Week"
        value={scheduledThisWeek}
        icon={TrendingUp}
        hint="Scheduled over next 7 days"
      />
      <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <XCircle size={15} className={failed.length > 0 ? 'text-danger-text' : 'text-primary'} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">Failed</span>
        </div>
        <p className={`mt-2 text-2xl font-semibold ${failed.length > 0 ? 'text-danger-text' : 'text-text-primary'}`}>
          {failed.length}
        </p>
        <button
          type="button"
          onClick={retryAll}
          disabled={failed.length === 0 || retrying}
          aria-label="Retry all failed posts"
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:underline disabled:opacity-40 disabled:no-underline"
        >
          {retrying ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          {retrying ? 'Retrying...' : 'Retry all'}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!confirm(`Delete ${failed.length} failed post${failed.length === 1 ? '' : 's'}?`)) return
            failed.forEach((p) => deleteSocialPost(p.id))
            toast(`Deleted ${failed.length} failed post${failed.length === 1 ? '' : 's'}`, 'success')
          }}
          disabled={failed.length === 0}
          aria-label="Delete all failed posts"
          className="ml-1 inline-flex items-center gap-1 text-[11px] font-medium text-text-muted transition-colors hover:underline hover:text-danger-text disabled:opacity-40 disabled:no-underline"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>
      <Widget
        label="Connected Accounts"
        value={accounts.length}
        icon={Link2}
        hint="Active platform connections"
      />
    </div>
  )
}
