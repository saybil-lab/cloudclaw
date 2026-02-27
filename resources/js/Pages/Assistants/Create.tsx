import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import { ChannelModal } from '@/Components/ChannelModal';
import {
    InfoIcon, Loader2, PartyPopper, MessageCircle,
    SparklesIcon, CpuIcon, ArrowLeftIcon, PlayCircle
} from 'lucide-react';
import { TelegramIcon } from '@/Components/SocialIcons';
import { FormEvent, useState, useEffect, useRef } from 'react';

const LOADING_MESSAGES = [
    "Initializing your private cloud...",
    "Allocating dedicated resources...",
    "Installing AI core engine...",
    "Configuring secure environment...",
    "Connecting to Telegram...",
    "Waking up your assistant...",
    "Finalizing neural pathways..."
];

interface Props {
    creditBalance: number;
    hasActiveSubscription: boolean;
    hasLlmApiKey?: boolean;
    llmBillingMode: 'credits' | 'byok';
    llmCredits: number;
}

function CreateAssistant({ creditBalance: rawCreditBalance, hasActiveSubscription, hasLlmApiKey, llmBillingMode, llmCredits: rawLlmCredits }: Props) {
    if (!hasActiveSubscription) {
        return <SubscriptionCTA />;
    }

    const creditBalance = Number(rawCreditBalance) || 0;
    const llmCredits = Number(rawLlmCredits) || 0;

    const [name, setName] = useState('');
    const [telegramToken, setTelegramToken] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);

    const [deploymentState, setDeploymentState] = useState<'idle' | 'provisioning' | 'success' | 'error'>('idle');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [serverId, setServerId] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [serverLogs, setServerLogs] = useState<string>('');
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    const serverPrice = 9.99;
    const hasEnoughServerCredits = creditBalance >= serverPrice;
    const hasEnoughLlmCredits = llmBillingMode === 'byok' || llmCredits > 0;
    const canDeploy = name.trim() && telegramToken.trim() && hasEnoughServerCredits && hasEnoughLlmCredits;

    // Cycle loading messages
    useEffect(() => {
        if (deploymentState === 'provisioning') {
            const interval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [deploymentState]);

    // Poll for deployment status
    useEffect(() => {
        if (deploymentState === 'provisioning' && serverId) {
            pollInterval.current = setInterval(async () => {
                try {
                    const response = await fetch(`/assistants/${serverId}/status`, {
                        headers: { 'Accept': 'application/json' }
                    });
                    const resData = await response.json();

                    if (resData.logs) {
                        setServerLogs(resData.logs);
                    }

                    if (resData.status === 'running' || resData.status === 'success' || resData.status === 'ready') {
                        setDeploymentState('success');
                        if (pollInterval.current) clearInterval(pollInterval.current);
                    } else if (resData.status === 'error' || resData.status === 'failed') {
                        setDeploymentState('error');
                        setErrorMessage('Something went wrong during setup. Please contact support.');
                        if (pollInterval.current) clearInterval(pollInterval.current);
                    }
                } catch (err) {
                    console.error('Error polling status', err);
                }
            }, 5000);

            return () => {
                if (pollInterval.current) clearInterval(pollInterval.current);
            };
        }
    }, [deploymentState, serverId]);

    const getCookie = (cookieName: string): string => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${cookieName}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(';').shift() || '');
        }
        return '';
    };

    const handleDeploy = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!canDeploy) return;

        setDeploymentState('provisioning');
        setLoadingMessageIndex(0);
        setErrorMessage('');

        try {
            const response = await fetch('/assistants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    name,
                    telegram_token: telegramToken,
                }),
            });

            const resData = await response.json();

            if (response.status === 403 && resData.requires_subscription) {
                setDeploymentState('error');
                setErrorMessage('You need an active subscription to create an assistant.');
                return;
            }

            if (!response.ok || resData.error) {
                setDeploymentState('error');
                setErrorMessage(resData.error || resData.message || 'Creation failed. Please check your inputs.');
                return;
            }

            if (resData.status === 'success' && resData.server_id) {
                setServerId(resData.server_id);
            } else {
                setDeploymentState('error');
                setErrorMessage('Unexpected response from server.');
            }
        } catch (err) {
            console.error('Deployment error', err);
            setDeploymentState('error');
            setErrorMessage('An unexpected error occurred.');
        }
    };

    // ─── Provisioning View ───
    if (deploymentState === 'provisioning') {
        return (
            <>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Creating Assistant</h1>
                        <p className="text-muted-foreground">Setting up your private AI server</p>
                    </div>
                </div>
                <div className="mx-auto max-w-2xl">
                    <Card className="border-border shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center min-h-[420px]">
                                <div className="relative flex items-center justify-center w-16 h-16 mb-6">
                                    <div className="absolute inset-0 bg-primary/15 rounded-full animate-ping" />
                                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                                    <Loader2 className="h-8 w-8 text-primary animate-spin relative z-10" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    Deploying {name}
                                </h2>
                                <div className="h-6 flex items-center justify-center overflow-hidden mb-4">
                                    <p className="text-sm text-muted-foreground font-medium animate-pulse text-center">
                                        {LOADING_MESSAGES[loadingMessageIndex]}
                                    </p>
                                </div>

                                <div
                                    className="w-full mt-2 bg-[#0a0a0a] border border-border text-green-400 font-mono text-[11px] p-4 rounded-xl h-48 text-left overflow-y-auto shadow-inner relative"
                                    ref={(el) => { if (el) el.scrollTop = el.scrollHeight; }}
                                >
                                    <div className="absolute top-2 right-3 flex space-x-1.5 opacity-40">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    </div>
                                    <pre className="whitespace-pre-wrap break-words leading-relaxed opacity-90 pt-2">
                                        {serverLogs || 'Connecting to data center...'}
                                    </pre>
                                </div>

                                <p className="text-xs text-muted-foreground/50 mt-4">
                                    This usually takes 2–5 minutes. You can wait or come back later.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // ─── Success View ───
    if (deploymentState === 'success') {
        return (
            <>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Assistant Created</h1>
                        <p className="text-muted-foreground">Your AI assistant is live</p>
                    </div>
                </div>
                <div className="mx-auto max-w-2xl">
                    <Card className="border-border shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center min-h-[360px] text-center">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/20">
                                    <PartyPopper className="h-10 w-10 text-green-500" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-2">You're All Set!</h2>
                                <p className="text-lg text-muted-foreground mb-8 max-w-md">
                                    Your assistant <span className="font-semibold text-foreground">{name}</span> is now running and ready to chat.
                                </p>

                                <Button
                                    onClick={() => window.open('https://web.telegram.org/', '_blank')}
                                    className="bg-[#2AABEE] hover:bg-[#229ED9] text-white rounded-xl h-14 px-8 text-lg font-semibold shadow-md flex items-center gap-3 transition-transform hover:scale-[1.02] mb-3"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    Open Telegram & Start Chatting
                                </Button>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="rounded-xl h-12 px-6"
                                >
                                    <Link href={`/assistants/${serverId}`}>
                                        <CpuIcon className="mr-2 h-4 w-4" />
                                        View Assistant Details
                                    </Link>
                                </Button>

                                <Button
                                    variant="ghost"
                                    asChild
                                    className="mt-4 text-muted-foreground hover:text-foreground"
                                >
                                    <Link href="/dashboard">Go to Dashboard</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // ─── Error Recovery ───
    if (deploymentState === 'error') {
        return (
            <>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Create Assistant</h1>
                        <p className="text-muted-foreground">Something went wrong</p>
                    </div>
                </div>
                <div className="mx-auto max-w-2xl">
                    <Card className="border-border shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-500/20">
                                    <InfoIcon className="h-8 w-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold text-foreground mb-2">Creation Failed</h2>
                                <p className="text-sm text-muted-foreground mb-6 max-w-md">
                                    {errorMessage}
                                </p>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setDeploymentState('idle');
                                            setErrorMessage('');
                                        }}
                                    >
                                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                        Try Again
                                    </Button>
                                    <Button asChild>
                                        <Link href="/dashboard">Go to Dashboard</Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    // ─── Main Form (idle) ───
    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Assistant</h1>
                    <p className="text-muted-foreground">
                        Set up your AI assistant in seconds
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-2xl">
                <form onSubmit={handleDeploy}>
                    <Card>
                        <CardHeader>
                            <CardTitle>New Assistant</CardTitle>
                            <CardDescription>
                                Name your assistant and connect a Telegram bot to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Name Input */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Assistant name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                    placeholder="my-assistant"
                                    className="h-11"
                                    autoFocus
                                />
                                <p className="text-sm text-muted-foreground">
                                    Letters, numbers and hyphens only
                                </p>
                            </div>

                            {/* Telegram Token Input */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="telegram_token" className="flex items-center gap-2">
                                        <TelegramIcon className="h-4 w-4 text-[#2AABEE]" />
                                        Telegram Bot Token
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7"
                                        onClick={() => setShowTutorial(true)}
                                    >
                                        <PlayCircle className="h-3.5 w-3.5" />
                                        How to get a token
                                    </Button>
                                </div>
                                <Input
                                    id="telegram_token"
                                    value={telegramToken}
                                    onChange={(e) => setTelegramToken(e.target.value.trim())}
                                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
                                    className="h-11 font-mono text-sm"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Each assistant needs its own unique Telegram bot token. <button type="button" onClick={() => setShowTutorial(true)} className="underline text-primary hover:text-primary/80">Watch the tutorial</button> to create one.
                                </p>
                            </div>

                            {/* Pricing info */}
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Server (CPX22 — 2 cores, 4 GB RAM)</span>
                                    <span className="font-semibold">$9.99/mo</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">AI Model</span>
                                    <span className="font-medium text-muted-foreground">
                                        {llmBillingMode === 'byok' ? 'Your own API key' : 'Platform AI credits'}
                                    </span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Your server balance</span>
                                    <span className={`font-semibold ${hasEnoughServerCredits ? '' : 'text-red-500'}`}>
                                        ${creditBalance.toFixed(2)}
                                    </span>
                                </div>
                                {llmBillingMode === 'credits' && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Your AI credits</span>
                                        <span className={`font-semibold ${hasEnoughLlmCredits ? '' : 'text-red-500'}`}>
                                            ${llmCredits.toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Warnings */}
                            {!hasEnoughServerCredits && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Insufficient server credits. You need at least ${serverPrice.toFixed(2)}.{' '}
                                        <Link href="/credits" className="underline font-medium">Add credits</Link>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {llmBillingMode === 'credits' && !hasEnoughLlmCredits && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        You need AI credits for your assistant to respond. {' '}
                                        <Link href="/credits" className="underline font-medium">Add AI credits</Link>
                                        {' '}or{' '}
                                        <Link href="/settings" className="underline font-medium">use your own API key</Link>.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {errorMessage && (
                                <Alert variant="destructive">
                                    <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                            )}

                            {/* Submit */}
                            <Button
                                type="submit"
                                disabled={!canDeploy}
                                className="w-full h-12 text-base"
                            >
                                <SparklesIcon className="mr-2 h-4 w-4" />
                                Create Assistant — ${serverPrice.toFixed(2)}/mo
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </div>

            {/* Tutorial Modal (reuses ChannelModal with video + instructions) */}
            <ChannelModal
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
                channel="telegram"
                initialToken={telegramToken}
                onConnect={(token) => {
                    setTelegramToken(token);
                }}
            />
        </>
    );
}

CreateAssistant.layout = (page: React.ReactNode) => <DashboardLayout title="Create Assistant">{page}</DashboardLayout>

export default CreateAssistant
