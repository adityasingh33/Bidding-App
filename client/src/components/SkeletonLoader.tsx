export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col h-full opacity-70">
      {/* Image Skeleton */}
      <div className="h-48 sm:h-52 w-full bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
      
      {/* Content Skeleton */}
      <div className="p-5 flex flex-col flex-grow gap-4">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse w-3/4"></div>
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse w-1/2"></div>
        </div>
        
        {/* Price Box */}
        <div className="mt-auto bg-slate-950/50 p-3.5 rounded-xl border border-slate-300 dark:border-slate-800/50 flex justify-between items-center">
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
          <div className="h-6 w-20 bg-emerald-900/40 rounded animate-pulse"></div>
        </div>
        
        {/* Button */}
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse mt-2"></div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
