import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { router, usePage, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Input } from '@/Components/ui/input';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    CreditCardIcon, TrendingUpIcon, TrendingDownIcon, WalletIcon, CheckCircle2Icon,
    AlertCircleIcon, SparklesIcon, BrainIcon, ServerIcon, KeyIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Transaction {
    id: number;
    type: string;
    amount: string;
    balance_after: string;
    description: string | null;
    created_at: string;
    server?: {
        id: number;
        name: string;
    } | null;
}

interface CreditPackage {
    amount: number;
    label: string;
    bonus: number;
}

interface Props {
    serverBalance: number;
    llmBalance: number;
    llmBillingMode: 'credits' | 'byok';
    transactions: Transaction[];
    packages: CreditPackage[];
    stripeKey?: string;
    mockMode?: boolean;
    hasActiveSubscription: boolean;
}

interface Flash {
    success?: string;
    error?: string;
    info?: string;
}

const typeLabels: Record<string, string> = {
    purchase: 'Server Purchase',
    llm_purchase: 'LLM Purchase',
    usage: 'Usage',
    refund: 'Refund',
    bonus: 'Bonus',
};

const typeIcons: Record<string, React.ReactNode> = {
    purchase: <TrendingUpIcon className="h-4 w-4 text-green-500" />,
    llm_purchase: <TrendingUpIcon className="h-4 w-4 text-purple-500" />,
    usage: <TrendingDownIcon className="h-4 w-4 text-red-500" />,
    refund: <TrendingUpIcon className="h-4 w-4 text-blue-500" />,
    bonus: <SparklesIcon className="h-4 w-4 text-purple-500" />,
};

function CreditsIndex({
    serverBalance,
    llmBalance,
    llmBillingMode,
    transactions,
    packages,
    mockMode,
    hasActiveSubscription
}: Props) {
    const { flash } = usePage().props as { flash?: Flash };
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [creditType, setCreditType] = useState<'server' | 'llm'>('server');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    if (!hasActiveSubscription) {
        return <SubscriptionCTA />;
    }

    useEffect(() => {
        if (flash?.success) {
            setMessage({ type: 'success', text: flash.success });
        } else if (flash?.error) {
            setMessage({ type: 'error', text: flash.error });
        } else if (flash?.info) {
            setMessage({ type: 'info', text: flash.info });
        }
    }, [flash]);

    const handlePurchase = async (amount: number) => {
        if (!amount || amount < 5) {
            setMessage({ type: 'error', text: 'Minimum amount is €5' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('/credits/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ amount, type: creditType }),
            });

            const data = await response.json();

            if (data.error) {
                setMessage({ type: 'error', text: data.error });
                return;
            }

            if (data.mock || data.success) {
                const label = creditType === 'llm' ? 'LLM credits' : 'server credits';
                setMessage({ type: 'success', text: `€${amount} ${label} added successfully!` });
                router.reload();
                return;
            }

            if (data.url) {
                window.location.href = data.url;
                return;
            }

        } catch (error) {
            console.error('Purchase failed:', error);
            setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
        } finally {
            setLoading(false);
            setSelectedPackage(null);
            setCustomAmount('');
        }
    };

    const purchaseAmount = selectedPackage || (customAmount ? parseFloat(customAmount) : 0);

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Credits</h1>
                    <p className="text-muted-foreground">
                        Manage your server and LLM credits
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Flash Messages */}
                {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                        {message.type === 'success' ? (
                            <CheckCircle2Icon className="h-4 w-4" />
                        ) : (
                            <AlertCircleIcon className="h-4 w-4" />
                        )}
                        <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                {/* Mock Mode Notice */}
                {mockMode && (
                    <Alert>
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Development mode:</strong> Payments are simulated. Credits will be added instantly without real charges.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Balance Cards */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Server Credits */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Server Credits</CardTitle>
                            <ServerIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">€{Number(serverBalance).toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                                For hosting your assistants
                            </p>
                        </CardContent>
                    </Card>

                    {/* LLM Credits */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {llmBillingMode === 'byok' ? 'BYOK Mode' : 'LLM Credits'}
                            </CardTitle>
                            {llmBillingMode === 'byok' ? (
                                <Badge variant="secondary" className="gap-1">
                                    <KeyIcon className="h-3 w-3" />
                                    Active
                                </Badge>
                            ) : (
                                <BrainIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                        </CardHeader>
                        <CardContent>
                            {llmBillingMode === 'byok' ? (
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Using your own API keys
                                    </p>
                                    <Link href="/settings">
                                        <Button variant="link" className="p-0 h-auto text-sm">
                                            Manage API keys →
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="text-2xl font-bold">€{Number(llmBalance).toFixed(2)}</div>
                                    <p className="text-xs text-muted-foreground">
                                        For AI features
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Purchase Credits */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCardIcon className="h-5 w-5 text-muted-foreground" />
                            Add Credits
                        </CardTitle>
                        <CardDescription>
                            Choose credit type and amount
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Credit Type Selection */}
                        <Tabs
                            value={creditType}
                            onValueChange={(value) => {
                                setCreditType(value as 'server' | 'llm');
                                setSelectedPackage(null);
                                setCustomAmount('');
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="server" className="gap-2">
                                    <ServerIcon className="h-4 w-4" />
                                    Server Credits
                                </TabsTrigger>
                                <TabsTrigger
                                    value="llm"
                                    className="gap-2"
                                    disabled={llmBillingMode === 'byok'}
                                >
                                    <BrainIcon className="h-4 w-4" />
                                    LLM Credits
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="server" className="space-y-4 mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Server credits are used to pay for monthly hosting of your assistants.
                                </p>
                            </TabsContent>

                            <TabsContent value="llm" className="space-y-4 mt-4">
                                {llmBillingMode === 'byok' ? (
                                    <Alert>
                                        <KeyIcon className="h-4 w-4" />
                                        <AlertDescription>
                                            You're in BYOK mode. You use your own API keys and don't need LLM credits.
                                            <Link href="/settings">
                                                <Button variant="link" className="p-0 h-auto">
                                                    Switch to Credits mode →
                                                </Button>
                                            </Link>
                                        </AlertDescription>
                                    </Alert>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        LLM credits are used for AI model calls (Claude, GPT, etc.).
                                    </p>
                                )}
                            </TabsContent>
                        </Tabs>

                        {/* Amount Selection */}
                        {!(creditType === 'llm' && llmBillingMode === 'byok') && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {packages.map((pkg) => (
                                        <button
                                            key={pkg.amount}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPackage(pkg.amount);
                                                setCustomAmount('');
                                            }}
                                            className={`relative p-4 rounded-lg border transition-all text-center ${
                                                selectedPackage === pkg.amount
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : 'border-border hover:border-muted-foreground/50'
                                            }`}
                                        >
                                            <div className="text-lg font-semibold">{pkg.label}</div>
                                            {pkg.bonus > 0 && (
                                                <Badge className="absolute -top-2 -right-2 text-xs" variant="default">
                                                    +€{pkg.bonus}
                                                </Badge>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Custom amount (€)</label>
                                    <Input
                                        type="number"
                                        min="5"
                                        max="1000"
                                        step="0.01"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setSelectedPackage(null);
                                        }}
                                        placeholder="Minimum €5"
                                    />
                                </div>

                                <Button
                                    onClick={() => handlePurchase(purchaseAmount)}
                                    disabled={loading || purchaseAmount < 5}
                                    className="w-full"
                                >
                                    {creditType === 'llm' ? (
                                        <BrainIcon className="mr-2 h-4 w-4" />
                                    ) : (
                                        <ServerIcon className="mr-2 h-4 w-4" />
                                    )}
                                    {loading ? 'Processing...' : `Buy €${purchaseAmount.toFixed(2)} ${creditType === 'llm' ? 'LLM' : 'server'} credits`}
                                </Button>

                                <p className="text-sm text-muted-foreground text-center">
                                    {mockMode
                                        ? 'Development mode: credits added instantly.'
                                        : 'Secure payment via Stripe. Credits never expire.'
                                    }
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <WalletIcon className="h-5 w-5 text-muted-foreground" />
                            Transaction History
                        </CardTitle>
                        <CardDescription>
                            Your credit activity
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <WalletIcon className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-sm text-muted-foreground">No transactions yet</p>
                                <p className="text-sm text-muted-foreground">Purchase credits to get started</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {typeIcons[tx.type] || typeIcons['purchase']}
                                                    <span className="text-sm">{typeLabels[tx.type] || tx.type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {tx.description || '-'}
                                                {tx.server && (
                                                    <Link
                                                        href={`/assistants/${tx.server.id}`}
                                                        className="text-primary hover:underline ml-1"
                                                    >
                                                        ({tx.server.name})
                                                    </Link>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className={`text-right font-medium text-sm ${
                                                Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {Number(tx.amount) >= 0 ? '+' : ''}€{Number(tx.amount).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-sm">
                                                €{Number(tx.balance_after).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

CreditsIndex.layout = (page: React.ReactNode) => <DashboardLayout title="Credits">{page}</DashboardLayout>

export default CreditsIndex;
