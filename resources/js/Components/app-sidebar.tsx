import * as React from "react"
import {
    LayoutDashboardIcon,
    SettingsIcon,
    HelpCircleIcon,
    PuzzleIcon,
} from "lucide-react"
import { Badge } from "@/Components/ui/badge"

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
            isActive: currentPath === '/dashboard' || currentPath.startsWith('/dashboard'),
        },
        {
            title: "Skills",
            url: "/skills",
            icon: PuzzleIcon,
            isActive: currentPath.startsWith('/skills'),
            badge: <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">Soon</Badge>,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: SettingsIcon,
            isActive: currentPath.startsWith('/settings'),
        },
    ]

    const navSecondary = [
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
