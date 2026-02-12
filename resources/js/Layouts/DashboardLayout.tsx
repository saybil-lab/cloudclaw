import { AppSidebar } from "@/Components/app-sidebar"
import { SiteHeader } from "@/Components/site-header"
import { SidebarInset, SidebarProvider } from "@/Components/ui/sidebar"
import { Head } from "@inertiajs/react"
import { ReactNode } from "react"

interface DashboardLayoutProps {
    children: ReactNode
    title?: string
}

export default function DashboardLayout({ children, title = "Dashboard" }: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <Head title={title} />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader title={title} />
                <div className="flex flex-1 flex-col">
                    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
                        {children}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
