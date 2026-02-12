import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { ArrowLeft, Shield, ShieldOff, Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';

interface Server {
    id: number;
    name: string;
    status: string;
    ip: string | null;
}

interface Transaction {
    id: number;
    type: string;
    amount: string;
    description: string | null;
    created_at: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    servers_count: number;
    created_at: string;
}

interface Props {
    user: User;
    servers: Server[];
    creditBalance: number;
    transactions: Transaction[];
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    pending: 'bg-yellow-500',
    provisioning: 'bg-blue-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
};

export default function AdminUserShow({ user, servers, creditBalance, transactions }: Props) {
    const [showAddCredits, setShowAddCredits] = useState(false);
    const { data, setData, post, processing } = useForm({
        amount: '',
        description: '',
    });

    const handleToggleAdmin = () => {
        if (confirm(`Are you sure you want to ${user.is_admin ? 'remove admin rights from' : 'make admin'} ${user.name}?`)) {
            router.post(route('admin.users.toggle-admin', user.id));
        }
    };

    const handleAddCredits = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.users.credits', user.id), {
            onSuccess: () => {
                setShowAddCredits(false);
                setData({ amount: '', description: '' });
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('admin.users.index')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {user.name}
                        </h2>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
            }
        >
            <Head title={`Admin - ${user.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-5xl sm:px-6 lg:px-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* User Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name</span>
                                    <span className="font-medium">{user.name}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span>{user.email}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Role</span>
                                    <div className="flex items-center gap-2">
                                        {user.is_admin ? (
                                            <Badge className="bg-purple-500">
                                                <Shield className="h-3 w-3 mr-1" />
                                                Admin
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">User</Badge>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleToggleAdmin}
                                        >
                                            {user.is_admin ? (
                                                <ShieldOff className="h-4 w-4" />
                                            ) : (
                                                <Shield className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Joined</span>
                                    <span>{new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Credits */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Credits</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAddCredits(!showAddCredits)}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Credits
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold mb-4">
                                    €{Number(creditBalance).toFixed(2)}
                                </div>

                                {showAddCredits && (
                                    <form onSubmit={handleAddCredits} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <Label htmlFor="amount">Amount (€)</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Description (optional)</Label>
                                            <Input
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Admin bonus"
                                            />
                                        </div>
                                        <Button type="submit" disabled={processing} className="w-full">
                                            {processing ? 'Adding...' : 'Add Credits'}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>

                        {/* Servers */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Servers ({servers.length})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {servers.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No servers</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>IP</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {servers.map((server) => (
                                                <TableRow key={server.id}>
                                                    <TableCell className="font-medium">{server.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${statusColors[server.status]}`} />
                                                            {server.status}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {server.ip || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={route('admin.servers.show', server.id)}>
                                                            <Button variant="ghost" size="sm">View</Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Transactions */}
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Recent Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {transactions.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-4">No transactions</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="capitalize">{tx.type}</TableCell>
                                                    <TableCell>{tx.description || '-'}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(tx.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-medium ${
                                                        Number(tx.amount) >= 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                        {Number(tx.amount) >= 0 ? '+' : ''}€{Number(tx.amount).toFixed(2)}
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
            </div>
        </AuthenticatedLayout>
    );
}
