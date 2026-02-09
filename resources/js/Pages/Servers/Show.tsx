import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Power, Trash2, ExternalLink, Copy, Check, RefreshCw } from 'lucide-react';
import { useState } from 'react';

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

export default function ShowServer({ server }: Props) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePower = (action: 'on' | 'off') => {
        router.post(route('servers.power', server.id), { action });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
            router.delete(route('servers.destroy', server.id));
        }
    };

    const handleRefresh = () => {
        router.reload();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('servers.index')}>
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
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        {server.status === 'running' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePower('off')}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                Stop
                            </Button>
                        )}
                        {server.status === 'stopped' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePower('on')}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                Start
                            </Button>
                        )}
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={server.name} />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Server Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Server Details</CardTitle>
                                <CardDescription>Technical information about your server</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <Badge variant={server.status === 'running' ? 'default' : 'secondary'}>
                                        {server.status}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">IP Address</span>
                                    {server.ip ? (
                                        <div className="flex items-center gap-2">
                                            <code className="font-mono text-sm">{server.ip}</code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(server.ip!)}
                                            >
                                                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">Pending...</span>
                                    )}
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Server Type</span>
                                    <span>{server.server_type}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Location</span>
                                    <span>{server.datacenter}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Image</span>
                                    <span>{server.image}</span>
                                </div>
                                {server.specs && (
                                    <>
                                        <Separator />
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
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* OpenClaw Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>OpenClaw</CardTitle>
                                <CardDescription>AI Assistant platform status</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Installation</span>
                                    <Badge variant={server.openclaw_installed ? 'default' : 'secondary'}>
                                        {server.openclaw_installed ? 'Complete' : 'In Progress'}
                                    </Badge>
                                </div>
                                <Separator />
                                {server.openclaw_installed && server.ip && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Access URL</span>
                                            <a
                                                href={`http://${server.ip}:3000`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline flex items-center gap-1"
                                            >
                                                http://{server.ip}:3000
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                        <Separator />
                                    </>
                                )}
                                {server.vnc_url && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Console (VNC)</span>
                                        <a
                                            href={server.vnc_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1"
                                        >
                                            Open Console
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                                {!server.openclaw_installed && (
                                    <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                                        <p className="font-medium">Setting up OpenClaw...</p>
                                        <p className="mt-1">
                                            Your server is being provisioned with OpenClaw. This usually takes 2-5 minutes.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
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
