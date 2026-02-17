
import React from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AppSidebar } from "./app-sidebar"
import { SiteHeader } from "@/components/common/site-header"
import { SectionCards } from "@/components/common/section-cards"
import { ChartAreaInteractive } from "./chart-area-interactive"
import { DataTable } from "./data-table"
import { data } from "./data"

const MemoizedChartAreaInteractive = React.memo(ChartAreaInteractive)
const MemoizedDataTable = React.memo(DataTable)

export default function DashboardPageComponent() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <MemoizedChartAreaInteractive />
              </div>
              <MemoizedDataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
