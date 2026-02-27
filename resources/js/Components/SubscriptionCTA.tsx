import React, { useState } from "react"
import { trackEvent } from "@/lib/analytics"
import { Button } from "@/Components/ui/button"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card"
import { Badge } from "@/Components/ui/badge"
import {
    CheckIcon,
    Loader2Icon,
    SparklesIcon,
    ZapIcon,
    RocketIcon,
    CrownIcon,
} from "lucide-react"

interface Tier {
    name: string
    price: number
    credits: number
}

interface Props {
    tiers?: Tier[]
}

const tierMeta: Record<string, {
    label: string
    icon: typeof SparklesIcon
    features: string[]
    highlight?: boolean
}> = {
    starter: {
        label: "Starter",
        icon: ZapIcon,
        features: [
            "Telegram integration",
            "Claude AI (latest models)",
            "Cancel anytime",
        ],
    },
    pro: {
        label: "Pro",
        icon: RocketIcon,
        highlight: true,
        features: [
            "Telegram integration",
            "Claude AI (latest models)",
            "Priority support",
            "Cancel anytime",
        ],
    },
    beast: {
        label: "Beast",
        icon: CrownIcon,
        features: [
            "Telegram integration",
            "Claude AI (latest models)",
            "Priority support",
            "Cancel anytime",
        ],
    },
}

const defaultTiers: Tier[] = [
    { name: 'starter', price: 15, credits: 1000 },
    { name: 'pro', price: 39, credits: 3000 },
    { name: 'beast', price: 89, credits: 8000 },
]

export function SubscriptionCTA({ tiers = defaultTiers }: Props) {
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const getCookie = (name: string): string => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(';').shift() || '')
        }
        return ''
    }

    const handleSubscribe = async (tierName: string) => {
        setLoading(tierName)
        setError(null)
        trackEvent('begin_checkout', { tier: tierName })

        try {
            const response = await fetch('/subscription/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                credentials: 'same-origin',
                body: JSON.stringify({ tier: tierName }),
            })

            const data = await response.json()

            if (data.error) {
                setError(data.error)
                return
            }

            // Mock mode - redirect to dashboard
            if (data.mock || data.success) {
                window.location.href = '/dashboard'
                return
            }

            // Redirect to Stripe
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight mb-2">Choose your plan</h2>
                <p className="text-muted-foreground">Get your AI assistant on Telegram in under a minute.</p>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400 mb-6 max-w-md w-full text-center">
                    {error}
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-3 w-full max-w-4xl">
                {tiers.map((tier) => {
                    const meta = tierMeta[tier.name] || tierMeta.starter
                    const Icon = meta.icon
                    const isPopular = meta.highlight

                    return (
                        <Card
                            key={tier.name}
                            className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}`}
                        >
                            {isPopular && (
                                <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                                    Most Popular
                                </Badge>
                            )}
                            <CardHeader className="text-center pb-2">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Icon className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">{meta.label}</CardTitle>
                                </div>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-3xl font-bold">${tier.price}</span>
                                    <span className="text-muted-foreground text-sm">/mo</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {tier.credits.toLocaleString()} credits/mo
                                </p>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col">
                                <div className="space-y-2.5 flex-1">
                                    {meta.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2.5">
                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                                                <CheckIcon className="h-3 w-3 text-green-600" />
                                            </div>
                                            <span className="text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    onClick={() => handleSubscribe(tier.name)}
                                    disabled={loading !== null}
                                    className="w-full mt-6"
                                    size="lg"
                                    variant={isPopular ? "default" : "outline"}
                                >
                                    {loading === tier.name ? (
                                        <>
                                            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="mr-2 h-4 w-4" />
                                            Get Started
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
                Secure payment via Stripe. Cancel anytime.
            </p>
        </div>
    )
}
