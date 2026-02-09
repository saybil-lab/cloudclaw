import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Plus, ArrowRight, Monitor, Power } from 'lucide-react';

interface Assistant {
    id: number;
    name: string;
    ip: string | null;
    status: string;
    server_type: string;
    billing_mode: string;
    openclaw_installed: boolean;
    provision_status: string;
    created_at: string;
}

interface ServerType {
    name: string;
    label: string;
    description: string;
    monthly_rate: number;
}

interface Props {
    assistants: Assistant[];
    serverTypes: ServerType[];
    billingMode: 'credits' | 'byok';
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    running: { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100' },
    pending: { label: 'En attente', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    provisioning: { label: 'Configuration', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    stopped: { label: 'Arrêté', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    error: { label: 'Erreur', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const getServerTypeLabel = (serverTypes: ServerType[], name: string): string => {
    const type = serverTypes.find(t => t.name === name);
    return type?.label || name;
};

export default function AssistantsIndex({ assistants, serverTypes, billingMode }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Bot className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                Mes Assistants
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {assistants.length} assistant{assistants.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Link href={route('assistants.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nouvel assistant
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Mes Assistants" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {assistants.length === 0 ? (
                        <Card>
                            <CardContent className="py-16">
                                <div className="text-center">
                                    <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                        <Bot className="h-10 w-10 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">
                                        Créez votre premier assistant
                                    </h3>
                                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                                        Un assistant IA personnel dans le cloud, prêt en quelques minutes.
                                        Accédez à votre bureau virtuel depuis n'importe où.
                                    </p>
                                    <Link href={route('assistants.create')}>
                                        <Button size="lg">
                                            <Plus className="mr-2 h-5 w-5" />
                                            Créer mon assistant
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {assistants.map((assistant) => {
                                const status = statusConfig[assistant.status] || statusConfig.pending;
                                const isReady = assistant.provision_status === 'ready' && assistant.status === 'running';
                                
                                return (
                                    <Card key={assistant.id} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-primary/10 rounded-lg">
                                                        <Bot className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{assistant.name}</CardTitle>
                                                        <CardDescription>
                                                            {getServerTypeLabel(serverTypes, assistant.server_type)}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <Badge className={`${status.bgColor} ${status.color} border-0`}>
                                                    {status.label}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {/* Status indicator */}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Power className={`h-4 w-4 ${assistant.status === 'running' ? 'text-green-500' : 'text-gray-400'}`} />
                                                    <span className="text-muted-foreground">
                                                        {assistant.status === 'running' ? 'En ligne' : 
                                                         assistant.status === 'stopped' ? 'Hors ligne' :
                                                         assistant.status === 'provisioning' ? 'Installation...' :
                                                         'En attente'}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-2">
                                                    {isReady && (
                                                        <Link href={route('assistants.show', assistant.id)} className="flex-1">
                                                            <Button className="w-full" size="sm">
                                                                <Monitor className="mr-2 h-4 w-4" />
                                                                Accéder
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    <Link href={route('assistants.show', assistant.id)} className={isReady ? '' : 'flex-1'}>
                                                        <Button variant="outline" className="w-full" size="sm">
                                                            {isReady ? (
                                                                <ArrowRight className="h-4 w-4" />
                                                            ) : (
                                                                <>
                                                                    Voir détails
                                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                                </>
                                                            )}
                                                        </Button>
                                                    </Link>
                                                </div>

                                                {/* Billing badge */}
                                                {assistant.billing_mode === 'byok' && (
                                                    <div className="pt-2 border-t">
                                                        <Badge variant="outline" className="text-xs">
                                                            Votre compte Hetzner
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}

                            {/* Add new card */}
                            <Link href={route('assistants.create')}>
                                <Card className="h-full border-dashed hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                                    <CardContent className="h-full flex flex-col items-center justify-center py-12">
                                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                                            <Plus className="h-8 w-8 text-primary" />
                                        </div>
                                        <p className="font-medium text-primary">Créer un assistant</p>
                                        <p className="text-sm text-muted-foreground">
                                            Ajouter un nouvel assistant IA
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
