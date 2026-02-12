import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import { CpuIcon, PlusIcon, ArrowRightIcon, MonitorIcon, PowerIcon } from 'lucide-react';

interface Assistant {
    id: number;
    name: string;
    ip: string | null;
    status: string;
    server_type: string;
    monthly_price: number;
    openclaw_installed: boolean;
    provision_status: string;
    created_at: string;
}

interface ServerType {
    name: string;
    label: string;
    description: string;
    monthly_price: number;
}

interface Props {
    assistants: Assistant[];
    serverTypes: ServerType[];
    hasActiveSubscription: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    running: { label: 'Active', color: 'text-green-600', bg: 'bg-green-500/10' },
    pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
    provisioning: { label: 'Provisioning', color: 'text-blue-600', bg: 'bg-blue-500/10' },
    stopped: { label: 'Stopped', color: 'text-gray-600', bg: 'bg-gray-500/10' },
    error: { label: 'Error', color: 'text-red-600', bg: 'bg-red-500/10' },
};

const getServerTypeLabel = (serverTypes: ServerType[], name: string): string => {
    const type = serverTypes.find(t => t.name === name);
    return type?.label || name;
};

function AssistantsIndex({ assistants, serverTypes, hasActiveSubscription }: Props) {
    if (!hasActiveSubscription) {
        return <SubscriptionCTA />;
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Assistants</h1>
                    <p className="text-muted-foreground">
                        {assistants.length} assistant{assistants.length !== 1 ? 's' : ''} configured
                    </p>
                </div>
                <Button asChild>
                    <Link href="/assistants/create">
                        <PlusIcon className="mr-2 h-4 w-4" />
                        New Assistant
                    </Link>
                </Button>
            </div>

            {/* Content */}
            {assistants.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CpuIcon className="h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-semibold">No assistants yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                            Create your first AI assistant to get started. Your personal AI in the cloud, ready in minutes.
                        </p>
                        <Button asChild className="mt-6">
                            <Link href="/assistants/create">
                                <PlusIcon className="mr-2 h-4 w-4" />
                                Create Assistant
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {assistants.map((assistant) => {
                        const status = statusConfig[assistant.status] || statusConfig.pending;
                        const isReady = assistant.provision_status === 'ready' && assistant.status === 'running';

                        return (
                            <Link
                                key={assistant.id}
                                href={`/assistants/${assistant.id}`}
                                className="block"
                            >
                                <Card className="transition-shadow hover:shadow-md h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <CardTitle className="text-base">{assistant.name}</CardTitle>
                                                <CardDescription>
                                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                        {getServerTypeLabel(serverTypes, assistant.server_type)}
                                                    </code>
                                                </CardDescription>
                                            </div>
                                            <Badge className={`${status.bg} ${status.color}`}>
                                                {status.label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {/* Status indicator */}
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <PowerIcon className={`h-4 w-4 ${assistant.status === 'running' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                                    <span className="text-muted-foreground">
                                                        {assistant.status === 'running' ? 'Online' :
                                                         assistant.status === 'stopped' ? 'Offline' :
                                                         assistant.status === 'provisioning' ? 'Installing...' :
                                                         'Pending'}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground">
                                                    €{Number(assistant.monthly_price).toFixed(2)}/mo
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                {isReady && (
                                                    <Button className="flex-1" size="sm">
                                                        <MonitorIcon className="mr-2 h-4 w-4" />
                                                        Access
                                                    </Button>
                                                )}
                                                <Button variant="outline" className={isReady ? '' : 'flex-1'} size="sm">
                                                    {isReady ? (
                                                        <ArrowRightIcon className="h-4 w-4" />
                                                    ) : (
                                                        <>
                                                            View Details
                                                            <ArrowRightIcon className="ml-2 h-4 w-4" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}

                    {/* Add new card */}
                    <Link href="/assistants/create">
                        <Card className="h-full border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="h-full flex flex-col items-center justify-center py-12">
                                <div className="p-3 rounded-full border-2 border-dashed mb-4">
                                    <PlusIcon className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <p className="font-medium">New Assistant</p>
                                <p className="text-sm text-muted-foreground">
                                    Add another AI assistant
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            )}
        </>
    );
}

AssistantsIndex.layout = (page: React.ReactNode) => <DashboardLayout title="My Assistants">{page}</DashboardLayout>

export default AssistantsIndex;
