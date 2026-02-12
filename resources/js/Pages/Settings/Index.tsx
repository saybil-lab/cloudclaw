import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useForm, usePage, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import {
    Settings, CreditCard, Key, Check, AlertCircle,
    ExternalLink, Wallet, HelpCircle, Trash2,
    Brain, Sparkles, Zap
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';

interface Props {
    llmBillingMode: 'credits' | 'byok';
    hasAnthropicKey: boolean;
    hasOpenaiKey: boolean;
    llmCredits: number;
    serverCredits: number;
    hasActiveSubscription: boolean;
}

interface Flash {
    success?: string;
    error?: string;
}

function SettingsIndex({
    llmBillingMode,
    hasAnthropicKey,
    hasOpenaiKey,
    llmCredits,
    serverCredits,
    hasActiveSubscription
}: Props) {
    const { flash } = usePage().props as { flash?: Flash };

    if (!hasActiveSubscription) {
        return <SubscriptionCTA />;
    }
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showApiKeyForm, setShowApiKeyForm] = useState<'anthropic' | 'openai' | null>(null);

    const billingForm = useForm({
        llm_billing_mode: llmBillingMode,
    });

    const apiKeyForm = useForm({
        provider: 'anthropic' as 'anthropic' | 'openai',
        api_key: '',
    });

    useEffect(() => {
        if (flash?.success) {
            setMessage({ type: 'success', text: flash.success });
        } else if (flash?.error) {
            setMessage({ type: 'error', text: flash.error });
        }
    }, [flash]);

    const hasAnyApiKey = hasAnthropicKey || hasOpenaiKey;

    const handleBillingModeChange = (mode: 'credits' | 'byok') => {
        if (mode === 'byok' && !hasAnyApiKey) {
            setShowApiKeyForm('anthropic');
            return;
        }
        billingForm.setData('llm_billing_mode', mode);
        billingForm.post(route('settings.llm-billing-mode'), {
            preserveScroll: true,
        });
    };

    const handleApiKeySubmit = (e: FormEvent) => {
        e.preventDefault();
        apiKeyForm.post(route('settings.api-key'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowApiKeyForm(null);
                apiKeyForm.reset();
            },
        });
    };

    const handleRemoveApiKey = (provider: 'anthropic' | 'openai') => {
        const providerName = provider === 'anthropic' ? 'Anthropic' : 'OpenAI';
        if (confirm(`Voulez-vous vraiment supprimer votre clé API ${providerName} ?`)) {
            router.delete(route('settings.api-key.delete'), {
                data: { provider },
                preserveScroll: true,
            });
        }
    };

    const openApiKeyForm = (provider: 'anthropic' | 'openai') => {
        apiKeyForm.setData('provider', provider);
        apiKeyForm.setData('api_key', '');
        setShowApiKeyForm(provider);
    };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">
                        Configure your LLM APIs and billing mode
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-3xl space-y-6">
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

                    {/* Info Card about Pricing Model */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-blue-800">
                                <Sparkles className="h-5 w-5" />
                                Comment ça marche ?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-blue-700 space-y-2">
                            <p><strong>Serveur (Hébergement)</strong> : Abonnement mensuel fixe. CloudClaw gère tout pour vous.</p>
                            <p><strong>LLM (Intelligence Artificielle)</strong> : Choisissez entre utiliser vos propres clés API (BYOK) ou acheter des crédits LLM.</p>
                        </CardContent>
                    </Card>

                    {/* LLM Billing Mode Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="h-5 w-5" />
                                Mode de facturation LLM
                            </CardTitle>
                            <CardDescription>
                                Comment souhaitez-vous payer l'utilisation des modèles IA (Claude, GPT, etc.) ?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Credits Mode */}
                            <div
                                className={`relative flex cursor-pointer rounded-xl border-2 p-5 transition-all ${
                                    llmBillingMode === 'credits'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleBillingModeChange('credits')}
                            >
                                <div className="flex w-full items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${
                                            llmBillingMode === 'credits' ? 'bg-primary text-white' : 'bg-gray-100'
                                        }`}>
                                            <Wallet className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Crédits LLM CloudClaw</p>
                                            <p className="text-muted-foreground mt-1">
                                                Achetez des crédits et nous gérons les appels API pour vous.
                                                Simple, sans configuration.
                                            </p>
                                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Pas de compte API à créer
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Paiement simple par carte
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Accès à tous les modèles
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    {llmBillingMode === 'credits' && (
                                        <Badge className="bg-primary">Actif</Badge>
                                    )}
                                </div>
                            </div>

                            {/* BYOK Mode */}
                            <div
                                className={`relative flex cursor-pointer rounded-xl border-2 p-5 transition-all ${
                                    llmBillingMode === 'byok'
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleBillingModeChange('byok')}
                            >
                                <div className="flex w-full items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-full ${
                                            llmBillingMode === 'byok' ? 'bg-green-600 text-white' : 'bg-gray-100'
                                        }`}>
                                            <Key className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">
                                                BYOK - Vos propres clés API
                                            </p>
                                            <p className="text-muted-foreground mt-1">
                                                Utilisez vos propres clés API Anthropic ou OpenAI.
                                                Vous payez directement les fournisseurs.
                                            </p>
                                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Prix API directs (potentiellement moins cher)
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Contrôle total sur vos limites
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Pas de frais LLM CloudClaw
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    {llmBillingMode === 'byok' && (
                                        <Badge className="bg-green-600">Actif</Badge>
                                    )}
                                </div>
                            </div>

                            {/* Current LLM balance info for credits mode */}
                            {llmBillingMode === 'credits' && (
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium">Crédits LLM disponibles</p>
                                        <p className="text-2xl font-bold text-primary">€{Number(llmCredits).toFixed(2)}</p>
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

                    {/* API Keys Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Clés API LLM
                            </CardTitle>
                            <CardDescription>
                                {llmBillingMode === 'byok' 
                                    ? 'Configurez au moins une clé API pour utiliser le mode BYOK'
                                    : 'Optionnel : configurez vos clés pour passer en mode BYOK'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Anthropic API Key */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 rounded-lg">
                                            <Zap className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Anthropic (Claude)</p>
                                            <p className="text-sm text-muted-foreground">
                                                Claude 3.5 Sonnet, Opus, Haiku
                                            </p>
                                        </div>
                                    </div>
                                    {hasAnthropicKey ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <Check className="h-3 w-3 mr-1" />
                                                Configurée
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleRemoveApiKey('anthropic')}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => openApiKeyForm('anthropic')}
                                        >
                                            <Key className="mr-2 h-4 w-4" />
                                            Ajouter
                                        </Button>
                                    )}
                                </div>
                                
                                {showApiKeyForm === 'anthropic' && (
                                    <form onSubmit={handleApiKeySubmit} className="space-y-3 pt-3 border-t">
                                        <div className="space-y-2">
                                            <Label htmlFor="anthropic_api_key">Clé API Anthropic</Label>
                                            <Input
                                                id="anthropic_api_key"
                                                type="password"
                                                value={apiKeyForm.data.api_key}
                                                onChange={(e) => apiKeyForm.setData('api_key', e.target.value)}
                                                placeholder="sk-ant-..."
                                                className="font-mono"
                                            />
                                            {apiKeyForm.errors.api_key && (
                                                <p className="text-sm text-red-500">{apiKeyForm.errors.api_key}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                onClick={() => {
                                                    setShowApiKeyForm(null);
                                                    apiKeyForm.reset();
                                                }}
                                            >
                                                Annuler
                                            </Button>
                                            <Button 
                                                type="submit"
                                                disabled={apiKeyForm.processing || !apiKeyForm.data.api_key}
                                            >
                                                {apiKeyForm.processing ? 'Validation...' : 'Valider'}
                                            </Button>
                                        </div>
                                        <a 
                                            href="https://console.anthropic.com/account/keys" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Obtenir une clé API Anthropic
                                        </a>
                                    </form>
                                )}
                            </div>

                            {/* OpenAI API Key */}
                            <div className="p-4 border rounded-lg space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-100 rounded-lg">
                                            <Brain className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">OpenAI (GPT)</p>
                                            <p className="text-sm text-muted-foreground">
                                                GPT-4o, GPT-4 Turbo, GPT-3.5
                                            </p>
                                        </div>
                                    </div>
                                    {hasOpenaiKey ? (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <Check className="h-3 w-3 mr-1" />
                                                Configurée
                                            </Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleRemoveApiKey('openai')}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => openApiKeyForm('openai')}
                                        >
                                            <Key className="mr-2 h-4 w-4" />
                                            Ajouter
                                        </Button>
                                    )}
                                </div>
                                
                                {showApiKeyForm === 'openai' && (
                                    <form onSubmit={handleApiKeySubmit} className="space-y-3 pt-3 border-t">
                                        <div className="space-y-2">
                                            <Label htmlFor="openai_api_key">Clé API OpenAI</Label>
                                            <Input
                                                id="openai_api_key"
                                                type="password"
                                                value={apiKeyForm.data.api_key}
                                                onChange={(e) => apiKeyForm.setData('api_key', e.target.value)}
                                                placeholder="sk-..."
                                                className="font-mono"
                                            />
                                            {apiKeyForm.errors.api_key && (
                                                <p className="text-sm text-red-500">{apiKeyForm.errors.api_key}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                type="button" 
                                                variant="outline"
                                                onClick={() => {
                                                    setShowApiKeyForm(null);
                                                    apiKeyForm.reset();
                                                }}
                                            >
                                                Annuler
                                            </Button>
                                            <Button 
                                                type="submit"
                                                disabled={apiKeyForm.processing || !apiKeyForm.data.api_key}
                                            >
                                                {apiKeyForm.processing ? 'Validation...' : 'Valider'}
                                            </Button>
                                        </div>
                                        <a 
                                            href="https://platform.openai.com/api-keys" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Obtenir une clé API OpenAI
                                        </a>
                                    </form>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Server Credits Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Crédits Serveur
                            </CardTitle>
                            <CardDescription>
                                Pour payer l'hébergement de vos assistants
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">Solde actuel</p>
                                    <p className="text-2xl font-bold">€{Number(serverCredits).toFixed(2)}</p>
                                </div>
                                <Link href={route('credits.index')}>
                                    <Button variant="outline">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Gérer
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Help Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <HelpCircle className="h-5 w-5" />
                                Questions fréquentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="font-medium">Quelle est la différence entre crédits serveur et crédits LLM ?</p>
                                    <p className="text-muted-foreground">
                                        Les <strong>crédits serveur</strong> paient l'hébergement (le serveur qui fait tourner votre assistant).
                                        Les <strong>crédits LLM</strong> paient l'intelligence artificielle (Claude, GPT, etc.).
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">Que se passe-t-il si j'ai mes propres clés API ?</p>
                                    <p className="text-muted-foreground">
                                        En mode BYOK, vous utilisez vos propres clés API et payez directement Anthropic/OpenAI.
                                        Vous n'avez pas besoin de crédits LLM CloudClaw.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">Puis-je changer de mode ?</p>
                                    <p className="text-muted-foreground">
                                        Oui, à tout moment. Vos clés API restent enregistrées même si vous passez en mode crédits.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
        </>
    );
}

SettingsIndex.layout = (page: React.ReactNode) => <DashboardLayout title="Settings">{page}</DashboardLayout>

export default SettingsIndex;
