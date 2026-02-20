import { WarmUpGate } from "@/components/common/warm-up-gate"
import LoginForm from "./login-form"

type LoginPageProps = {
  searchParams?:
    | Promise<{
      continue?: string | string[]
    }>
    | {
      continue?: string | string[]
    }
}

function getSafeContinuePath(continueParam: string | string[] | undefined): string {
  const rawValue = Array.isArray(continueParam) ? continueParam[0] : continueParam
  const value = typeof rawValue === "string" ? rawValue.trim() : ""
  if (!value.startsWith("/")) {
    return "/dashboard"
  }
  if (value.startsWith("//")) {
    return "/dashboard"
  }
  return value
}

const LoginPage = async ({ searchParams }: LoginPageProps) => {
  const resolvedSearchParams = await searchParams
  const continuePath = getSafeContinuePath(resolvedSearchParams?.continue)

  return (
    <WarmUpGate>
      <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-[-6rem] h-80 w-80 rounded-full bg-amber-400/20 blur-3xl"
        />

        <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
          <section className="hidden space-y-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.18em] text-cyan-100 uppercase">
              Refinery PO System
            </div>
            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl leading-tight font-semibold tracking-tight text-balance">
                Procurement made precise, from request to approval.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-slate-300">
                Access your purchase order workspace to track approvals, supplier
                activity, and delivery timelines in one operational dashboard.
              </p>
            </div>
          </section>

          <section className="w-full">
            <LoginForm continuePath={continuePath} />
          </section>
        </div>
      </main>
    </WarmUpGate>
  )
}

export default LoginPage
