import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CreditCard, TrendingUp, TrendingDown, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
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
    balance: number;
    transactions: Transaction[];
    packages: CreditPackage[];
    stripeKey?: string;
    mockMode?: boolean;
}

import { Flash } from '@/types';

const typeIcons: Record<string, React.ReactNode> = {
    purchase: <TrendingUp className="h-4 w-4 text-green-500" />,
    usage: <TrendingDown className="h-4 w-4 text-red-500" />,
    refund: <TrendingUp className="h-4 w-4 text-blue-500" />,
    bonus: <TrendingUp className="h-4 w-4 text-purple-500" />,
};

export default function CreditsIndex({ balance, transactions, packages, stripeKey, mockMode }: Props) {
    const { flash } = usePage().props as { flash?: Flash };
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
            setMessage({ type: 'error', text: 'Minimum purchase amount is €5' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch(route('credits.purchase'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (data.error) {
                setMessage({ type: 'error', text: data.error });
                return;
            }

            // Mock mode - credits added directly
            if (data.mock || data.success) {
                setMessage({ type: 'success', text: `€${amount} credits added successfully!` });
                router.reload();
                return;
            }

            // Real Stripe Checkout - redirect to Stripe
            if (data.url) {
                window.location.href = data.url;
                return;
            }

            // Legacy payment intent flow (fallback)
            if (data.clientSecret) {
                const confirmResponse = await fetch(route('credits.confirm'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ 
                        payment_intent_id: data.clientSecret,
                        amount 
                    }),
                });

                if (confirmResponse.ok) {
                    setMessage({ type: 'success', text: 'Payment successful! Credits added.' });
                    router.reload();
                } else {
                    setMessage({ type: 'error', text: 'Payment confirmation failed.' });
                }
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
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Credits
                </h2>
            }
        >
            <Head title="Credits" />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    {/* Flash Messages */}
                    {message && (
                        <Alert 
                            className={`mb-6 ${
                                message.type === 'success' ? 'border-green-500 bg-green-50' :
                                message.type === 'error' ? 'border-red-500 bg-red-50' :
                                'border-blue-500 bg-blue-50'
                            }`}
                        >
                            {message.type === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription className={
                                message.type === 'success' ? 'text-green-700' :
                                message.type === 'error' ? 'text-red-700' :
                                'text-blue-700'
                            }>
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Mock Mode Notice */}
                    {mockMode && (
                        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-700">
                                <strong>Development Mode:</strong> Payments are simulated. Credits will be added instantly without real charges.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Balance Card */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Credit Balance</CardTitle>
                                    <CardDescription>
                                        Use credits to pay for server usage
                                    </CardDescription>
                                </div>
                                <Wallet className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold">
                                €{Number(balance).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Credits */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Add Credits</CardTitle>
                            <CardDescription>
                                Choose a package or enter a custom amount
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.amount}
                                        onClick={() => {
                                            setSelectedPackage(pkg.amount);
                                            setCustomAmount('');
                                        }}
                                        className={`relative p-4 rounded-lg border-2 transition-colors ${
                                            selectedPackage === pkg.amount
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="text-lg font-bold">{pkg.label}</div>
                                        {pkg.bonus > 0 && (
                                            <Badge className="absolute -top-2 -right-2 text-xs">
                                                +€{pkg.bonus} bonus
                                            </Badge>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="flex-1">
                                    <label className="text-sm text-muted-foreground">Custom amount (€)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="1000"
                                        step="0.01"
                                        value={customAmount}
                                        onChange={(e) => {
                                            setCustomAmount(e.target.value);
                                            setSelectedPackage(null);
                                        }}
                                        placeholder="Enter amount (min €5)"
                                        className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={() => handlePurchase(purchaseAmount)}
                                disabled={loading || purchaseAmount < 5}
                                className="w-full"
                                size="lg"
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                {loading ? 'Processing...' : `Purchase €${purchaseAmount.toFixed(2)}`}
                            </Button>

                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                {mockMode 
                                    ? 'Development mode: Credits will be added instantly.'
                                    : 'Payments are processed securely via Stripe. Credits never expire.'
                                }
                            </p>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                            <CardDescription>
                                Your credit activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No transactions yet
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
                                                        {typeIcons[tx.type]}
                                                        <span className="capitalize">{tx.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {tx.description || '-'}
                                                    {tx.server && (
                                                        <span className="text-muted-foreground ml-1">
                                                            ({tx.server.name})
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className={`text-right font-medium ${
                                                    Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                    {Number(tx.amount) >= 0 ? '+' : ''}€{Number(tx.amount).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
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
            </div>
        </AuthenticatedLayout>
    );
}
