"use client"

type AppErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppErrorPage({ error, reset }: AppErrorPageProps) {
  return (
    <div className="flex min-h-svh items-center justify-center px-6 py-10">
      <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
          Something Went Wrong
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Unexpected application error</h1>
        <p className="mt-2 text-sm text-slate-600">
          We couldn&apos;t complete this request. Please try again, or return to the dashboard.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Try Again
          </button>
          <a
            href="/dashboard"
            className="rounded-md border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Go to Dashboard
          </a>
        </div>

        {error?.digest ? (
          <p className="mt-5 text-xs text-slate-500" aria-live="polite">
            Error reference: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  )
}
