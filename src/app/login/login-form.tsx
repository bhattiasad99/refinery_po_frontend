"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, ShieldCheck } from "lucide-react"

type LoginFormProps = {
  continuePath?: string
}

const LoginForm = ({ continuePath = "/dashboard" }: LoginFormProps) => {
  const router = useRouter()

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl shadow-slate-950/35 backdrop-blur-xl md:p-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/15 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-cyan-100 uppercase">
          <ShieldCheck className="size-3.5" />
          Demo access
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Enter demo</h2>
          <p className="text-sm text-slate-300">
            No backend or credentials are required in this proof-of-concept build.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200">
        <p className="font-semibold text-white">Demo behavior</p>
        <p className="mt-2">
          All data loads from bundled JSON and stays interactive for the session. Refreshing the app
          resets it back to the original demo state.
        </p>
      </div>

      <button
        type="button"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 text-sm font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => router.push(continuePath)}
      >
        Enter workspace
        <ArrowRight className="size-4" />
      </button>

      <button
        type="button"
        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/25 bg-white/5 px-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => router.push("/dashboard")}
      >
        Open buyer demo directly
      </button>
    </div>
  )
}

export default LoginForm
