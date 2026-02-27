import { type LucideIcon } from "lucide-react"
import { Link } from "@inertiajs/react"
import { cn } from "@/lib/utils"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
} from "@/Components/ui/sidebar"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: LucideIcon
        isActive?: boolean
        badge?: React.ReactNode
    }[]
}) {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <Link
                                href={item.url}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    item.isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    {item.icon && <item.icon className="size-4" />}
                                    <span>{item.title}</span>
                                </div>
                                {item.badge && (
                                    <div className="flex-shrink-0">
                                        {item.badge}
                                    </div>
                                )}
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
