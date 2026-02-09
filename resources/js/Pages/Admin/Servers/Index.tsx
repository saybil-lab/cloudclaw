import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Server {
    id: number;
    name: string;
    ip: string | null;
    status: string;
    server_type: string;
    datacenter: string;
    user: User;
    created_at: string;
}

interface PaginatedServers {
    data: Server[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface Props {
    servers: PaginatedServers;
    filters: {
        search?: string;
        status?: string;
    };
}

const statusColors: Record<string, string> = {
    running: 'bg-green-500',
    pending: 'bg-yellow-500',
    provisioning: 'bg-blue-500',
    stopped: 'bg-gray-500',
    error: 'bg-red-500',
};

export default function AdminServersIndex({ servers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.servers.index'), { search }, { preserveState: true });
    };

    const handleDelete = (serverId: number) => {
        if (confirm('Are you sure you want to delete this server?')) {
            router.delete(route('admin.servers.destroy', serverId));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Servers
                </h2>
            }
        >
            <Head title="Admin - Servers" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>All Servers</CardTitle>
                                <form onSubmit={handleSearch} className="flex gap-2">
                                    <Input
                                        type="search"
                                        placeholder="Search servers..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-64"
                                    />
                                    <Button type="submit" variant="outline">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Owner</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>IP</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {servers.data.map((server) => (
                                        <TableRow key={server.id}>
                                            <TableCell className="font-medium">{server.name}</TableCell>
                                            <TableCell>
                                                <Link
                                                    href={route('admin.users.show', server.user.id)}
                                                    className="hover:underline"
                                                >
                                                    {server.user.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${statusColors[server.status]}`} />
                                                    {server.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {server.ip || '-'}
                                            </TableCell>
                                            <TableCell>{server.server_type}</TableCell>
                                            <TableCell>{server.datacenter}</TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(server.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={route('admin.servers.show', server.id)}>
                                                        <Button variant="ghost" size="sm">View</Button>
                                                    </Link>
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

                            {/* Pagination */}
                            {servers.last_page > 1 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {servers.links.map((link, i) => (
                                        <Button
                                            key={i}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
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
