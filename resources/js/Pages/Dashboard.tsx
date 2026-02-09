import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Wallet, Plus, Sparkles, Settings, ArrowRight, Brain, Key, CreditCard } from 'lucide-react';

interface Assistant {
    id: number;
    name: string;
    ip: string | null;
    status: string;
    server_type: string;
    openclaw_installed: boolean;
    created_at: string;
}

interface Transaction {
    id: number;
    type: string;
    amount: string;
    description: string | null;
    created_at: string;
}

interface Props {
    assistants: Assistant[];
    creditBalance: number;
    recentTransactions: Transaction[];
    llmBillingMode: 'credits' | 'byok';
    hasLlmApiKey: boolean;
    llmCredits: number;
    serverTypes: Array<{
        name: string;
        label: string;
        description: string;
        monthly_rate: number;
    }>;
}

const statusConfig: Record<string, { label: string; color: string; description: string }> = {
    running: { label: 'Actif', color: 'bg-green-500', description: 'Votre assistant est prêt' },
    pending: { label: 'En attente', color: 'bg-yellow-500', description: 'Démarrage en cours...' },
    provisioning: { label: 'Configuration', color: 'bg-blue-500', description: 'Installation en cours...' },
    stopped: { label: 'Arrêté', color: 'bg-gray-500', description: 'Assistant en pause' },
    error: { label: 'Erreur', color: 'bg-red-500', description: 'Un problème est survenu' },
};

export default function Dashboard({ 
    assistants, 
    creditBalance, 
    llmBillingMode, 
    hasLlmApiKey,
    llmCredits 
}: Props) {
    const activeAssistants = assistants.filter(a => a.status === 'running');
    
    // User needs to setup LLM if using BYOK mode without API keys
    const needsLlmSetup = llmBillingMode === 'byok' && !hasLlmApiKey;
    
    // User needs credits if using credits mode and balance is low
    const needsLlmCredits = llmBillingMode === 'credits' && llmCredits < 1;
    const needsServerCredits = creditBalance < 5;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Bienvenue sur CloudClaw
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Gérez vos assistants IA en toute simplicité
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Tableau de bord" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Alert if LLM BYOK not configured */}
                    {needsLlmSetup && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Key className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-800">Configuration LLM requise</p>
                                    <p className="text-sm text-amber-600">
                                        Ajoutez une clé API (Anthropic ou OpenAI) pour utiliser le mode BYOK
                                    </p>
                                </div>
                            </div>
                            <Link href={route('settings.index')}>
                                <Button variant="outline" size="sm">
                                    Configurer
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Alert if low on server credits */}
                    {needsServerCredits && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Wallet className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="font-medium text-orange-800">Crédits serveur faibles</p>
                                    <p className="text-sm text-orange-600">
                                        Rechargez vos crédits pour continuer à utiliser vos assistants
                                    </p>
                                </div>
                            </div>
                            <Link href={route('credits.index')}>
                                <Button variant="outline" size="sm">
                                    Recharger
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-4 mb-8">
                        {/* Assistants Count */}
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Mes Assistants</CardTitle>
                                <Bot className="h-5 w-5 text-primary" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-primary">
                                    {activeAssistants.length}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {activeAssistants.length === 1 ? 'assistant actif' : 'assistants actifs'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Server Credits */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Crédits Serveur</CardTitle>
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">€{Number(creditBalance).toFixed(2)}</div>
                                <Link href={route('credits.index')}>
                                    <Button variant="link" className="p-0 h-auto text-sm text-primary">
                                        Recharger →
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* LLM Mode Card */}
                        {llmBillingMode === 'credits' ? (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Crédits LLM</CardTitle>
                                    <Brain className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">€{Number(llmCredits).toFixed(2)}</div>
                                    <Link href={route('credits.index')}>
                                        <Button variant="link" className="p-0 h-auto text-sm text-primary">
                                            Recharger →
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Mode LLM</CardTitle>
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                        BYOK
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {hasLlmApiKey 
                                            ? 'Vos propres clés API' 
                                            : 'Configuration requise'
                                        }
                                    </p>
                                    <Link href={route('settings.index')}>
                                        <Button variant="link" className="p-0 h-auto text-sm text-green-700">
                                            Gérer →
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Create Assistant */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Créer</CardTitle>
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <Link href={route('assistants.create')}>
                                    <Button className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nouvel assistant
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Assistants Section */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bot className="h-5 w-5" />
                                        Mes Assistants IA
                                    </CardTitle>
                                    <CardDescription>
                                        Vos assistants personnels dans le cloud
                                    </CardDescription>
                                </div>
                                <Link href={route('assistants.index')}>
                                    <Button variant="outline" size="sm">Voir tout</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {assistants.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <Bot className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-2">Pas encore d'assistant</h3>
                                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                        Créez votre premier assistant IA pour commencer. 
                                        Il sera prêt en quelques minutes !
                                    </p>
                                    <Link href={route('assistants.create')}>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Créer mon premier assistant
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {assistants.slice(0, 5).map((assistant) => {
                                        const status = statusConfig[assistant.status] || statusConfig.pending;
                                        return (
                                            <Link
                                                key={assistant.id}
                                                href={route('assistants.show', assistant.id)}
                                                className="block"
                                            >
                                                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-2 bg-primary/10 rounded-lg">
                                                            <Bot className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium">{assistant.name}</h4>
                                                            <p className="text-sm text-muted-foreground">
                                                                {status.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge 
                                                            variant="secondary"
                                                            className={`${status.color} text-white`}
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
