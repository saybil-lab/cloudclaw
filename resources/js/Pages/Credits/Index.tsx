import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { 
    CreditCard, TrendingUp, TrendingDown, Wallet, CheckCircle2, 
    AlertCircle, Sparkles, ArrowLeft, Brain, Server, Key 
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
}

interface Flash {
    success?: string;
    error?: string;
    info?: string;
}

const typeLabels: Record<string, string> = {
    purchase: 'Achat serveur',
    llm_purchase: 'Achat LLM',
    usage: 'Utilisation',
    refund: 'Remboursement',
    bonus: 'Bonus',
};

const typeIcons: Record<string, React.ReactNode> = {
    purchase: <TrendingUp className="h-4 w-4 text-green-500" />,
    llm_purchase: <TrendingUp className="h-4 w-4 text-purple-500" />,
    usage: <TrendingDown className="h-4 w-4 text-red-500" />,
    refund: <TrendingUp className="h-4 w-4 text-blue-500" />,
    bonus: <Sparkles className="h-4 w-4 text-purple-500" />,
};

export default function CreditsIndex({ 
    serverBalance, 
    llmBalance, 
    llmBillingMode,
    transactions, 
    packages, 
    mockMode 
}: Props) {
    const { flash } = usePage().props as { flash?: Flash };
    const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [creditType, setCreditType] = useState<'server' | 'llm'>('server');
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
                body: JSON.stringify({ amount, type: creditType }),
            });

            const data = await response.json();

            if (data.error) {
                setMessage({ type: 'error', text: data.error });
                return;
            }

            // Mock mode - credits added directly
            if (data.mock || data.success) {
                const label = creditType === 'llm' ? 'crédits LLM' : 'crédits serveur';
                setMessage({ type: 'success', text: `${amount}€ de ${label} ajoutés avec succès !` });
                router.reload();
                return;
            }

            // Real Stripe Checkout - redirect to Stripe
            if (data.url) {
                window.location.href = data.url;
                return;
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
                                Gérez vos crédits serveur et LLM
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

                    {/* Balance Cards */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Server Credits */}
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Server className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-lg">Crédits Serveur</CardTitle>
                                    </div>
                                </div>
                                <CardDescription className="text-blue-600">
                                    Pour l'hébergement de vos assistants
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-4xl font-bold text-blue-700">
                                    €{Number(serverBalance).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>

                        {/* LLM Credits */}
                        <Card className={`${
                            llmBillingMode === 'byok' 
                                ? 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'
                                : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'
                        }`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Brain className={`h-5 w-5 ${llmBillingMode === 'byok' ? 'text-green-600' : 'text-purple-600'}`} />
                                        <CardTitle className="text-lg">
                                            {llmBillingMode === 'byok' ? 'Mode BYOK' : 'Crédits LLM'}
                                        </CardTitle>
                                    </div>
                                    {llmBillingMode === 'byok' && (
                                        <Badge className="bg-green-600">
                                            <Key className="h-3 w-3 mr-1" />
                                            Actif
                                        </Badge>
                                    )}
                                </div>
                                <CardDescription className={llmBillingMode === 'byok' ? 'text-green-600' : 'text-purple-600'}>
                                    {llmBillingMode === 'byok' 
                                        ? 'Vous utilisez vos propres clés API'
                                        : 'Pour l\'intelligence artificielle'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {llmBillingMode === 'byok' ? (
                                    <div className="text-lg text-green-700">
                                        Pas besoin de crédits LLM
                                        <Link href={route('settings.index')}>
                                            <Button variant="link" className="p-0 h-auto text-sm text-green-700 block">
                                                Gérer mes clés API →
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-4xl font-bold text-purple-700">
                                        €{Number(llmBalance).toFixed(2)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Purchase Credits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Recharger mes crédits
                            </CardTitle>
                            <CardDescription>
                                Choisissez le type de crédit et un montant
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
                                        <Server className="h-4 w-4" />
                                        Crédits Serveur
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="llm" 
                                        className="gap-2"
                                        disabled={llmBillingMode === 'byok'}
                                    >
                                        <Brain className="h-4 w-4" />
                                        Crédits LLM
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="server" className="space-y-4 mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Les crédits serveur sont utilisés pour payer l'hébergement mensuel de vos assistants.
                                    </p>
                                </TabsContent>

                                <TabsContent value="llm" className="space-y-4 mt-4">
                                    {llmBillingMode === 'byok' ? (
                                        <Alert className="border-green-200 bg-green-50">
                                            <Key className="h-4 w-4 text-green-600" />
                                            <AlertDescription className="text-green-700">
                                                Vous êtes en mode BYOK. Vous utilisez vos propres clés API et n'avez pas besoin de crédits LLM.
                                                <Link href={route('settings.index')}>
                                                    <Button variant="link" className="p-0 h-auto text-green-700">
                                                        Passer en mode Crédits →
                                                    </Button>
                                                </Link>
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Les crédits LLM sont utilisés pour les appels aux modèles d'IA (Claude, GPT, etc.).
                                        </p>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {/* Amount Selection (only if not BYOK for LLM) */}
                            {!(creditType === 'llm' && llmBillingMode === 'byok') && (
                                <>
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
                                                        ? creditType === 'llm' 
                                                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                                                            : 'border-blue-500 bg-blue-50 shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="text-xl font-bold">{pkg.label}</div>
                                                {pkg.bonus > 0 && (
                                                    <Badge className={`absolute -top-2 -right-2 text-xs ${
                                                        creditType === 'llm' ? 'bg-purple-500' : 'bg-green-500'
                                                    }`}>
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
                                        className={`w-full ${creditType === 'llm' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                                        size="lg"
                                    >
                                        {creditType === 'llm' ? (
                                            <Brain className="mr-2 h-5 w-5" />
                                        ) : (
                                            <Server className="mr-2 h-5 w-5" />
                                        )}
                                        {loading ? 'Traitement...' : `Acheter ${purchaseAmount.toFixed(2)}€ de crédits ${creditType === 'llm' ? 'LLM' : 'serveur'}`}
                                    </Button>

                                    <p className="text-sm text-muted-foreground text-center">
                                        {mockMode 
                                            ? 'Mode développement : les crédits seront ajoutés instantanément.'
                                            : 'Paiement sécurisé par Stripe. Les crédits n\'expirent jamais.'
                                        }
                                    </p>
                                </>
                            )}
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
                                                        {typeIcons[tx.type] || typeIcons['purchase']}
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
