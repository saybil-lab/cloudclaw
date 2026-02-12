import { PlusCircleIcon, type LucideIcon } from "lucide-react"
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
    }[]
}) {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link
                            href="/assistants/create"
                            className="flex w-full items-center gap-2 rounded-md p-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <PlusCircleIcon className="size-4" />
                            <span>New Assistant</span>
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <Link
                                href={item.url}
                                className={cn(
                                    "flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    item.isActive && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                )}
                            >
                                {item.icon && <item.icon className="size-4" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
