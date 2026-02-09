import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
    ArrowLeft, Power, Trash2, Monitor, RefreshCw, 
    CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp,
    Copy, Check, Eye, EyeOff, Mail, Bot, Maximize2
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
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; description: string }> = {
    running: { label: 'Actif', color: 'text-green-700', bgColor: 'bg-green-100', description: 'Votre assistant est prêt à être utilisé' },
    pending: { label: 'En attente', color: 'text-yellow-700', bgColor: 'bg-yellow-100', description: 'Démarrage en cours...' },
    provisioning: { label: 'Configuration', color: 'text-blue-700', bgColor: 'bg-blue-100', description: 'Installation automatique en cours...' },
    stopped: { label: 'Arrêté', color: 'text-gray-700', bgColor: 'bg-gray-100', description: 'Assistant en pause' },
    error: { label: 'Erreur', color: 'text-red-700', bgColor: 'bg-red-100', description: 'Un problème est survenu' },
};

export default function ShowAssistant({ assistant }: Props) {
    const [copied, setCopied] = useState<string | null>(null);
    const [showVnc, setShowVnc] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showVncPassword, setShowVncPassword] = useState(false);
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const vncContainerRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
    };

    const handlePower = (action: 'on' | 'off') => {
        if (action === 'off' && !confirm('Voulez-vous vraiment arrêter cet assistant ?')) {
            return;
        }
        router.post(route('assistants.power', assistant.id), { action });
    };

    const handleDelete = () => {
        if (confirm('Voulez-vous vraiment supprimer cet assistant ? Cette action est irréversible.')) {
            router.delete(route('assistants.destroy', assistant.id));
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
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('assistants.index')}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Bot className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                                    {assistant.name}
                                </h2>
                                <Badge className={`${status.bgColor} ${status.color} border-0`}>
                                    {status.label}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefresh}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        {assistant.status === 'running' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePower('off')}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                Arrêter
                            </Button>
                        )}
                        {assistant.status === 'stopped' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePower('on')}
                            >
                                <Power className="mr-2 h-4 w-4" />
                                Démarrer
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={assistant.name} />

            <div className="py-8">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8 space-y-6">
                    {/* Provisioning Status */}
                    {isProvisioning && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <AlertTitle className="text-blue-800">Configuration en cours</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                Votre assistant est en train d'être configuré. Cela prend généralement 5-10 minutes.
                                Cette page se mettra à jour automatiquement.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Status */}
                    {assistant.provision_status === 'failed' && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erreur de configuration</AlertTitle>
                            <AlertDescription>
                                Un problème est survenu lors de la configuration de votre assistant. 
                                Veuillez contacter le support ou réessayer en créant un nouvel assistant.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Main Access Card */}
                    {isReady && noVncUrl && (
                        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Monitor className="h-6 w-6 text-primary" />
                                            Bureau distant
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Accédez à votre assistant directement dans votre navigateur
                                        </CardDescription>
                                    </div>
                                    {!showVnc && (
                                        <Button size="lg" onClick={() => setShowVnc(true)}>
                                            <Monitor className="mr-2 h-5 w-5" />
                                            Accéder à mon assistant
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            {showVnc && (
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Utilisez votre souris et clavier normalement
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
                                                <Maximize2 className="mr-2 h-4 w-4" />
                                                Plein écran
                                            </Button>
                                            <a href={noVncUrl} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm">
                                                    Ouvrir dans un nouvel onglet
                                                </Button>
                                            </a>
                                            <Button variant="ghost" size="sm" onClick={() => setShowVnc(false)}>
                                                Masquer
                                            </Button>
                                        </div>
                                    </div>
                                    <div 
                                        ref={vncContainerRef}
                                        className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-black"
                                        style={{ height: '600px' }}
                                    >
                                        <iframe
                                            src={noVncUrl}
                                            className="w-full h-full"
                                            title="Bureau distant"
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
                            <CardContent className="py-12">
                                <div className="text-center">
                                    {isProvisioning ? (
                                        <>
                                            <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                                                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">Configuration en cours...</h3>
                                            <p className="text-muted-foreground max-w-md mx-auto">
                                                Votre assistant est en train d'être préparé. 
                                                Cette page se rafraîchira automatiquement quand il sera prêt.
                                            </p>
                                        </>
                                    ) : assistant.status === 'stopped' ? (
                                        <>
                                            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                                <Power className="h-10 w-10 text-gray-400" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">Assistant arrêté</h3>
                                            <p className="text-muted-foreground mb-6">
                                                Démarrez votre assistant pour y accéder
                                            </p>
                                            <Button onClick={() => handlePower('on')}>
                                                <Power className="mr-2 h-4 w-4" />
                                                Démarrer l'assistant
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                                                <AlertCircle className="h-10 w-10 text-yellow-600" />
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">{status.description}</h3>
                                            <p className="text-muted-foreground">
                                                Veuillez patienter ou contactez le support si le problème persiste.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Info */}
                    {isReady && (
                        <div className="grid gap-4 md:grid-cols-2">
                            {/* Email Credentials if available */}
                            {assistant.email_address && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Mail className="h-5 w-5" />
                                            Adresse email
                                        </CardTitle>
                                        <CardDescription>
                                            Email dédié à votre assistant
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                {assistant.email_address}
                                            </code>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyToClipboard(assistant.email_address!, 'email')}
                                            >
                                                {copied === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        {assistant.email_password && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Mot de passe:</span>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm">
                                                        {showEmailPassword ? assistant.email_password : '••••••••'}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                                                    >
                                                        {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Status Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                        État
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Statut</span>
                                            <Badge className={`${status.bgColor} ${status.color}`}>{status.label}</Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Abonnement</span>
                                            <span className="font-medium">€{Number(assistant.monthly_price).toFixed(2)}/mois</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Créé le</span>
                                            <span>{new Date(assistant.created_at).toLocaleDateString('fr-FR')}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Advanced Section (collapsible) */}
                    <Card>
                        <CardHeader 
                            className="cursor-pointer"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Informations techniques</CardTitle>
                                {showAdvanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                        </CardHeader>
                        {showAdvanced && (
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Technical Details */}
                                    <div className="space-y-3">
                                        <h4 className="font-medium">Détails du serveur</h4>
                                        <div className="space-y-2 text-sm">
                                            {assistant.ip && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Adresse IP</span>
                                                    <div className="flex items-center gap-2">
                                                        <code>{assistant.ip}</code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => copyToClipboard(assistant.ip!, 'ip')}
                                                        >
                                                            {copied === 'ip' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Type</span>
                                                <span>{assistant.server_type}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Localisation</span>
                                                <span>{assistant.datacenter}</span>
                                            </div>
                                            {assistant.specs && (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">CPU</span>
                                                        <span>{assistant.specs.cores} cœurs</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">RAM</span>
                                                        <span>{assistant.specs.memory} Go</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Stockage</span>
                                                        <span>{assistant.specs.disk} Go SSD</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* VNC Access */}
                                    {assistant.vnc_password && (
                                        <div className="space-y-3">
                                            <h4 className="font-medium">Accès VNC</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-muted-foreground">Mot de passe VNC</span>
                                                    <div className="flex items-center gap-2">
                                                        <code>
                                                            {showVncPassword ? assistant.vnc_password : '••••••••'}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => setShowVncPassword(!showVncPassword)}
                                                        >
                                                            {showVncPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() => copyToClipboard(assistant.vnc_password!, 'vnc')}
                                                        >
                                                            {copied === 'vnc' ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                {assistant.ip && (
                                                    <>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">VNC direct</span>
                                                            <code>{assistant.ip}:5901</code>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">noVNC (web)</span>
                                                            <code>{assistant.ip}:6080</code>
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
                                        <h4 className="font-medium">Journal d'installation</h4>
                                        <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-48 whitespace-pre-wrap">
                                            {assistant.provision_log}
                                        </pre>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-lg text-red-600">Zone de danger</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Supprimer cet assistant</p>
                                    <p className="text-sm text-muted-foreground">
                                        Cette action est irréversible. Toutes les données seront perdues.
                                    </p>
                                </div>
                                <Button variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
