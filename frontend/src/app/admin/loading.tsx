export default function AdminLoading() {
  return (
    <div className="min-h-screen p-6">
      <div className="mb-6 h-8 w-64 rounded-lg animate-shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border border-[var(--border)] bg-white animate-shimmer" />
        ))}
      </div>
    </div>
  )
}

