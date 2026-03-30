export default function PublicLoading() {
  return (
    <main className="min-h-screen bg-[var(--bg-alt)]">
      <div className="mx-auto max-w-[1280px] px-4 py-24 lg:px-6">
        <div className="mb-8 h-10 w-56 rounded-xl animate-shimmer" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
              <div className="h-48 animate-shimmer" />
              <div className="space-y-3 p-5">
                <div className="h-4 w-2/3 rounded animate-shimmer" />
                <div className="h-4 w-full rounded animate-shimmer" />
                <div className="h-4 w-1/2 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

