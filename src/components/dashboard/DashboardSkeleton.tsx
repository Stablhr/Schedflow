import { Skeleton } from '../shared/Skeleton'

export default function DashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 md:p-8">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2 h-4 w-64" />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl glass-subtle p-4 shadow-sm">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-6 h-10 max-w-md rounded-xl" />

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* DueSoonList skeleton */}
          <div className="rounded-xl glass-subtle p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="mt-3 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                  <Skeleton className="h-3.5 flex-1" />
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* RecentBoardsList skeleton */}
          <div className="rounded-xl glass-subtle p-4 shadow-sm">
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* PlannerPreview skeleton */}
        <div className="rounded-xl glass-subtle p-4 shadow-sm">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex flex-col items-center rounded-lg px-1 py-2">
                <Skeleton className="h-2.5 w-3" />
                <Skeleton className="mt-1 h-4 w-4" />
                <Skeleton className="mt-1 h-1.5 w-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
