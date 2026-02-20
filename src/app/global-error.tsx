"use client"

type GlobalErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-svh items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl rounded-2xl border bg-white p-8 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
              Critical Error
            </p>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">We hit an unexpected issue</h1>
            <p className="mt-2 text-sm text-slate-600">
              Please retry this action. If the problem persists, refresh the page and sign in again.
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Retry
              </button>
            </div>
            {error?.digest ? (
              <p className="mt-5 text-xs text-slate-500" aria-live="polite">
                Error reference: {error.digest}
              </p>
            ) : null}
          </div>
        </div>
      </body>
    </html>
  )
}
