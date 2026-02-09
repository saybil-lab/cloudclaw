import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Server, CreditCard, Plus, Activity } from 'lucide-react';

interface ServerType {
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
    servers: ServerType[];
    creditBalance: number;
    recentTransactions: Transaction[];
    serverTypes: Array<{
        name: string;
        label: string;
        description: string;
        hourly_rate: number;
        monthly_estimate: number;
    }>;
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    pending: 'bg-yellow-500',
    provisioning: 'bg-blue-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
};

export default function Dashboard({ servers, creditBalance, recentTransactions, serverTypes }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Servers</CardTitle>
                                <Server className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {servers.filter(s => s.status === 'running').length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {servers.length} total servers
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">€{Number(creditBalance).toFixed(2)}</div>
                                <Link href={route('credits.index')}>
                                    <Button variant="link" className="p-0 h-auto text-xs">
                                        Add Credits →
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <Link href={route('servers.create')}>
                                    <Button className="w-full">
                                        <Plus className="mr-2 h-4 w-4" />
                                        New Server
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Servers Section */}
                    <Card className="mb-8">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Your Servers</CardTitle>
                                    <CardDescription>
                                        Manage your OpenClaw instances
                                    </CardDescription>
                                </div>
                                <Link href={route('servers.index')}>
                                    <Button variant="outline" size="sm">View All</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {servers.length === 0 ? (
                                <div className="text-center py-8">
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
                                <div className="space-y-4">
                                    {servers.slice(0, 5).map((server) => (
                                        <div
                                            key={server.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${statusColors[server.status] || 'bg-gray-500'}`} />
                                                <div>
                                                    <h4 className="font-medium">{server.name}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {server.ip || 'IP pending'} • {server.server_type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={server.openclaw_installed ? 'default' : 'secondary'}>
                                                    {server.openclaw_installed ? 'OpenClaw Ready' : 'Setting up...'}
                                                </Badge>
                                                <Link href={route('servers.show', server.id)}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Recent Transactions</CardTitle>
                                    <CardDescription>
                                        Your credit activity
                                    </CardDescription>
                                </div>
                                <Link href={route('credits.index')}>
                                    <Button variant="outline" size="sm">View All</Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    No transactions yet
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {recentTransactions.map((tx) => (
                                        <div
                                            key={tx.id}
                                            className="flex items-center justify-between py-2"
                                        >
                                            <div>
                                                <p className="text-sm font-medium capitalize">{tx.type}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {tx.description || 'No description'}
                                                </p>
                                            </div>
                                            <span className={`font-medium ${Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {Number(tx.amount) >= 0 ? '+' : ''}€{Number(tx.amount).toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
