import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { usePage, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import {
    CheckCircle, CreditCard, SparklesIcon, UserIcon,
    MailIcon, ArrowUpRightIcon, Loader2Icon, ArrowUpIcon,
} from 'lucide-react';

interface Tier {
    name: string;
    price: number;
    credits: number;
}

interface Props {
    hasActiveSubscription: boolean;
    subscriptionTier: string;
    subscriptionStatus: string | null;
    llmCredits: number;
    tierCredits: number;
    tierPrice: number;
    tiers: Tier[];
    userEmail: string;
    userName: string;
}

function SettingsIndex({
    hasActiveSubscription,
    subscriptionTier,
    subscriptionStatus,
    llmCredits: rawLlmCredits,
    tierCredits,
    tierPrice,
    tiers,
    userEmail,
    userName,
}: Props) {
    const llmCredits = Number(rawLlmCredits) || 0;
    const [upgrading, setUpgrading] = useState<string | null>(null);

    if (!hasActiveSubscription) {
        return <SubscriptionCTA tiers={tiers} />;
    }

    const tierLabel = subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1);
    const creditsPercent = tierCredits > 0 ? Math.max(0, Math.min(100, (llmCredits / tierCredits) * 100)) : 0;
    const tierOrder = ['starter', 'pro', 'beast'];
    const currentTierIndex = tierOrder.indexOf(subscriptionTier);

    const getCookie = (name: string): string => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        return '';
    };

    const handleUpgrade = async (tierName: string) => {
        setUpgrading(tierName);
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
            });
            const data = await response.json();
            if (data.mock || data.success) {
                window.location.reload();
            } else if (data.url) {
                window.location.href = data.url;
            }
        } catch {
            // ignore
        } finally {
            setUpgrading(null);
        }
    };

    return (
        <>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your subscription and account.
                </p>
            </div>

            <div className="space-y-6">
                {/* Current Plan */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Your Plan
                                </CardTitle>
                                <CardDescription>Current subscription details</CardDescription>
                            </div>
                            <Badge variant="secondary" className="text-sm">
                                {tierLabel} &middot; ${tierPrice}/mo
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600">Active</span>
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
                                Credits reset monthly with your {tierLabel} plan.
                            </p>
                        </div>

                        {/* Plan comparison */}
                        <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-3">All plans</p>
                            <div className="grid gap-3 sm:grid-cols-3">
                                {tiers.map((tier) => {
                                    const isCurrentTier = tier.name === subscriptionTier;
                                    const tierIdx = tierOrder.indexOf(tier.name);
                                    const isUpgrade = tierIdx > currentTierIndex;
                                    const label = tier.name.charAt(0).toUpperCase() + tier.name.slice(1);
                                    return (
                                        <div
                                            key={tier.name}
                                            className={`rounded-lg border p-3 text-center ${isCurrentTier ? 'border-primary bg-primary/5' : ''}`}
                                        >
                                            <p className="font-semibold text-sm">{label}</p>
                                            <p className="text-lg font-bold">${tier.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                                            <p className="text-xs text-muted-foreground">{tier.credits.toLocaleString()} credits/mo</p>
                                            {isCurrentTier && (
                                                <Badge variant="outline" className="mt-2 text-xs">Current</Badge>
                                            )}
                                            {isUpgrade && (
                                                <Button
                                                    size="sm"
                                                    className="mt-2 w-full"
                                                    disabled={upgrading !== null}
                                                    onClick={() => handleUpgrade(tier.name)}
                                                >
                                                    {upgrading === tier.name ? (
                                                        <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <ArrowUpIcon className="mr-1.5 h-3.5 w-3.5" />
                                                    )}
                                                    Upgrade
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                To cancel your subscription, contact us at{' '}
                                <a href="mailto:support@clawdclaw.com" className="text-primary hover:underline">
                                    support@clawdclaw.com
                                </a>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Account */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5" />
                            Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <MailIcon className="h-3.5 w-3.5" />
                                    {userEmail}
                                </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/profile">
                                    Edit Profile
                                    <ArrowUpRightIcon className="ml-1.5 h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SettingsIndex.layout = (page: React.ReactNode) => <DashboardLayout title="Settings">{page}</DashboardLayout>

export default SettingsIndex;
