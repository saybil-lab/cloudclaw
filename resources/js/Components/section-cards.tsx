import { IconRobot, IconCreditCard, IconActivity, IconStatusChange } from "@tabler/icons-react"

import { Badge } from "@/Components/ui/badge"
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card"
import { Link } from "@inertiajs/react"

interface SectionCardsProps {
    activeAssistants: number;
    totalAssistants: number;
    creditBalance: number;
    llmBillingMode: string;
    hasLlmApiKey: boolean;
    llmCredits: number;
}

export function SectionCards({
    activeAssistants,
    totalAssistants,
    creditBalance,
    llmBillingMode,
    hasLlmApiKey,
    llmCredits,
}: SectionCardsProps) {
    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Active Assistants</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {activeAssistants}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconRobot className="size-3" />
                            {totalAssistants} total
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {activeAssistants > 0 ? 'Running' : 'No active assistants'}
                    </div>
                    <div className="text-muted-foreground">
                        <Link href="/assistants" className="hover:underline">View all assistants</Link>
                    </div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>Server Credits</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        ${creditBalance.toFixed(2)}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconCreditCard className="size-3" />
                            Balance
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        Available for server usage
                    </div>
                    <div className="text-muted-foreground">
                        <Link href="/credits" className="hover:underline">Add more credits</Link>
                    </div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>LLM Mode</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl capitalize">
                        {llmBillingMode}
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline">
                            <IconActivity className="size-3" />
                            {llmBillingMode === 'byok' ? 'BYOK' : 'Credits'}
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        {llmBillingMode === 'byok'
                            ? (hasLlmApiKey ? 'API key configured' : 'No API key')
                            : `$${llmCredits.toFixed(2)} credits`
                        }
                    </div>
                    <div className="text-muted-foreground">
                        <Link href="/settings" className="hover:underline">Manage settings</Link>
                    </div>
                </CardFooter>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardDescription>System Status</CardDescription>
                    <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        Active
                    </CardTitle>
                    <CardAction>
                        <Badge variant="outline" className="text-green-600">
                            <IconStatusChange className="size-3" />
                            Online
                        </Badge>
                    </CardAction>
                </CardHeader>
                <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                        All systems operational
                    </div>
                    <div className="text-muted-foreground">
                        Last checked: just now
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
