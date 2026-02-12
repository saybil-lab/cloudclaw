import React, { useState } from "react"
import { Button } from "@/Components/ui/button"
import {
    Card,
    CardContent,
} from "@/Components/ui/card"
import {
    CheckIcon,
    Loader2Icon,
    MailIcon,
    MessageSquareIcon,
    ServerIcon,
    SlackIcon,
    SparklesIcon,
    UsersIcon,
    CheckCircleIcon,
} from "lucide-react"

export function SubscriptionCTA() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const getCookie = (name: string): string => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(';').shift() || '')
        }
        return ''
    }

    const handleSubscribe = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/subscription/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                credentials: 'same-origin',
            })

            const data = await response.json()

            if (data.error) {
                setError(data.error)
                return
            }

            // Mock mode - reload page
            if (data.mock || data.success) {
                window.location.reload()
                return
            }

            // Redirect to Stripe
            if (data.url) {
                window.location.href = data.url
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const features = [
        { text: "Your own dedicated instance", icon: ServerIcon },
        { text: "Unlimited conversations", icon: MessageSquareIcon },
        { text: "Slack, Telegram, WhatsApp integration", icon: SlackIcon },
        { text: "Latest AI models (including Opus 4.6)", icon: SparklesIcon },
        { text: "Priority support (human)", icon: UsersIcon },
        { text: "Personalized advisory service tailored to your use cases", icon: CheckCircleIcon },
        { text: "Dedicated email address for your assistant", icon: MailIcon },
        { text: "Cancel anytime", icon: CheckIcon },
    ]

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-lg">
                <CardContent className="space-y-6 pt-6">
                    {/* Price */}
                    <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold">$199</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                                    <CheckIcon className="h-3 w-3 text-green-600" />
                                </div>
                                <span className="text-sm">{feature.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* CTA Button */}
                    <Button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
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

                    <p className="text-center text-xs text-muted-foreground">
                        Secure payment via Stripe. Cancel anytime.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
