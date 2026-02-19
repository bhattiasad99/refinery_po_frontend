import React from "react"
import { SiteHeader } from "@/components/common/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/use-case/DashboardPageComponent/app-sidebar"

const InternalLayout = ({ children }: { children: React.ReactNode }) => {
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
            <SidebarInset className="min-w-0 overflow-hidden">
                <SiteHeader />
                <main className="p-4 lg:p-6 min-w-0">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default InternalLayout
