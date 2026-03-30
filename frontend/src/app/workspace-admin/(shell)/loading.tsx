export default function WorkspaceAdminShellLoading() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-56 rounded-lg animate-shimmer" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-800 bg-slate-900/60 animate-shimmer" />
        ))}
      </div>
    </div>
  )
}

