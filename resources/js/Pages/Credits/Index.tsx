import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
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
import { CreditCard, TrendingUp, TrendingDown, Wallet, CheckCircle2, AlertCircle, Sparkles, ArrowLeft } from 'lucide-react';
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

interface Flash {
    success?: string;
    error?: string;
    info?: string;
}

const typeLabels: Record<string, string> = {
    purchase: 'Achat',
    usage: 'Utilisation',
    refund: 'Remboursement',
    bonus: 'Bonus',
};

const typeIcons: Record<string, React.ReactNode> = {
    purchase: <TrendingUp className="h-4 w-4 text-green-500" />,
    usage: <TrendingDown className="h-4 w-4 text-red-500" />,
    refund: <TrendingUp className="h-4 w-4 text-blue-500" />,
    bonus: <Sparkles className="h-4 w-4 text-purple-500" />,
};

export default function CreditsIndex({ balance, transactions, packages, mockMode }: Props) {
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
            setMessage({ type: 'error', text: 'Le montant minimum est de 5€' });
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
                setMessage({ type: 'success', text: `${amount}€ de crédits ajoutés avec succès !` });
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
                    setMessage({ type: 'success', text: 'Paiement réussi ! Crédits ajoutés.' });
                    router.reload();
                } else {
                    setMessage({ type: 'error', text: 'Erreur de confirmation du paiement.' });
                }
            }
        } catch (error) {
            console.error('Purchase failed:', error);
            setMessage({ type: 'error', text: 'Une erreur est survenue. Veuillez réessayer.' });
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
                <div className="flex items-center gap-4">
                    <Link href={route('dashboard')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Wallet className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Mes Crédits
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Gérez votre solde et vos achats
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Crédits" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    {/* Flash Messages */}
                    {message && (
                        <Alert 
                            className={
                                message.type === 'success' ? 'border-green-500 bg-green-50' :
                                message.type === 'error' ? 'border-red-500 bg-red-50' :
                                'border-blue-500 bg-blue-50'
                            }
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
                        <Alert className="border-yellow-500 bg-yellow-50">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-700">
                                <strong>Mode développement :</strong> Les paiements sont simulés. Les crédits seront ajoutés instantanément sans frais réels.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Balance Card */}
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Solde actuel</CardTitle>
                                    <CardDescription>
                                        Utilisez vos crédits pour vos assistants IA
                                    </CardDescription>
                                </div>
                                <Wallet className="h-10 w-10 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-5xl font-bold text-primary">
                                €{Number(balance).toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Purchase Credits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Recharger mes crédits
                            </CardTitle>
                            <CardDescription>
                                Choisissez un montant ou entrez un montant personnalisé
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {packages.map((pkg) => (
                                    <button
                                        key={pkg.amount}
                                        onClick={() => {
                                            setSelectedPackage(pkg.amount);
                                            setCustomAmount('');
                                        }}
                                        className={`relative p-4 rounded-xl border-2 transition-all ${
                                            selectedPackage === pkg.amount
                                                ? 'border-primary bg-primary/5 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="text-xl font-bold">{pkg.label}</div>
                                        {pkg.bonus > 0 && (
                                            <Badge className="absolute -top-2 -right-2 text-xs bg-green-500">
                                                +{pkg.bonus}€
                                            </Badge>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-sm text-muted-foreground">Montant personnalisé (€)</label>
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
                                        placeholder="Minimum 5€"
                                        className="w-full mt-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={() => handlePurchase(purchaseAmount)}
                                disabled={loading || purchaseAmount < 5}
                                className="w-full"
                                size="lg"
                            >
                                <CreditCard className="mr-2 h-5 w-5" />
                                {loading ? 'Traitement...' : `Acheter ${purchaseAmount.toFixed(2)}€ de crédits`}
                            </Button>

                            <p className="text-sm text-muted-foreground text-center">
                                {mockMode 
                                    ? 'Mode développement : les crédits seront ajoutés instantanément.'
                                    : 'Paiement sécurisé par Stripe. Les crédits n\'expirent jamais.'
                                }
                            </p>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des transactions</CardTitle>
                            <CardDescription>
                                Vos mouvements de crédits
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Aucune transaction pour le moment</p>
                                    <p className="text-sm">Achetez des crédits pour commencer</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                            <TableHead className="text-right">Solde</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {typeIcons[tx.type]}
                                                        <span>{typeLabels[tx.type] || tx.type}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {tx.description || '-'}
                                                    {tx.server && (
                                                        <Link 
                                                            href={route('assistants.show', tx.server.id)}
                                                            className="text-primary hover:underline ml-1"
                                                        >
                                                            ({tx.server.name})
                                                        </Link>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleDateString('fr-FR')}
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
