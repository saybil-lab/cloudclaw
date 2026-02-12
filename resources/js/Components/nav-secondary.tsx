import * as React from "react"
import { LucideIcon } from "lucide-react"
import { Link } from "@inertiajs/react"

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
} from "@/Components/ui/sidebar"

export function NavSecondary({
    items,
    ...props
}: {
    items: {
        title: string
        url: string
        icon: LucideIcon
    }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const isExternalUrl = (url: string) => {
        return url.startsWith('mailto:') || url.startsWith('http://') || url.startsWith('https://')
    }

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            {isExternalUrl(item.url) ? (
                                <a
                                    href={item.url}
                                    className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                    <item.icon className="size-4" />
                                    <span>{item.title}</span>
                                </a>
                            ) : (
                                <Link
                                    href={item.url}
                                    className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                    <item.icon className="size-4" />
                                    <span>{item.title}</span>
                                </Link>
                            )}
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
