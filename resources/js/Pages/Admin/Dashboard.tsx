import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Users, Server, DollarSign, Activity, ArrowRight } from 'lucide-react';

interface Stats {
    total_users: number;
    total_servers: number;
    running_servers: number;
    total_revenue: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

interface ServerItem {
    id: number;
    name: string;
    status: string;
    user: User;
    created_at: string;
}

interface Transaction {
    id: number;
    amount: string;
    user: User;
    created_at: string;
}

interface Props {
    stats: Stats;
    recentUsers: User[];
    recentServers: ServerItem[];
    recentTransactions: Transaction[];
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    pending: 'bg-yellow-500',
    provisioning: 'bg-blue-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
};

export default function AdminDashboard({ stats, recentUsers, recentServers, recentTransactions }: Props) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-4 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_users}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                                <Server className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_servers}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.running_servers} running
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Running</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.running_servers}</div>
                                <p className="text-xs text-muted-foreground">
                                    active instances
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${Number(stats.total_revenue || 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Recent Users */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Recent Users</CardTitle>
                                    <Link href={route('admin.users.index')}>
                                        <Button variant="ghost" size="sm">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentUsers.map((user) => (
                                        <div key={user.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            </div>
                                            <Link href={route('admin.users.show', user.id)}>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Servers */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Recent Servers</CardTitle>
                                    <Link href={route('admin.servers.index')}>
                                        <Button variant="ghost" size="sm">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentServers.map((server) => (
                                        <div key={server.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${statusColors[server.status]}`} />
                                                <div>
                                                    <p className="font-medium">{server.name}</p>
                                                    <p className="text-sm text-muted-foreground">{server.user?.name}</p>
                                                </div>
                                            </div>
                                            <Link href={route('admin.servers.show', server.id)}>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Transactions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Purchases</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentTransactions.length === 0 ? (
                                        <p className="text-muted-foreground text-center py-4">
                                            No purchases yet
                                        </p>
                                    ) : (
                                        recentTransactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{tx.user?.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className="font-medium text-green-600">
                                                    +${Number(tx.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        ))
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
