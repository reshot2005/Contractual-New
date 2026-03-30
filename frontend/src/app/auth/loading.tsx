export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-alt)] p-6">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--border)] bg-white p-6">
        <div className="h-7 w-40 rounded animate-shimmer" />
        <div className="h-12 w-full rounded-xl animate-shimmer" />
        <div className="h-12 w-full rounded-xl animate-shimmer" />
        <div className="h-12 w-full rounded-xl animate-shimmer" />
      </div>
    </div>
  )
}

