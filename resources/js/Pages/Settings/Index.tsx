import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Settings, CreditCard, Key, Check, AlertCircle, 
    ExternalLink, Wallet, HelpCircle, Trash2, Sparkles, Bot
} from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';

interface Props {
    llmBillingMode: 'credits' | 'byok';
    hasAnthropicKey: boolean;
    hasOpenaiKey: boolean;
    llmCredits: number;
    serverCredits: number;
}

interface Flash {
    success?: string;
    error?: string;
}

export default function SettingsIndex({ llmBillingMode, hasAnthropicKey, hasOpenaiKey, llmCredits, serverCredits }: Props) {
    const { flash } = usePage().props as { flash?: Flash };
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showAnthropicForm, setShowAnthropicForm] = useState(false);
    const [showOpenaiForm, setShowOpenaiForm] = useState(false);

    const billingForm = useForm({
        llm_billing_mode: llmBillingMode,
    });

    const anthropicForm = useForm({
        provider: 'anthropic',
        api_key: '',
    });

    const openaiForm = useForm({
        provider: 'openai',
        api_key: '',
    });

    useEffect(() => {
        if (flash?.success) {
            setMessage({ type: 'success', text: flash.success });
        } else if (flash?.error) {
            setMessage({ type: 'error', text: flash.error });
        }
    }, [flash]);

    const handleBillingModeChange = (mode: 'credits' | 'byok') => {
        if (mode === 'byok' && !hasAnthropicKey && !hasOpenaiKey) {
            setMessage({ type: 'error', text: 'Veuillez d\'abord configurer au moins une clé API.' });
            return;
        }
        billingForm.setData('llm_billing_mode', mode);
        billingForm.post(route('settings.llm-billing-mode'), {
            preserveScroll: true,
        });
    };

    const handleApiKeySubmit = (e: FormEvent, provider: 'anthropic' | 'openai') => {
        e.preventDefault();
        const form = provider === 'anthropic' ? anthropicForm : openaiForm;
        form.post(route('settings.api-key'), {
            preserveScroll: true,
            onSuccess: () => {
                if (provider === 'anthropic') {
                    setShowAnthropicForm(false);
                    anthropicForm.reset();
                } else {
                    setShowOpenaiForm(false);
                    openaiForm.reset();
                }
            },
        });
    };

    const handleRemoveKey = (provider: 'anthropic' | 'openai') => {
        if (confirm(`Voulez-vous vraiment supprimer votre clé API ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} ?`)) {
            router.delete(route('settings.api-key.delete'), {
                preserveScroll: true,
                data: { provider },
            });
        }
    };

    const hasAnyApiKey = hasAnthropicKey || hasOpenaiKey;

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
                            Gérez vos clés API et votre mode de facturation
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

                    {/* Credits Summary */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Bot className="h-4 w-4" />
                                    Crédits Serveur
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">€{serverCredits.toFixed(2)}</div>
                                <Link href={route('credits.index')}>
                                    <Button variant="link" className="p-0 h-auto text-sm">
                                        Recharger →
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {llmBillingMode === 'credits' && (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Sparkles className="h-4 w-4" />
                                        Crédits LLM
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">€{llmCredits.toFixed(2)}</div>
                                    <p className="text-sm text-muted-foreground">Pour l'utilisation de l'IA</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* LLM Billing Mode Selection */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Mode de facturation IA (LLM)
                            </CardTitle>
                            <CardDescription>
                                Choisissez comment vos assistants accèdent à l'intelligence artificielle
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
                                            <CreditCard className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Crédits CloudClaw</p>
                                            <p className="text-muted-foreground mt-1">
                                                Achetez des crédits LLM et nous gérons tout pour vous.
                                            </p>
                                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Pas besoin de créer de compte chez Anthropic/OpenAI
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Facturation unifiée et simple
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Support inclus
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
                                } ${!hasAnyApiKey ? 'opacity-60' : ''}`}
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
                                            </p>
                                            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Payez directement aux tarifs officiels
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Contrôle total sur vos limites d'usage
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                    Pas de frais CloudClaw pour l'IA
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                    {llmBillingMode === 'byok' && (
                                        <Badge className="bg-green-600">Actif</Badge>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Keys Configuration */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Clés API
                            </CardTitle>
                            <CardDescription>
                                Configurez vos clés API pour le mode BYOK
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Anthropic API Key */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                            <span className="text-orange-600 font-bold text-sm">A</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">Anthropic (Claude)</p>
                                            <p className="text-sm text-muted-foreground">
                                                {hasAnthropicKey ? 'Clé configurée ✓' : 'Non configurée'}
                                            </p>
                                        </div>
                                    </div>
                                    {hasAnthropicKey ? (
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700">Actif</Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleRemoveKey('anthropic')}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setShowAnthropicForm(!showAnthropicForm)}
                                        >
                                            {showAnthropicForm ? 'Annuler' : 'Ajouter'}
                                        </Button>
                                    )}
                                </div>

                                {showAnthropicForm && (
                                    <form onSubmit={(e) => handleApiKeySubmit(e, 'anthropic')} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="space-y-2">
                                            <Label htmlFor="anthropic_key">Clé API Anthropic</Label>
                                            <Input
                                                id="anthropic_key"
                                                type="password"
                                                value={anthropicForm.data.api_key}
                                                onChange={(e) => anthropicForm.setData('api_key', e.target.value)}
                                                placeholder="sk-ant-..."
                                                className="font-mono"
                                            />
                                            {anthropicForm.errors.api_key && (
                                                <p className="text-sm text-red-500">{anthropicForm.errors.api_key}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={anthropicForm.processing || !anthropicForm.data.api_key}>
                                                {anthropicForm.processing ? 'Validation...' : 'Enregistrer'}
                                            </Button>
                                            <a 
                                                href="https://console.anthropic.com/settings/keys" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                <Button type="button" variant="link">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Obtenir une clé
                                                </Button>
                                            </a>
                                        </div>
                                    </form>
                                )}
                            </div>

                            <hr />

                            {/* OpenAI API Key */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                            <span className="text-emerald-600 font-bold text-sm">O</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">OpenAI (GPT)</p>
                                            <p className="text-sm text-muted-foreground">
                                                {hasOpenaiKey ? 'Clé configurée ✓' : 'Non configurée'}
                                            </p>
                                        </div>
                                    </div>
                                    {hasOpenaiKey ? (
                                        <div className="flex gap-2">
                                            <Badge variant="outline" className="bg-green-50 text-green-700">Actif</Badge>
                                            <Button 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={() => handleRemoveKey('openai')}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setShowOpenaiForm(!showOpenaiForm)}
                                        >
                                            {showOpenaiForm ? 'Annuler' : 'Ajouter'}
                                        </Button>
                                    )}
                                </div>

                                {showOpenaiForm && (
                                    <form onSubmit={(e) => handleApiKeySubmit(e, 'openai')} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="space-y-2">
                                            <Label htmlFor="openai_key">Clé API OpenAI</Label>
                                            <Input
                                                id="openai_key"
                                                type="password"
                                                value={openaiForm.data.api_key}
                                                onChange={(e) => openaiForm.setData('api_key', e.target.value)}
                                                placeholder="sk-..."
                                                className="font-mono"
                                            />
                                            {openaiForm.errors.api_key && (
                                                <p className="text-sm text-red-500">{openaiForm.errors.api_key}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={openaiForm.processing || !openaiForm.data.api_key}>
                                                {openaiForm.processing ? 'Validation...' : 'Enregistrer'}
                                            </Button>
                                            <a 
                                                href="https://platform.openai.com/api-keys" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                <Button type="button" variant="link">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Obtenir une clé
                                                </Button>
                                            </a>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </CardContent>
                    </Card>

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
                                        <strong> BYOK</strong> si vous avez déjà un compte Anthropic/OpenAI et voulez utiliser vos propres tarifs.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-medium">Mes clés sont-elles sécurisées ?</p>
                                    <p className="text-muted-foreground">
                                        Oui, vos clés API sont chiffrées avant d'être stockées et ne sont jamais visibles en clair.
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
