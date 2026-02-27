import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import {
    ArrowLeftIcon, PowerIcon, Trash2Icon, MonitorIcon, RefreshCwIcon,
    CheckCircle2Icon, AlertCircleIcon, Loader2Icon, ChevronDownIcon, ChevronUpIcon,
    CopyIcon, CheckIcon, EyeIcon, EyeOffIcon, MailIcon, CpuIcon, Maximize2Icon,
    ServerIcon, GlobeIcon
} from 'lucide-react';
import { useState, useRef } from 'react';

interface Assistant {
    id: number;
    name: string;
    hetzner_id: string | null;
    ip: string | null;
    status: string;
    server_type: string;
    monthly_price: number;
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
    assistant: Assistant;
    hasActiveSubscription: boolean;
    hasLlmApiKey?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; description: string }> = {
    running: { label: 'Active', color: 'text-green-600', bg: 'bg-green-500/10', description: 'Your assistant is ready to use' },
    pending: { label: 'Pending', color: 'text-yellow-600', bg: 'bg-yellow-500/10', description: 'Starting up...' },
    provisioning: { label: 'Provisioning', color: 'text-blue-600', bg: 'bg-blue-500/10', description: 'Setting up your assistant...' },
    stopped: { label: 'Stopped', color: 'text-gray-600', bg: 'bg-gray-500/10', description: 'Assistant is paused' },
    error: { label: 'Error', color: 'text-red-600', bg: 'bg-red-500/10', description: 'An error occurred' },
};

function ShowAssistant({ assistant, hasActiveSubscription, hasLlmApiKey }: Props) {
    const [copied, setCopied] = useState<string | null>(null);
    const [showVnc, setShowVnc] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showVncPassword, setShowVncPassword] = useState(false);
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const vncContainerRef = useRef<HTMLDivElement>(null);

    if (!hasActiveSubscription) {
        return <SubscriptionCTA />;
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handlePower = (action: 'on' | 'off') => {
        if (action === 'off' && !confirm('Are you sure you want to stop this assistant?')) {
            return;
        }
        router.post(`/assistants/${assistant.id}/power`, { action });
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this assistant? This action cannot be undone.')) {
            router.delete(`/assistants/${assistant.id}`);
        }
    };

    const handleRefresh = () => {
        router.reload();
    };

    const getNoVncUrl = () => {
        if (!assistant.ip || !assistant.vnc_password) return null;
        return `http://${assistant.ip}:6080/vnc.html?password=${encodeURIComponent(assistant.vnc_password)}&autoconnect=true&resize=scale`;
    };

    const toggleFullscreen = () => {
        if (!vncContainerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            vncContainerRef.current.requestFullscreen();
        }
    };

    const noVncUrl = getNoVncUrl();
    const isReady = assistant.provision_status === 'ready' && assistant.status === 'running';
    const isProvisioning = assistant.provision_status === 'provisioning' || assistant.status === 'provisioning';
    const status = statusConfig[assistant.status] || statusConfig.pending;

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/assistants">
                            <ArrowLeftIcon className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{assistant.name}</h1>
                            <Badge className={`${status.bg} ${status.color}`}>
                                {status.label}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">
                            {assistant.server_type} • {assistant.datacenter.toUpperCase()}
                        </p>
                    </div>
                </div>
                {/* <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh}>
                        <RefreshCwIcon className="h-4 w-4" />
                    </Button>
                    {assistant.status === 'running' && (
                        <Button variant="outline" size="sm" onClick={() => handlePower('off')}>
                            <PowerIcon className="mr-2 h-4 w-4" />
                            Stop
                        </Button>
                    )}
                    {assistant.status === 'stopped' && (
                        <Button variant="outline" size="sm" onClick={() => handlePower('on')}>
                            <PowerIcon className="mr-2 h-4 w-4" />
                            Start
                        </Button>
                    )}
                </div> */}
            </div>

            <div className="space-y-6">
                {/* AI API Key Warning */}
                {!hasLlmApiKey && assistant.status === 'running' && (
                    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                        <AlertCircleIcon className="h-4 w-4 text-orange-500" />
                        <div className="flex items-center justify-between">
                            <div>
                                <AlertTitle className="text-orange-700 dark:text-orange-300">LLM API key not configured</AlertTitle>
                                <AlertDescription className="text-orange-600 dark:text-orange-400">
                                    Configure your AI provider API key so this assistant can respond to messages.
                                </AlertDescription>
                            </div>
                            <Button variant="outline" size="sm" asChild className="border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                                <Link href="/settings">Configure Key</Link>
                            </Button>
                        </div>
                    </Alert>
                )}
                {/* Provisioning Status */}
                {isProvisioning && (
                    <Alert>
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                        <AlertTitle>Setting up your assistant</AlertTitle>
                        <AlertDescription>
                            This usually takes 5-10 minutes. The page will refresh automatically.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Error Status */}
                {assistant.provision_status === 'failed' && (
                    <Alert variant="destructive">
                        <AlertCircleIcon className="h-4 w-4" />
                        <AlertTitle>Setup failed</AlertTitle>
                        <AlertDescription>
                            An error occurred while setting up your assistant. Please contact support or try creating a new one.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Main Access Card */}
                {isReady && noVncUrl && (
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <MonitorIcon className="h-5 w-5 text-muted-foreground" />
                                        Remote Desktop
                                    </CardTitle>
                                    <CardDescription>
                                        Access your assistant directly in your browser
                                    </CardDescription>
                                </div>
                                {!showVnc && (
                                    <Button onClick={() => setShowVnc(true)}>
                                        <MonitorIcon className="mr-2 h-4 w-4" />
                                        Open Desktop
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        {showVnc && (
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Use your mouse and keyboard normally
                                    </p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                                            <Maximize2Icon className="mr-2 h-4 w-4" />
                                            Fullscreen
                                        </Button>
                                        <a href={noVncUrl} target="_blank" rel="noopener noreferrer">
                                            <Button variant="outline" size="sm">
                                                Open in new tab
                                            </Button>
                                        </a>
                                        <Button variant="ghost" size="sm" onClick={() => setShowVnc(false)}>
                                            Close
                                        </Button>
                                    </div>
                                </div>
                                <div
                                    ref={vncContainerRef}
                                    className="relative rounded-lg overflow-hidden border bg-black"
                                    style={{ height: '600px' }}
                                >
                                    <iframe
                                        src={noVncUrl}
                                        className="w-full h-full"
                                        title="Remote Desktop"
                                        allow="clipboard-read; clipboard-write"
                                    />
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Status Card when not ready */}
                {!isReady && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            {isProvisioning ? (
                                <>
                                    <Loader2Icon className="h-12 w-12 text-muted-foreground animate-spin" />
                                    <h3 className="mt-4 text-lg font-semibold">Setting up...</h3>
                                    <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
                                        Your assistant is being prepared. This page will refresh when ready.
                                    </p>
                                </>
                            ) : assistant.status === 'stopped' ? (
                                <>
                                    <PowerIcon className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">Assistant stopped</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Start your assistant to access it
                                    </p>
                                    <Button className="mt-4" onClick={() => handlePower('on')}>
                                        <PowerIcon className="mr-2 h-4 w-4" />
                                        Start Assistant
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <AlertCircleIcon className="h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-4 text-lg font-semibold">{status.description}</h3>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Please wait or contact support if the issue persists.
                                    </p>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Quick Info */}
                {isReady && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Status Card */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Status</CardTitle>
                                <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">State</span>
                                        <Badge className={`${status.bg} ${status.color}`}>{status.label}</Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Monthly cost</span>
                                        <span className="font-medium">${Number(assistant.monthly_price).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created</span>
                                        <span>{new Date(assistant.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Server Info */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Server</CardTitle>
                                <ServerIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    {assistant.ip && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">IP Address</span>
                                            <div className="flex items-center gap-1">
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{assistant.ip}</code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                    onClick={() => copyToClipboard(assistant.ip!, 'ip')}
                                                >
                                                    {copied === 'ip' ? <CheckIcon className="h-3 w-3 text-green-500" /> : <CopyIcon className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span>{assistant.server_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Location</span>
                                        <span>{assistant.datacenter.toUpperCase()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Email Credentials if available */}
                        {assistant.email_address && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Email</CardTitle>
                                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[180px]">
                                                {assistant.email_address}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => copyToClipboard(assistant.email_address!, 'email')}
                                            >
                                                {copied === 'email' ? <CheckIcon className="h-3 w-3 text-green-500" /> : <CopyIcon className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                        {assistant.email_password && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Password</span>
                                                <div className="flex items-center gap-1">
                                                    <code className="text-xs">
                                                        {showEmailPassword ? assistant.email_password : '••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                                                    >
                                                        {showEmailPassword ? <EyeOffIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Advanced Section (collapsible) */}
                <Card>
                    <CardHeader
                        className="cursor-pointer"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">Technical Details</CardTitle>
                            {showAdvanced ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                        </div>
                    </CardHeader>
                    {showAdvanced && (
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Specs */}
                                {assistant.specs && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <CpuIcon className="h-4 w-4 text-muted-foreground" />
                                            Specifications
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">CPU</span>
                                                <span>{assistant.specs.cores} cores</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">RAM</span>
                                                <span>{assistant.specs.memory} GB</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Storage</span>
                                                <span>{assistant.specs.disk} GB SSD</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* VNC Access */}
                                {assistant.vnc_password && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                            <MonitorIcon className="h-4 w-4 text-muted-foreground" />
                                            VNC Access
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Password</span>
                                                <div className="flex items-center gap-1">
                                                    <code className="text-xs">
                                                        {showVncPassword ? assistant.vnc_password : '••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => setShowVncPassword(!showVncPassword)}
                                                    >
                                                        {showVncPassword ? <EyeOffIcon className="h-3 w-3" /> : <EyeIcon className="h-3 w-3" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => copyToClipboard(assistant.vnc_password!, 'vnc')}
                                                    >
                                                        {copied === 'vnc' ? <CheckIcon className="h-3 w-3 text-green-500" /> : <CopyIcon className="h-3 w-3" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            {assistant.ip && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">VNC direct</span>
                                                        <code className="text-xs">{assistant.ip}:5901</code>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">noVNC (web)</span>
                                                        <code className="text-xs">{assistant.ip}:6080</code>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Provisioning Log */}
                            {assistant.provision_log && (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium">Setup Log</h4>
                                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                                        {assistant.provision_log}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    )}
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-destructive">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Delete this assistant</p>
                                <p className="text-sm text-muted-foreground">
                                    This action cannot be undone. All data will be lost.
                                </p>
                            </div>
                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                <Trash2Icon className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

ShowAssistant.layout = (page: React.ReactNode) => <DashboardLayout title="Assistant">{page}</DashboardLayout>

export default ShowAssistant;
