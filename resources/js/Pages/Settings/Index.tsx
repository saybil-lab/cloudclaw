import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Settings, CreditCard, Key, Check, AlertCircle, 
    ExternalLink, Wallet, Shield, HelpCircle, Trash2
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';

interface Props {
    billingMode: 'credits' | 'byok';
    hasHetznerToken: boolean;
    creditBalance: number;
}

interface Flash {
    success?: string;
    error?: string;
}

export default function SettingsIndex({ billingMode, hasHetznerToken, creditBalance }: Props) {
    const { flash } = usePage().props as { flash?: Flash };
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showTokenForm, setShowTokenForm] = useState(false);

    const billingForm = useForm({
        billing_mode: billingMode,
    });

    const tokenForm = useForm({
        hetzner_token: '',
    });

    useEffect(() => {
        if (flash?.success) {
            setMessage({ type: 'success', text: flash.success });
        } else if (flash?.error) {
            setMessage({ type: 'error', text: flash.error });
        }
    }, [flash]);

    const handleBillingModeChange = (mode: 'credits' | 'byok') => {
        if (mode === 'byok' && !hasHetznerToken) {
            setShowTokenForm(true);
            return;
        }
        billingForm.setData('billing_mode', mode);
        billingForm.post(route('settings.billing-mode'), {
            preserveScroll: true,
        });
    };

    const handleTokenSubmit = (e: FormEvent) => {
        e.preventDefault();
        tokenForm.post(route('settings.hetzner-token'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowTokenForm(false);
                tokenForm.reset();
            },
        });
    };

    const handleRemoveToken = () => {
        if (confirm('Voulez-vous vraiment supprimer votre token Hetzner ? Vous passerez automatiquement en mode Crédits.')) {
            tokenForm.delete(route('settings.hetzner-token.delete'), {
                preserveScroll: true,
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Settings className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Paramètres
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gérez votre mode de facturation
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Paramètres" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8 space-y-6">
                    {/* Flash Messages */}
                    {message && (
                        <Alert className={message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                            {message.type === 'success' ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Billing Mode Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                Mode de facturation
                            </CardTitle>
                            <CardDescription>
                                Choisissez comment vous souhaitez payer vos assistants
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Credits Mode */}
                            <div
                                className={`relative flex cursor-pointer rounded-xl border-2 p-5 transition-all ${
                                    billingMode === 'credits'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleBillingModeChange('credits')}
                            >
                                <div className="flex w-full items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${
                                            billingMode === 'credits' ? 'bg-primary text-white' : 'bg-gray-100'
                                        }`}>
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Crédits CloudClaw</p>
                                            <p className="text-muted-foreground mt-1">
                                                Achetez des crédits et nous gérons tout pour vous. 
                                                Simple et sans prise de tête.
                                            </p>
                                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Paiement simple par carte
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Support inclus
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Pas de compte Hetzner à créer
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    {billingMode === 'credits' && (
                                        <Badge className="bg-primary">Actif</Badge>
                                    )}
                                </div>
                            </div>

                            {/* BYOK Mode */}
                            <div
                                className={`relative flex cursor-pointer rounded-xl border-2 p-5 transition-all ${
                                    billingMode === 'byok'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleBillingModeChange('byok')}
                            >
                                <div className="flex w-full items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${
                                            billingMode === 'byok' ? 'bg-green-600 text-white' : 'bg-gray-100'
                                        }`}>
                                            <Key className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">
                                                BYOK - Votre compte Hetzner
                                            </p>
                                            <p className="text-muted-foreground mt-1">
                                                Utilisez votre propre compte Hetzner. 
                                                Vous payez directement Hetzner aux prix coûtant.
                                            </p>
                                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Prix Hetzner direct (moins cher)
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Contrôle total sur votre infrastructure
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Gratuit côté CloudClaw
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    {billingMode === 'byok' && (
                                        <Badge className="bg-green-600">Actif</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Current balance info for credits mode */}
                            {billingMode === 'credits' && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">Solde actuel</p>
                                        <p className="text-2xl font-bold text-primary">€{Number(creditBalance).toFixed(2)}</p>
                                    </div>
                                    <Link href={route('credits.index')}>
                                        <Button>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Recharger
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hetzner Token Configuration */}
                    {(showTokenForm || billingMode === 'byok') && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    Token Hetzner API
                                </CardTitle>
                                <CardDescription>
                                    Votre token est chiffré et stocké de manière sécurisée
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {hasHetznerToken ? (
                                    <div className="space-y-4">
                                        <Alert className="border-green-200 bg-green-50">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <AlertDescription className="text-green-700">
                                                Token Hetzner configuré et validé
                                            </AlertDescription>
                                        </Alert>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium">Token actif</p>
                                                <p className="text-sm text-muted-foreground">
                                                    ••••••••••••••••
                                                </p>
                                            </div>
                                            <Button variant="destructive" size="sm" onClick={handleRemoveToken}>
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Supprimer
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleTokenSubmit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hetzner_token">Token API Hetzner</Label>
                                            <Input
                                                id="hetzner_token"
                                                type="password"
                                                value={tokenForm.data.hetzner_token}
                                                onChange={(e) => tokenForm.setData('hetzner_token', e.target.value)}
                                                placeholder="Entrez votre token API Hetzner"
                                                className="font-mono"
                                            />
                                            {tokenForm.errors.hetzner_token && (
                                                <p className="text-sm text-red-500">{tokenForm.errors.hetzner_token}</p>
                                            )}
                                        </div>

                                        <Alert>
                                            <HelpCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <p className="mb-2">Pour obtenir votre token Hetzner :</p>
                                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                                    <li>Connectez-vous à <a href="https://console.hetzner.cloud" target="_blank" rel="noopener noreferrer" className="text-primary underline">console.hetzner.cloud</a></li>
                                                    <li>Créez un projet ou sélectionnez-en un</li>
                                                    <li>Allez dans Security → API Tokens</li>
                                                    <li>Générez un token avec les permissions "Read & Write"</li>
                                                </ol>
                                            </AlertDescription>
                                        </Alert>

                                        <div className="flex gap-3">
                                            {showTokenForm && billingMode !== 'byok' && (
                                                <Button 
                                                    type="button" 
                                                    variant="outline" 
                                                    onClick={() => setShowTokenForm(false)}
                                                    className="flex-1"
                                                >
                                                    Annuler
                                                </Button>
                                            )}
                                            <Button 
                                                type="submit" 
                                                disabled={tokenForm.processing || !tokenForm.data.hetzner_token}
                                                className="flex-1"
                                            >
                                                {tokenForm.processing ? 'Validation...' : 'Valider le token'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                <a 
                                    href="https://console.hetzner.cloud" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                    Ouvrir la console Hetzner
                                </a>
                            </CardContent>
                        </Card>
                    )}

                    {/* Help Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <HelpCircle className="h-5 w-5" />
                                Besoin d'aide ?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="font-medium">Quelle option choisir ?</p>
                                    <p className="text-muted-foreground">
                                        <strong>Crédits CloudClaw</strong> si vous voulez la simplicité. 
                                        <strong>BYOK</strong> si vous voulez économiser et avez un compte Hetzner.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">Puis-je changer de mode ?</p>
                                    <p className="text-muted-foreground">
                                        Oui, à tout moment. Les assistants existants gardent leur mode de facturation initial.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
