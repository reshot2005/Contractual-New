export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 h-8 w-52 rounded-lg animate-shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-[var(--border)] bg-white animate-shimmer" />
        ))}
      </div>
    </div>
  )
}

