import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
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
import { Plus, Server, Power, Trash2, ExternalLink } from 'lucide-react';

interface ServerType {
    id: number;
    name: string;
    ip: string | null;
    status: string;
    server_type: string;
    datacenter: string;
    openclaw_installed: boolean;
    vnc_url: string | null;
    created_at: string;
}

interface Props {
    servers: ServerType[];
    serverTypes: Array<{
        name: string;
        label: string;
        description: string;
    }>;
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    pending: 'bg-yellow-500',
    provisioning: 'bg-blue-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
    running: 'Running',
    pending: 'Pending',
    provisioning: 'Provisioning',
    stopped: 'Stopped',
    error: 'Error',
};

export default function ServersIndex({ servers, serverTypes }: Props) {
    const handlePower = (serverId: number, action: 'on' | 'off') => {
        router.post(route('servers.power', serverId), { action });
    };

    const handleDelete = (serverId: number) => {
        if (confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
            router.delete(route('servers.destroy', serverId));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Servers
                    </h2>
                    <Link href={route('servers.create')}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            New Server
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Servers" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Servers</CardTitle>
                            <CardDescription>
                                Manage your OpenClaw server instances
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {servers.length === 0 ? (
                                <div className="text-center py-12">
                                    <Server className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No servers yet</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create your first OpenClaw server to get started.
                                    </p>
                                    <Link href={route('servers.create')}>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Server
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>IP Address</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Location</TableHead>
                                            <TableHead>OpenClaw</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {servers.map((server) => (
                                            <TableRow key={server.id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={route('servers.show', server.id)}
                                                        className="hover:underline"
                                                    >
                                                        {server.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${statusColors[server.status]}`} />
                                                        {statusLabels[server.status]}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {server.ip || '-'}
                                                </TableCell>
                                                <TableCell>{server.server_type}</TableCell>
                                                <TableCell>{server.datacenter}</TableCell>
                                                <TableCell>
                                                    <Badge variant={server.openclaw_installed ? 'default' : 'secondary'}>
                                                        {server.openclaw_installed ? 'Ready' : 'Installing'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {server.vnc_url && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                            >
                                                                <a href={server.vnc_url} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        )}
                                                        {server.status === 'running' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePower(server.id, 'off')}
                                                            >
                                                                <Power className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        )}
                                                        {server.status === 'stopped' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePower(server.id, 'on')}
                                                            >
                                                                <Power className="h-4 w-4 text-green-500" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(server.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
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
