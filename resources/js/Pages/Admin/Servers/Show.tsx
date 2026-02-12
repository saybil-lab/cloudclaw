import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { ArrowLeft, Trash2, ExternalLink } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Server {
    id: number;
    name: string;
    hetzner_id: string | null;
    ip: string | null;
    status: string;
    server_type: string;
    datacenter: string;
    image: string;
    specs: {
        cores?: number;
        memory?: number;
        disk?: number;
    } | null;
    vnc_url: string | null;
    openclaw_installed: boolean;
    provisioned_at: string | null;
    created_at: string;
    user: User;
}

interface Props {
    server: Server;
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    pending: 'bg-yellow-500',
    provisioning: 'bg-blue-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
};

export default function AdminServerShow({ server }: Props) {
    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this server?')) {
            router.delete(route('admin.servers.destroy', server.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.servers.index')}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                {server.name}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${statusColors[server.status]}`} />
                                <span className="text-sm text-muted-foreground capitalize">{server.status}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            }
        >
            <Head title={`Admin - ${server.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Owner */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Owner</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name</span>
                                    <Link
                                        href={route('admin.users.show', server.user.id)}
                                        className="font-medium hover:underline"
                                    >
                                        {server.user.name}
                                    </Link>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span>{server.user.email}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Server Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Server Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Hetzner ID</span>
                                    <span className="font-mono text-sm">{server.hetzner_id || '-'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">IP Address</span>
                                    <span className="font-mono text-sm">{server.ip || '-'}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type</span>
                                    <span>{server.server_type}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location</span>
                                    <span>{server.datacenter}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Specs */}
                        {server.specs && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Specifications</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">CPU</span>
                                        <span>{server.specs.cores} vCPU</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Memory</span>
                                        <span>{server.specs.memory} GB</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Disk</span>
                                        <span>{server.specs.disk} GB SSD</span>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* OpenClaw */}
                        <Card>
                            <CardHeader>
                                <CardTitle>OpenClaw</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={server.openclaw_installed ? 'default' : 'secondary'}>
                                        {server.openclaw_installed ? 'Installed' : 'Installing'}
                                    </Badge>
                                </div>
                                {server.vnc_url && (
                                    <>
                                        <Separator />
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Console</span>
                                            <a
                                                href={server.vnc_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                Open VNC
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Created</p>
                                        <p className="font-medium">
                                            {new Date(server.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {server.provisioned_at && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Provisioned</p>
                                            <p className="font-medium">
                                                {new Date(server.provisioned_at).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
