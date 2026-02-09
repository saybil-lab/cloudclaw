import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Wallet, Plus, Sparkles, Settings, ArrowRight } from 'lucide-react';

interface Assistant {
    id: number;
    name: string;
    ip: string | null;
    status: string;
    server_type: string;
    openclaw_installed: boolean;
    billing_mode: string;
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
    billingMode: 'credits' | 'byok';
    hasByokConfigured: boolean;
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

export default function Dashboard({ assistants, creditBalance, billingMode, hasByokConfigured }: Props) {
    const activeAssistants = assistants.filter(a => a.status === 'running');
    const needsSetup = billingMode === 'byok' && !hasByokConfigured;

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
                    {/* Alert if BYOK not configured */}
                    {needsSetup && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Settings className="h-5 w-5 text-amber-600" />
                                <div>
                                    <p className="font-medium text-amber-800">Configuration requise</p>
                                    <p className="text-sm text-amber-600">
                                        Configurez votre compte Hetzner pour créer des assistants
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

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
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

                        {billingMode === 'credits' && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Solde Crédits</CardTitle>
                                    <Wallet className="h-5 w-5 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">€{Number(creditBalance).toFixed(2)}</div>
                                    <Link href={route('credits.index')}>
                                        <Button variant="link" className="p-0 h-auto text-sm text-primary">
                                            Recharger mes crédits →
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {billingMode === 'byok' && (
                            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Mode BYOK</CardTitle>
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                        Actif
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        Vous utilisez votre propre compte Hetzner
                                    </p>
                                    <Link href={route('settings.index')}>
                                        <Button variant="link" className="p-0 h-auto text-sm text-green-700">
                                            Gérer les paramètres →
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Créer un assistant</CardTitle>
                                <Plus className="h-5 w-5 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <Link href={route('assistants.create')}>
                                    <Button className="w-full" disabled={needsSetup}>
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
                                        <Button disabled={needsSetup}>
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
