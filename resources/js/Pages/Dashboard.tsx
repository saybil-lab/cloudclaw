import React from "react"
import DashboardLayout from "@/Layouts/DashboardLayout"
import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card"
import { Link } from "@inertiajs/react"
import { SubscriptionCTA } from "@/Components/SubscriptionCTA"
import {
    AlertCircleIcon,
    CalendarIcon,
    CheckCircleIcon,
    ClockIcon,
    CpuIcon,
    CreditCardIcon,
    PlusIcon,
    RocketIcon,
    SearchIcon,
    ServerIcon,
    SettingsIcon,
    TrendingUpIcon,
    XCircleIcon,
    ZapIcon,
} from "lucide-react"
import {
    Bar,
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

interface Assistant {
    id: number
    name: string
    status: string
    server_type: string
    ip_address: string | null
    created_at: string
}

interface Stats {
    total_assistants: number
    active_assistants: number
    total_credits: number
    llm_credits: number
    usage_today: number
    usage_this_month: number
}

interface ChartDataPoint {
    date: string
    fullDate: string
    usage: number
}

interface ActivityLog {
    id: number
    action_type: string
    status: string
    description: string
    assistant_name: string | null
    created_at: string
    created_at_human: string
}

interface Transaction {
    id: number
    amount: number
    type: string
    description: string
    created_at: string
}

interface Props {
    assistants: Assistant[]
    stats: Stats
    chartData: ChartDataPoint[]
    recentActivity: ActivityLog[]
    recentTransactions: Transaction[]
    llmBillingMode: string
    hasLlmApiKey: boolean
    hasActiveSubscription: boolean
    subscriptionStatus: string | null
}

const actionTypeConfig: Record<string, { icon: typeof ServerIcon; color: string; label: string }> = {
    assistant_created: { icon: RocketIcon, color: "text-green-500", label: "Assistant created" },
    assistant_started: { icon: ZapIcon, color: "text-blue-500", label: "Assistant started" },
    assistant_stopped: { icon: XCircleIcon, color: "text-orange-500", label: "Assistant stopped" },
    assistant_deleted: { icon: XCircleIcon, color: "text-red-500", label: "Assistant deleted" },
    credits_added: { icon: CreditCardIcon, color: "text-emerald-500", label: "Credits added" },
    settings_updated: { icon: SettingsIcon, color: "text-purple-500", label: "Settings updated" },
}

const statusConfig: Record<string, { icon: typeof CheckCircleIcon; color: string }> = {
    success: { icon: CheckCircleIcon, color: "text-green-500" },
    pending: { icon: ClockIcon, color: "text-yellow-500" },
    failed: { icon: XCircleIcon, color: "text-red-500" },
}

const assistantStatusConfig: Record<string, { color: string; bg: string }> = {
    running: { color: "text-green-600", bg: "bg-green-500/10" },
    stopped: { color: "text-gray-600", bg: "bg-gray-500/10" },
    pending: { color: "text-yellow-600", bg: "bg-yellow-500/10" },
    error: { color: "text-red-600", bg: "bg-red-500/10" },
}

function Dashboard({
    assistants,
    stats,
    chartData,
    recentActivity,
    recentTransactions,
    llmBillingMode,
    hasLlmApiKey,
    hasActiveSubscription,
    subscriptionStatus,
}: Props) {
    // Show subscription CTA if user doesn't have an active subscription
    if (!hasActiveSubscription) {
        return <SubscriptionCTA />
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Overview of your AI assistants and usage.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/assistants/create">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New Assistant
                    </Link>
                </Button>
            </div>

            {/* LLM API Key Warning */}
            {llmBillingMode === 'byok' && !hasLlmApiKey && (
                <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                    <CardContent className="flex items-center gap-4 py-4">
                        <AlertCircleIcon className="h-5 w-5 text-orange-500" />
                        <div className="flex-1">
                            <p className="font-medium text-orange-700 dark:text-orange-300">
                                LLM API key not configured
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-400">
                                Configure your OpenAI API key to enable AI features for your assistants.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/settings">Configure API Key</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Low Credits Warning */}
            {stats.total_credits < 5 && (
                <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
                    <CardContent className="flex items-center gap-4 py-4">
                        <AlertCircleIcon className="h-5 w-5 text-red-500" />
                        <div className="flex-1">
                            <p className="font-medium text-red-700 dark:text-red-300">
                                Low credits balance
                            </p>
                            <p className="text-sm text-red-600 dark:text-red-400">
                                Your server credits are running low. Add more to keep your assistants running.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/credits">Add Credits</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Assistants</CardTitle>
                        <CpuIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.active_assistants}</div>
                        <p className="text-xs text-muted-foreground">
                            of {stats.total_assistants} total
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Server Credits</CardTitle>
                        <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.total_credits.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">available balance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usage Today</CardTitle>
                        <ZapIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.usage_today.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">server costs today</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <CalendarIcon className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.usage_this_month.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            total usage
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Usage Chart */}
            {chartData && chartData.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUpIcon className="h-5 w-5" />
                            Usage (Last 7 Days)
                        </CardTitle>
                        <CardDescription>
                            Daily breakdown of server costs
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                    Date
                                                                </span>
                                                                <span className="font-bold text-muted-foreground">
                                                                    {payload[0].payload.fullDate}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                    Usage
                                                                </span>
                                                                <span className="font-bold">
                                                                    ${Number(payload[0].value).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Bar
                                        dataKey="usage"
                                        fill="hsl(var(--primary))"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Activity & Transactions */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUpIcon className="h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>Latest actions on your account</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!recentActivity || recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <SearchIcon className="h-10 w-10 text-muted-foreground/50" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    No recent activity
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {recentActivity.map((activity) => {
                                    const actionConfig = actionTypeConfig[activity.action_type] || {
                                        icon: ClockIcon,
                                        color: "text-gray-500",
                                        label: activity.action_type,
                                    }
                                    const StatusIcon = statusConfig[activity.status]?.icon || CheckCircleIcon
                                    const statusColor = statusConfig[activity.status]?.color || "text-gray-500"
                                    const ActionIcon = actionConfig.icon
                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-3 rounded-lg border p-3"
                                        >
                                            <div className={`mt-0.5 ${actionConfig.color}`}>
                                                <ActionIcon className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium truncate flex-1">
                                                        {activity.description}
                                                    </p>
                                                    <StatusIcon className={`h-3.5 w-3.5 flex-shrink-0 ${statusColor}`} />
                                                </div>
                                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    {activity.assistant_name && (
                                                        <span className="truncate">{activity.assistant_name}</span>
                                                    )}
                                                    <span>{activity.created_at_human}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5" />
                            Recent Transactions
                        </CardTitle>
                        <CardDescription>Latest credit activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!recentTransactions || recentTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <CreditCardIcon className="h-10 w-10 text-muted-foreground/50" />
                                <p className="mt-2 text-sm text-muted-foreground">
                                    No transactions yet
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                                {recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">
                                                {transaction.description || transaction.type}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(transaction.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`font-medium text-sm ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Assistants Grid */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Your Assistants</h2>
                    <Button variant="ghost" asChild>
                        <Link href="/assistants">View all</Link>
                    </Button>
                </div>

                {!assistants || assistants.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <CpuIcon className="h-12 w-12 text-muted-foreground/50" />
                            <h3 className="mt-4 text-lg font-semibold">No assistants yet</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Create your first AI assistant to get started.
                            </p>
                            <Button asChild className="mt-4">
                                <Link href="/assistants/create">
                                    <PlusIcon className="mr-2 h-4 w-4" />
                                    Create Assistant
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {assistants.slice(0, 6).map((assistant) => {
                            const statusStyle = assistantStatusConfig[assistant.status] || {
                                color: "text-gray-600",
                                bg: "bg-gray-500/10",
                            }
                            return (
                                <Link
                                    key={assistant.id}
                                    href={`/assistants/${assistant.id}`}
                                    className="block"
                                >
                                    <Card className="transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <CardTitle className="text-base">{assistant.name}</CardTitle>
                                                    <CardDescription>
                                                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                            {assistant.server_type}
                                                        </code>
                                                    </CardDescription>
                                                </div>
                                                <Badge className={`${statusStyle.bg} ${statusStyle.color}`}>
                                                    {assistant.status}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 gap-2 text-center">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                                                    <p className="text-sm font-mono">
                                                        {assistant.ip_address || 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                                    <p className="text-sm">
                                                        {new Date(assistant.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </>
    )
}

Dashboard.layout = (page: React.ReactNode) => <DashboardLayout title="Dashboard">{page}</DashboardLayout>

export default Dashboard
