import { Skeleton } from '../shared/Skeleton'

export default function SocialDashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-6 rounded-md" />
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="ml-auto h-8 w-24 rounded-md" />
      </div>

      <div className="mt-4 space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
