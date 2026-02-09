import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    ArrowLeft, Power, Trash2, ExternalLink, Copy, Check, RefreshCw, 
    Monitor, Mail, Eye, EyeOff, Terminal, AlertCircle, Maximize2, Minimize2
} from 'lucide-react';
import { useState, useRef } from 'react';

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
    vnc_password: string | null;
    email_address: string | null;
    email_password: string | null;
    provision_status: string;
    provision_log: string | null;
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

const provisionStatusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-100',
    provisioning: 'text-blue-600 bg-blue-100',
    ready: 'text-green-600 bg-green-100',
    failed: 'text-red-600 bg-red-100',
};

export default function ShowServer({ server }: Props) {
    const [copied, setCopied] = useState<string | null>(null);
    const [showVncPassword, setShowVncPassword] = useState(false);
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const [showVnc, setShowVnc] = useState(false);
    const [vncFullscreen, setVncFullscreen] = useState(false);
    const [showProvisionLog, setShowProvisionLog] = useState(false);
    const vncContainerRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
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

    const getNoVncUrl = () => {
        if (!server.ip || !server.vnc_password) return null;
        return `http://${server.ip}:6080/vnc.html?password=${encodeURIComponent(server.vnc_password)}&autoconnect=true&resize=scale`;
    };

    const toggleFullscreen = () => {
        if (!vncContainerRef.current) return;
        
        if (!vncFullscreen) {
            if (vncContainerRef.current.requestFullscreen) {
                vncContainerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
        setVncFullscreen(!vncFullscreen);
    };

    const noVncUrl = getNoVncUrl();
    const isReady = server.provision_status === 'ready' && server.status === 'running';

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
                                <Badge className={provisionStatusColors[server.provision_status]}>
                                    {server.provision_status}
                                </Badge>
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
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* noVNC Desktop Access */}
                    {isReady && noVncUrl && (
                        <Card className="mb-6">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Monitor className="h-5 w-5" />
                                            Cloud Desktop
                                        </CardTitle>
                                        <CardDescription>
                                            Access your server's desktop via browser
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        {showVnc ? (
                                            <>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={toggleFullscreen}
                                                >
                                                    {vncFullscreen ? (
                                                        <Minimize2 className="h-4 w-4 mr-2" />
                                                    ) : (
                                                        <Maximize2 className="h-4 w-4 mr-2" />
                                                    )}
                                                    {vncFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => setShowVnc(false)}
                                                >
                                                    Hide Desktop
                                                </Button>
                                                <a
                                                    href={noVncUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Button variant="outline" size="sm">
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        Open in New Tab
                                                    </Button>
                                                </a>
                                            </>
                                        ) : (
                                            <Button onClick={() => setShowVnc(true)}>
                                                <Monitor className="h-4 w-4 mr-2" />
                                                Access Desktop
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardHeader>
                            {showVnc && (
                                <CardContent>
                                    <div 
                                        ref={vncContainerRef}
                                        className="relative rounded-lg overflow-hidden border bg-black"
                                        style={{ height: vncFullscreen ? '100vh' : '600px' }}
                                    >
                                        <iframe
                                            src={noVncUrl}
                                            className="w-full h-full"
                                            title="noVNC Desktop"
                                            allow="clipboard-read; clipboard-write"
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Tip: Use Ctrl+Alt+Shift to open noVNC menu. Press F11 for browser fullscreen.
                                    </p>
                                </CardContent>
                            )}
                        </Card>
                    )}

                    {/* Provisioning in Progress Alert */}
                    {server.provision_status === 'provisioning' && (
                        <Alert className="mb-6">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <AlertTitle>Server is being provisioned</AlertTitle>
                            <AlertDescription>
                                Your cloud desktop is being set up. This typically takes 5-10 minutes.
                                The page will auto-refresh when ready.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Alert */}
                    {server.provision_status === 'failed' && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Provisioning Failed</AlertTitle>
                            <AlertDescription>
                                There was an error setting up your server. Please check the logs below or contact support.
                            </AlertDescription>
                        </Alert>
                    )}

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
                                                onClick={() => copyToClipboard(server.ip!, 'ip')}
                                            >
                                                {copied === 'ip' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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

                        {/* Access Credentials */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Access Credentials</CardTitle>
                                <CardDescription>Credentials for accessing your server</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* VNC Access */}
                                {server.vnc_password && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <Monitor className="h-4 w-4" />
                                                    VNC Password
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-sm">
                                                        {showVncPassword ? server.vnc_password : '••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowVncPassword(!showVncPassword)}
                                                    >
                                                        {showVncPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(server.vnc_password!, 'vnc')}
                                                    >
                                                        {copied === 'vnc' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Direct VNC: {server.ip}:5901 | noVNC: {server.ip}:6080
                                            </p>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {/* SSH Access */}
                                {server.ip && server.vnc_password && (
                                    <>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground flex items-center gap-2">
                                                    <Terminal className="h-4 w-4" />
                                                    SSH Access
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                                                    ssh cloudclaw@{server.ip}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(`ssh cloudclaw@${server.ip}`, 'ssh')}
                                                >
                                                    {copied === 'ssh' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Password: Same as VNC password
                                            </p>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {/* Email Access */}
                                {server.email_address && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Mail className="h-4 w-4" />
                                                Email Address
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <code className="font-mono text-sm">{server.email_address}</code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(server.email_address!, 'email')}
                                                >
                                                    {copied === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        {server.email_password && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Email Password</span>
                                                <div className="flex items-center gap-2">
                                                    <code className="font-mono text-sm">
                                                        {showEmailPassword ? server.email_password : '••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                                                    >
                                                        {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(server.email_password!, 'emailpw')}
                                                    >
                                                        {copied === 'emailpw' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!server.vnc_password && !server.email_address && (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <p>Credentials will be available once provisioning is complete.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
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

                        {/* Provisioning Log */}
                        {server.provision_log && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle>Provisioning Log</CardTitle>
                                        <Button 
                                            variant="ghost" 
                                            size="sm"
                                            onClick={() => setShowProvisionLog(!showProvisionLog)}
                                        >
                                            {showProvisionLog ? 'Hide' : 'Show'}
                                        </Button>
                                    </div>
                                </CardHeader>
                                {showProvisionLog && (
                                    <CardContent>
                                        <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                                            {server.provision_log}
                                        </pre>
                                    </CardContent>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
