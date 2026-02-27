import React, { useState, useEffect, useRef, useCallback } from "react"
import DashboardLayout from "@/Layouts/DashboardLayout"
import { Badge } from "@/Components/ui/badge"
import { Button } from "@/Components/ui/button"
import { Progress } from "@/Components/ui/progress"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card"
import { SubscriptionCTA } from "@/Components/SubscriptionCTA"
import {
    CheckCircleIcon,
    CircleIcon,
    ExternalLinkIcon,
    InfoIcon,
    Loader2,
    RefreshCwIcon,
    SparklesIcon,
    BotIcon,
    CloudIcon,
    LinkIcon,
    SendIcon,
} from "lucide-react"

const SETUP_STEPS = [
    { label: "Creating your Telegram bot", icon: BotIcon, duration: 15000 },
    { label: "Setting up your private cloud", icon: CloudIcon, duration: 10000 },
    { label: "Connecting everything together", icon: LinkIcon, duration: 8000 },
    { label: "Your assistant is almost ready!", icon: SparklesIcon, duration: 5000 },
]

interface Assistant {
    id: number
    name: string
    status: string
    provision_status: string
    provision_log: string | null
    bot_username: string | null
    telegram_url: string | null
    created_at: string
}

interface Tier {
    name: string
    price: number
    credits: number
}

interface Props {
    hasActiveSubscription: boolean
    subscriptionTier: string
    llmCredits: number
    tierCredits: number
    tierPrice: number
    assistant: Assistant | null
    tiers: Tier[]
}

function Dashboard({
    hasActiveSubscription,
    subscriptionTier,
    llmCredits: rawLlmCredits,
    tierCredits,
    tierPrice,
    assistant: initialAssistant,
    tiers,
}: Props) {
    const llmCredits = Number(rawLlmCredits) || 0
    const [assistant, setAssistant] = useState<Assistant | null>(initialAssistant)
    const [activeStep, setActiveStep] = useState(0)
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null)
    const stepStartTime = useRef(Date.now())

    const isDeploying = assistant && ['provisioning', 'pending'].includes(assistant.status)
    const isRunning = assistant?.status === 'running'
    const isError = assistant?.status === 'error'

    // Poll for status when deploying
    const pollStatus = useCallback(async () => {
        try {
            const res = await fetch('/dashboard/status', {
                headers: { 'Accept': 'application/json' },
            })
            const data = await res.json()
            if (data.status === 'none') return
            setAssistant({
                id: data.id,
                name: data.name,
                status: data.status,
                provision_status: data.provision_status,
                provision_log: data.provision_log,
                bot_username: data.bot_username,
                telegram_url: data.telegram_url,
                created_at: assistant?.created_at || new Date().toISOString(),
            })
        } catch (err) {
            console.error('Status poll error', err)
        }
    }, [assistant?.created_at])

    useEffect(() => {
        if (isDeploying || (hasActiveSubscription && !assistant)) {
            pollInterval.current = setInterval(pollStatus, 3000)
            return () => {
                if (pollInterval.current) clearInterval(pollInterval.current)
            }
        }
        // Stop polling once running/error
        if (pollInterval.current) {
            clearInterval(pollInterval.current)
            pollInterval.current = null
        }
    }, [isDeploying, hasActiveSubscription, assistant, pollStatus])

    // Progress through steps based on time
    useEffect(() => {
        if (!isDeploying && !(hasActiveSubscription && !assistant)) return
        stepStartTime.current = Date.now()
        setActiveStep(0)

        const interval = setInterval(() => {
            const elapsed = Date.now() - stepStartTime.current
            let cumulative = 0
            for (let i = 0; i < SETUP_STEPS.length; i++) {
                cumulative += SETUP_STEPS[i].duration
                if (elapsed < cumulative) {
                    setActiveStep(i)
                    return
                }
            }
            setActiveStep(SETUP_STEPS.length - 1)
        }, 500)
        return () => clearInterval(interval)
    }, [isDeploying, hasActiveSubscription, assistant])

    // ─── State A: No subscription ───
    if (!hasActiveSubscription) {
        return <SubscriptionCTA tiers={tiers} />
    }

    // ─── State B: Subscribed, no assistant yet OR deploying ───
    if (!assistant || isDeploying) {
        const progressPercent = Math.min(95, ((activeStep + 1) / SETUP_STEPS.length) * 90)

        return (
            <>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">We're getting everything ready for you.</p>
                </div>
                <div className="w-full">
                    <Card className="w-full max-w-xl mx-auto">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative flex items-center justify-center w-20 h-20 mb-5">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                                    <Loader2 className="h-10 w-10 text-primary animate-spin relative z-10" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground">
                                    Setting up your assistant
                                </h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    This takes about a minute. Sit tight!
                                </p>
                            </div>

                            {/* Progress bar */}
                            <Progress value={progressPercent} className="h-2 mb-8" />

                            {/* Step indicators */}
                            <div className="space-y-4">
                                {SETUP_STEPS.map((step, i) => {
                                    const StepIcon = step.icon
                                    const isComplete = i < activeStep
                                    const isCurrent = i === activeStep

                                    return (
                                        <div
                                            key={i}
                                            className={`flex items-center gap-3 transition-all duration-500 ${isCurrent ? 'opacity-100' : isComplete ? 'opacity-60' : 'opacity-30'
                                                }`}
                                        >
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isComplete
                                                ? 'bg-green-500/10'
                                                : isCurrent
                                                    ? 'bg-primary/10'
                                                    : 'bg-muted'
                                                }`}>
                                                {isComplete ? (
                                                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                ) : isCurrent ? (
                                                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                                ) : (
                                                    <CircleIcon className="h-4 w-4 text-muted-foreground/40" />
                                                )}
                                            </div>
                                            <span className={`text-sm ${isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground'
                                                }`}>
                                                {step.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    // ─── State D: Error / stopped ───
    if (isError) {
        return (
            <>
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Something went wrong</p>
                </div>
                <div className="mx-auto max-w-lg">
                    <Card className="shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center min-h-[280px] text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                                    <InfoIcon className="h-8 w-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground mb-2">Setup didn't go as planned</h2>
                                <p className="text-sm text-muted-foreground mb-8 max-w-sm">
                                    Don't worry — this happens sometimes. You can try again or reach out and we'll help.
                                </p>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                    >
                                        <RefreshCwIcon className="mr-2 h-4 w-4" />
                                        Try again
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => window.location.href = 'mailto:support@clawdclaw.com'}
                                    >
                                        Get help
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        )
    }

    // ─── State C: Running ───
    const creditsUsed = tierCredits - llmCredits
    const creditsPercent = tierCredits > 0 ? Math.max(0, Math.min(100, (llmCredits / tierCredits) * 100)) : 0
    const tierLabel = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Your AI assistant is live.</p>
            </div>

            <div className="space-y-6">
                {/* Telegram CTA — primary action */}
                <button
                    onClick={() => window.open(assistant.telegram_url || 'https://web.telegram.org/', '_blank')}
                    className="group relative w-full rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-left text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                                <SendIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold">Open in Telegram</p>
                                {assistant.bot_username && (
                                    <p className="text-sm text-white/60">@{assistant.bot_username}</p>
                                )}
                            </div>
                        </div>
                        <ExternalLinkIcon className="h-5 w-5 text-white/40 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
                </button>

                {/* Status + Credits */}
                <Card>
                    <CardContent className="p-5 space-y-5">
                        {/* Status row */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-600">Running</span>
                            </div>
                            <Badge variant="secondary">
                                {tierLabel} &middot; ${tierPrice}/mo
                            </Badge>
                        </div>

                        {/* AI Credits */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <SparklesIcon className="h-4 w-4" />
                                    AI Credits
                                </span>
                                <span className="font-medium">
                                    {Math.floor(llmCredits).toLocaleString()} / {Math.floor(tierCredits).toLocaleString()} remaining
                                </span>
                            </div>
                            <Progress value={creditsPercent} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                                {Math.ceil(creditsUsed).toLocaleString()} credits used this month. Resets monthly.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

Dashboard.layout = (page: React.ReactNode) => <DashboardLayout title="Dashboard">{page}</DashboardLayout>

export default Dashboard
