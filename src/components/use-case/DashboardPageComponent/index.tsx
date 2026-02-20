"use client"

import { useEffect, useMemo, useState } from "react"
import { ChartAreaInteractive, type PurchaseOrdersPerDayPoint } from "@/components/use-case/DashboardPageComponent/chart-area-interactive"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiGet } from "@/lib/api"

type DashboardStats = {
  totalPurchases: number
  totalPurchaseOrders: number
  totalItemsPurchased: number
  purchaseOrdersThisMonth: number
  purchaseOrdersPerDay: PurchaseOrdersPerDayPoint[]
}

const EMPTY_STATS: DashboardStats = {
  totalPurchases: 0,
  totalPurchaseOrders: 0,
  totalItemsPurchased: 0,
  purchaseOrdersThisMonth: 0,
  purchaseOrdersPerDay: [],
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value)
}

async function loadDashboardStats(signal?: AbortSignal): Promise<DashboardStats> {
  return apiGet<DashboardStats>("/api/purchase-orders/dashboard", {
    cache: "no-store",
    signal,
    fallbackErrorMessage: "Failed to load dashboard data",
  })
}

export default function DashboardPageComponent() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const hydrate = async () => {
      setIsLoading(true)
      try {
        const nextStats = await loadDashboardStats(controller.signal)
        if (!controller.signal.aborted) {
          setStats(nextStats)
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        if (!controller.signal.aborted) {
          setStats(EMPTY_STATS)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void hydrate()

    return () => controller.abort()
  }, [])

  const cards = useMemo(
    () => [
      {
        label: "Total Purchases",
        value: formatCurrency(stats.totalPurchases),
      },
      {
        label: "Total Purchase Orders",
        value: formatCount(stats.totalPurchaseOrders),
      },
      {
        label: "Total Items Purchased",
        value: formatCount(stats.totalItemsPurchased),
      },
      {
        label: "Purchase Orders This Month",
        value: formatCount(stats.purchaseOrdersThisMonth),
      },
    ],
    [stats]
  )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="pb-2">
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {isLoading ? <Skeleton className="h-8 w-32" /> : card.value}
                </CardTitle>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders Per Day</CardTitle>
              <CardDescription>Number of purchase orders by day</CardDescription>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[280px] w-full" />
            </CardContent>
          </Card>
        ) : (
          <ChartAreaInteractive data={stats.purchaseOrdersPerDay} />
        )}
      </div>
    </div>
  )
}
