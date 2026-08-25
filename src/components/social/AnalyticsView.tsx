import { useMemo } from 'react'
import { BarChart3, TrendingUp, Eye, MousePointerClick, Share2, Award, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { PLATFORM_COLORS } from '../../store/schema'
import { generateAllMockAnalytics, computeSummary } from '../../utils/analytics'

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Eye }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-primary" />
        <p className="text-2xl font-semibold text-text-primary sm:text-3xl">{value}</p>
      </div>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">{label}</p>
    </div>
  )
}

function PlatformBar({ platform, reach, maxReach }: { platform: string; reach: number; maxReach: number }) {
  const pct = maxReach > 0 ? (reach / maxReach) * 100 : 0
  const color = PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] ?? '#888'

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-medium capitalize text-text-secondary">{platform}</span>
      <div className="flex-1">
        <div className="h-4 overflow-hidden rounded-full bg-surface-alt" role="progressbar" aria-label={`${platform}: ${reach} reach`} aria-valuemin={0} aria-valuemax={maxReach} aria-valuenow={reach}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
      <span className="w-16 shrink-0 text-right font-mono text-xs text-text-secondary">
        {reach >= 1000 ? `${(reach / 1000).toFixed(1)}k` : reach}
      </span>
    </div>
  )
}

export default function AnalyticsView() {
  const navigate = useNavigate()
  const { socialPosts } = useStore()

  const postedPosts = useMemo(() => socialPosts.filter((p) => p.status === 'posted'), [socialPosts])

  const allAnalytics = useMemo(() => generateAllMockAnalytics(socialPosts), [socialPosts])

  const summary = useMemo(() => computeSummary(socialPosts, allAnalytics), [socialPosts, allAnalytics])

  const maxPlatformReach = useMemo(
    () => Math.max(...summary.platformBreakdown.map((p) => p.reach), 1),
    [summary.platformBreakdown],
  )

  const formatNum = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  return (
    <div className="scroll-slim h-full overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/social')}
          aria-label="Back to Social Dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
        >
          <ArrowLeft size={16} />
        </button>
        <BarChart3 size={22} className="shrink-0 text-primary" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">Analytics</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Performance metrics for your social posts.
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-warning-subtle px-2 py-0.5 text-[10px] font-semibold text-warning-text">
              Demo Data
            </span>
          </p>
        </div>
      </div>

      {postedPosts.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border bg-surface p-8 text-center">
          <BarChart3 size={32} className="mx-auto text-text-muted" />
          <p className="mt-3 text-sm font-medium text-text-secondary">No analytics yet</p>
          <p className="mt-1 text-xs text-text-muted">
            Post some social media content to see analytics data here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 md:grid-cols-4">
            <StatCard label="Total Reach" value={formatNum(summary.totalReach)} icon={Eye} />
            <StatCard label="Engagements" value={formatNum(summary.totalEngagements)} icon={TrendingUp} />
            <StatCard label="Impressions" value={formatNum(summary.totalImpressions)} icon={Share2} />
            <StatCard label="Avg Engagement" value={`${(summary.avgEngagementRate * 100).toFixed(1)}%`} icon={MousePointerClick} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Platform Breakdown */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                <BarChart3 size={13} />
                Platform Breakdown
              </h3>
              <div className="mt-3 space-y-3">
                {summary.platformBreakdown.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">No data available</p>
                ) : (
                  summary.platformBreakdown
                    .sort((a, b) => b.reach - a.reach)
                    .map((p) => (
                      <PlatformBar
                        key={p.platform}
                        platform={p.platform}
                        reach={p.reach}
                        maxReach={maxPlatformReach}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Top Posts */}
            <div className="rounded-lg border border-border bg-surface p-4">
              <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
                <Award size={13} />
                Top Posts
              </h3>
              <div className="mt-3 space-y-2">
                {summary.topPosts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-text-muted">No data available</p>
                ) : (
                  summary.topPosts.map((item, i) => (
                    <div key={item.post.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-medium text-text-primary">
                          {item.post.title || 'Untitled'}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className="text-[10px] text-text-muted">
                            {formatNum(item.reach)} reach
                          </span>
                          <span className="text-[10px] text-text-muted">
                            {(item.engagementRate * 100).toFixed(1)}% engagement
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
