"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, LoaderCircle, MoonStar, SunMedium } from "lucide-react"

type WarmUpServiceStatus = "pending" | "warming" | "ready" | "failed" | "skipped"
type WarmUpJobStatus = "running" | "completed"

type WarmUpServiceResult = {
  serviceName: string
  target: string | null
  status: WarmUpServiceStatus
  httpStatus: number | null
  durationMs: number | null
  message: string
  startedAt: string | null
  completedAt: string | null
}

type WarmUpJob = {
  id: string
  status: WarmUpJobStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
  services: WarmUpServiceResult[]
}

type WarmUpSession = {
  id: string
  status: WarmUpJobStatus
  createdAt: string
  statusUrl: string
  streamUrl: string
}

type WarmUpUpdateEvent = {
  jobId: string
  jobStatus: WarmUpJobStatus
  service: WarmUpServiceResult
  updatedAt: string
  completedAt: string | null
}

const OVERLAY_MIN_VISIBLE_MS = 1200
const FALLBACK_POLL_INTERVAL_MS = 1200
const RETRY_DELAY_MS = 10000
const EXPECTED_SERVICE_NAMES = [
  "api-gateway",
  "event-bus",
  "catalog",
  "purchase-orders",
  "departments",
  "users",
] as const
const MANUAL_START_URLS: Record<(typeof EXPECTED_SERVICE_NAMES)[number], string> = {
  "api-gateway": "https://refinery-po-backend-api-gateway.onrender.com",
  "event-bus": "https://refinery-po-backend-event-bus.onrender.com",
  catalog: "https://refinery-po-backend.onrender.com",
  "purchase-orders": "https://refinery-po-backend-purchase-order.onrender.com",
  departments: "https://refinery-po-backend-departments.onrender.com",
  users: "https://refinery-po-backend-users.onrender.com",
}

function readJson<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T
  } catch {
    return null
  }
}

function statusClassName(status: WarmUpServiceStatus): string {
  switch (status) {
    case "ready":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200"
    case "failed":
      return "bg-red-100 text-red-700 border border-red-200"
    case "warming":
      return "bg-amber-100 text-amber-700 border border-amber-200"
    case "skipped":
      return "bg-slate-100 text-slate-600 border border-slate-200"
    default:
      return "bg-sky-100 text-sky-700 border border-sky-200"
  }
}

function stateLabel(status: WarmUpServiceStatus): string {
  if (status === "ready") {
    return "Awake"
  }
  if (status === "warming") {
    return "Waking"
  }
  if (status === "failed") {
    return "Unavailable"
  }
  return "Asleep"
}

function ServiceStateIcon({ status }: { status: WarmUpServiceStatus }) {
  if (status === "ready") {
    return <SunMedium className="size-4 text-emerald-700" />
  }
  if (status === "warming") {
    return <LoaderCircle className="size-4 animate-spin text-amber-700" />
  }
  if (status === "failed") {
    return <AlertTriangle className="size-4 text-red-700" />
  }
  return <MoonStar className="size-4 text-sky-700" />
}

function resolveStartErrorMessage(body: unknown): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "string"
  ) {
    return (body as { message: string }).message
  }
  return "Warm-up service is temporarily unavailable."
}

function resolveManualStartUrl(serviceName: string): string | null {
  if (serviceName in MANUAL_START_URLS) {
    return MANUAL_START_URLS[serviceName as keyof typeof MANUAL_START_URLS]
  }
  return null
}

export function WarmUpGate({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(true)
  const [job, setJob] = useState<WarmUpJob | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [requestCount, setRequestCount] = useState(0)

  const areAllServicesReady = (snapshot: WarmUpJob): boolean => {
    return snapshot.services.length > 0 && snapshot.services.every((service) => service.status === "ready")
  }

  const visibleServices = useMemo(() => {
    const byName = new Map((job?.services ?? []).map((service) => [service.serviceName, service]))
    return EXPECTED_SERVICE_NAMES.map((serviceName): WarmUpServiceResult => {
      const existing = byName.get(serviceName)
      if (existing) {
        return existing
      }
      return {
        serviceName,
        target: null,
        status: "pending",
        httpStatus: null,
        durationMs: null,
        message: "Waiting for warm-up session",
        startedAt: null,
        completedAt: null,
      }
    })
  }, [job])

  const serviceTotals = useMemo(() => {
    const total = visibleServices.length
    const readyCount = visibleServices.filter((service) => service.status === "ready").length
    return {
      total,
      readyCount,
      progress: total > 0 ? Math.round((readyCount / total) * 100) : 0,
    }
  }, [visibleServices])

  useEffect(() => {
    let mounted = true
    let closeCurrentSession: (() => void) | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    const startedAt = Date.now()

    const wait = async (ms: number): Promise<void> => {
      await new Promise<void>((resolve) => {
        retryTimer = setTimeout(() => resolve(), ms)
      })
      retryTimer = null
    }

    const cleanupSession = () => {
      if (closeCurrentSession) {
        closeCurrentSession()
        closeCurrentSession = null
      }
    }

    const finish = async () => {
      const elapsed = Date.now() - startedAt
      const delay = Math.max(OVERLAY_MIN_VISIBLE_MS - elapsed, 0)
      if (delay > 0) {
        await wait(delay)
      }
      if (mounted) {
        setActive(false)
      }
    }

    const trackWarmUpSession = async (sessionId: string): Promise<WarmUpJob | null> => {
      return await new Promise<WarmUpJob | null>((resolve) => {
        let settled = false
        let source: EventSource | null = new EventSource(`/api/warm-up/stream/${encodeURIComponent(sessionId)}`)
        let fallbackPolling: ReturnType<typeof setInterval> | null = null

        const finalize = (snapshot: WarmUpJob | null) => {
          if (settled) {
            return
          }
          settled = true
          cleanup()
          resolve(snapshot)
        }

        const onSnapshot = (snapshot: WarmUpJob) => {
          if (!mounted) {
            finalize(null)
            return
          }
          setJob(snapshot)
          if (snapshot.status === "completed") {
            finalize(snapshot)
          }
        }

        const pollStatus = async () => {
          try {
            setRequestCount((value) => value + 1)
            const response = await fetch(`/api/warm-up/status/${encodeURIComponent(sessionId)}`, {
              method: "GET",
              cache: "no-store",
            })
            if (!response.ok) {
              return
            }
            const snapshot = (await response.json()) as WarmUpJob
            onSnapshot(snapshot)
          } catch {
            // Ignore transient polling failures.
          }
        }

        const startFallbackPolling = () => {
          if (fallbackPolling) {
            return
          }
          void pollStatus()
          fallbackPolling = setInterval(() => {
            void pollStatus()
          }, FALLBACK_POLL_INTERVAL_MS)
        }

        const cleanup = () => {
          if (source) {
            source.close()
            source = null
          }
          if (fallbackPolling) {
            clearInterval(fallbackPolling)
            fallbackPolling = null
          }
        }

        closeCurrentSession = () => finalize(null)

        source.addEventListener("snapshot", (event) => {
          const snapshot = readJson<WarmUpJob>((event as MessageEvent).data)
          if (snapshot) {
            onSnapshot(snapshot)
          }
        })

        source.addEventListener("update", (event) => {
          const update = readJson<WarmUpUpdateEvent>((event as MessageEvent).data)
          if (!update || !mounted) {
            return
          }

          setJob((previous) => {
            if (!previous || previous.id !== update.jobId) {
              return previous
            }

            return {
              ...previous,
              status: update.jobStatus,
              updatedAt: update.updatedAt,
              completedAt: update.completedAt,
              services: previous.services.map((service) =>
                service.serviceName === update.service.serviceName ? update.service : service
              ),
            }
          })
        })

        source.addEventListener("done", (event) => {
          const snapshot = readJson<WarmUpJob>((event as MessageEvent).data)
          if (snapshot) {
            onSnapshot(snapshot)
          } else {
            finalize(null)
          }
        })

        source.onerror = () => {
          if (!mounted) {
            finalize(null)
            return
          }
          if (source) {
            source.close()
            source = null
          }
          startFallbackPolling()
        }
      })
    }

    const runUntilReady = async () => {
      while (mounted) {
        setAttempt((value) => value + 1)

        let session: WarmUpSession | null = null
        try {
          setRequestCount((value) => value + 1)
          const response = await fetch("/api/warm-up", {
            method: "GET",
            cache: "no-store",
          })
          if (!response.ok) {
            let responseBody: unknown = null
            try {
              responseBody = await response.json()
            } catch {
              responseBody = null
            }
            throw new Error(resolveStartErrorMessage(responseBody))
          }
          session = (await response.json()) as WarmUpSession
          setErrorMessage(null)
        } catch (error) {
          if (!mounted) {
            break
          }
          const message = error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Warm-up service is temporarily unavailable."
          setErrorMessage(`${message} Retrying...`)
          await wait(RETRY_DELAY_MS)
          continue
        }

        const snapshot = await trackWarmUpSession(session.id)
        cleanupSession()
        if (!mounted || !snapshot) {
          await wait(RETRY_DELAY_MS)
          continue
        }

        if (areAllServicesReady(snapshot)) {
          setErrorMessage(null)
          await finish()
          break
        }

        setErrorMessage("Some services are still cold. Retrying warm-up...")
        await wait(RETRY_DELAY_MS)
      }
    }

    void runUntilReady()

    return () => {
      mounted = false
      cleanupSession()
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
    }
  }, [])

  return (
    <>
      {children}
      {active ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/90 backdrop-blur-sm">
          <div className="max-h-[90vh] w-[min(90vw,680px)] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Warming services</h2>
                <p className="text-sm text-muted-foreground">
                  Preparing backend services before loading the workspace. Attempt {attempt || 1}.
                </p>
                <p className="text-xs text-muted-foreground">
                  This can take around 10-15 minutes on cold infrastructure.
                </p>
                <p className="text-xs text-muted-foreground">
                  Warm-up requests sent: {requestCount}
                </p>
              </div>
              <div className="size-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            </div>

            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-900">
              <p className="font-semibold">Important: Startup can take several minutes on cold servers.</p>
              <p>
                You can speed this up by clicking <span className="font-semibold">Start manually</span> on each service
                below.
              </p>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Startup progress</span>
                <span>{serviceTotals.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${serviceTotals.progress}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              {visibleServices.map((service) => {
                const manualStartUrl = resolveManualStartUrl(service.serviceName)
                return (
                <div
                  key={service.serviceName}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-background/60 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <ServiceStateIcon status={service.status} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{service.serviceName}</p>
                      <p className="truncate text-xs text-muted-foreground">{service.message}</p>
                      {manualStartUrl ? (
                        <a
                          href={manualStartUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2"
                        >
                          Start manually
                        </a>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {service.durationMs !== null ? (
                      <span className="text-xs text-muted-foreground">{service.durationMs}ms</span>
                    ) : null}
                    <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusClassName(service.status)}`}>
                      {stateLabel(service.status)}
                    </span>
                  </div>
                </div>
                )
              })}
            </div>

            {errorMessage ? (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  )
}
