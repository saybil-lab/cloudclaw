import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { CreditCard, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useState } from 'react';

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
}

const typeIcons: Record<string, React.ReactNode> = {
    purchase: <TrendingUp className="h-4 w-4 text-green-500" />,
    usage: <TrendingDown className="h-4 w-4 text-red-500" />,
    refund: <TrendingUp className="h-4 w-4 text-blue-500" />,
    bonus: <TrendingUp className="h-4 w-4 text-purple-500" />,
};

export default function CreditsIndex({ balance, transactions, packages }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState('');

    const handlePurchase = async (amount: number) => {
        setLoading(true);
        try {
            // In mock mode, this will just add credits directly
            const response = await fetch(route('credits.purchase'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();

            if (data.clientSecret) {
                // In a real implementation, you'd open Stripe checkout here
                // For mock mode, we'll just confirm the payment
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
                    router.reload();
                }
            }
        } catch (error) {
            console.error('Purchase failed:', error);
        } finally {
            setLoading(false);
            setSelectedPackage(null);
        }
    };

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
                                        onClick={() => setSelectedPackage(pkg.amount)}
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
                                        placeholder="Enter amount"
                                        className="w-full mt-1 px-3 py-2 border rounded-md"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={() => handlePurchase(selectedPackage || parseFloat(customAmount))}
                                disabled={loading || (!selectedPackage && !customAmount)}
                                className="w-full"
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                {loading ? 'Processing...' : `Purchase €${selectedPackage || customAmount || '0'}`}
                            </Button>

                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Payments are processed securely via Stripe. Credits never expire.
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
