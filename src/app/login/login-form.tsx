"use client"

import { useActionState } from "react"
import { ArrowRight, ShieldCheck } from "lucide-react"
import { loginAction } from "@/app/actions/auth-actions"

type LoginFormProps = {
  continuePath?: string
}

const LoginForm = ({ continuePath = "/dashboard" }: LoginFormProps) => {
  const [state, formAction, isPending] = useActionState(loginAction, { error: null })

  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-md space-y-6 rounded-3xl border border-white/20 bg-white/10 p-7 shadow-2xl shadow-slate-950/35 backdrop-blur-xl md:p-8"
    >
      <input type="hidden" name="continue" value={continuePath} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/35 bg-cyan-300/15 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-cyan-100 uppercase">
          <ShieldCheck className="size-3.5" />
          Secure access
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Sign in</h2>
          <p className="text-sm text-slate-300">
            Enter your credentials to continue to the procurement dashboard.
          </p>
        </div>
      </div>

      {state.error ? (
        <p
          className="rounded-xl border border-red-300/40 bg-red-500/20 px-3 py-2 text-sm text-red-100"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/75 px-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30 focus-visible:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Minimum 8 characters"
            className="h-11 w-full rounded-xl border border-white/20 bg-slate-900/75 px-3 text-sm text-slate-100 placeholder:text-slate-400 focus-visible:border-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300/30 focus-visible:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-3 text-sm font-semibold text-slate-950 transition hover:from-cyan-300 hover:to-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign in"}
        <ArrowRight className="size-4" />
      </button>
    </form>
  )
}

export default LoginForm
