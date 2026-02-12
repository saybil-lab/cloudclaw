import * as React from "react"
import {
    LayoutDashboardIcon,
    CpuIcon,
    CreditCardIcon,
    SettingsIcon,
    HelpCircleIcon,
} from "lucide-react"

import { NavMain } from "@/Components/nav-main"
import { NavSecondary } from "@/Components/nav-secondary"
import { NavUser } from "@/Components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
} from "@/Components/ui/sidebar"
import { Link, usePage } from "@inertiajs/react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { auth, url } = usePage().props as unknown as { auth: { user: { id: number; name: string; email: string } }; url: string }

    const currentPath = url?.split('?')[0] || ''

    const navMain = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboardIcon,
            isActive: currentPath === '/dashboard',
        },
        {
            title: "Assistants",
            url: "/assistants",
            icon: CpuIcon,
            isActive: currentPath.startsWith('/assistants'),
        },
        {
            title: "Credits",
            url: "/credits",
            icon: CreditCardIcon,
            isActive: currentPath.startsWith('/credits'),
        },
    ]

    const navSecondary = [
        {
            title: "Settings",
            url: "/settings",
            icon: SettingsIcon,
        },
        {
            title: "Help",
            url: "mailto:support@clawdclaw.com",
            icon: HelpCircleIcon,
        },
    ]

    const user = {
        name: auth.user.name || auth.user.email.split("@")[0],
        email: auth.user.email,
        avatar: "",
    }

    return (
        <Sidebar collapsible="offcanvas" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href="/dashboard" className="flex items-center gap-2 p-1.5">
                            <img src="/images/logo.png" alt="Clawdclaw" className="h-7 w-7 rounded-full" />
                            <span className="font-semibold text-lg">Clawdclaw</span>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={user} />
            </SidebarFooter>
        </Sidebar>
    )
}
