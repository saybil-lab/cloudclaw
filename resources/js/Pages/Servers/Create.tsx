import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { ArrowLeft, Server } from 'lucide-react';
import { FormEvent } from 'react';

interface ServerType {
    name: string;
    label: string;
    description: string;
    hourly_rate: number;
    monthly_estimate: number;
}

interface Datacenter {
    id: string;
    name: string;
}

interface Props {
    serverTypes: ServerType[];
    datacenters: Datacenter[];
}

export default function CreateServer({ serverTypes, datacenters }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        server_type: 'cx22',
        datacenter: 'fsn1',
    });

    const selectedType = serverTypes.find(t => t.name === data.server_type);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('servers.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('servers.index')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Create Server
                    </h2>
                </div>
            }
        >
            <Head title="Create Server" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle>New OpenClaw Server</CardTitle>
                                <CardDescription>
                                    Configure your new server instance
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Server Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Server Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="my-openclaw-server"
                                        pattern="^[a-zA-Z0-9-]+$"
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Only letters, numbers, and hyphens are allowed.
                                    </p>
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Server Type */}
                                <div className="space-y-2">
                                    <Label>Server Type</Label>
                                    <div className="grid gap-3">
                                        {serverTypes.map((type) => (
                                            <div
                                                key={type.name}
                                                className={`relative flex cursor-pointer rounded-lg border p-4 ${
                                                    data.server_type === type.name
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => setData('server_type', type.name)}
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Server className="h-5 w-5 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{type.label}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {type.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">€{type.hourly_rate.toFixed(4)}/hr</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            ~€{type.monthly_estimate.toFixed(2)}/mo
                                                        </p>
                                                    </div>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="server_type"
                                                    value={type.name}
                                                    checked={data.server_type === type.name}
                                                    onChange={() => {}}
                                                    className="sr-only"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {errors.server_type && (
                                        <p className="text-sm text-red-500">{errors.server_type}</p>
                                    )}
                                </div>

                                {/* Datacenter */}
                                <div className="space-y-2">
                                    <Label>Location</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {datacenters.map((dc) => (
                                            <div
                                                key={dc.id}
                                                className={`relative flex cursor-pointer rounded-lg border p-3 ${
                                                    data.datacenter === dc.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => setData('datacenter', dc.id)}
                                            >
                                                <div>
                                                    <p className="font-medium">{dc.id.toUpperCase()}</p>
                                                    <p className="text-sm text-muted-foreground">{dc.name}</p>
                                                </div>
                                                <input
                                                    type="radio"
                                                    name="datacenter"
                                                    value={dc.id}
                                                    checked={data.datacenter === dc.id}
                                                    onChange={() => {}}
                                                    className="sr-only"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                    {errors.datacenter && (
                                        <p className="text-sm text-red-500">{errors.datacenter}</p>
                                    )}
                                </div>

                                {/* Summary */}
                                {selectedType && (
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <h4 className="font-medium mb-2">Summary</h4>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between">
                                                <span>Server Type:</span>
                                                <span className="font-medium">{selectedType.label}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Hourly Rate:</span>
                                                <span className="font-medium">€{selectedType.hourly_rate.toFixed(4)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Estimated Monthly:</span>
                                                <span className="font-medium">€{selectedType.monthly_estimate.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error message */}
                                {(errors as Record<string, string>).error && (
                                    <div className="rounded-lg bg-red-50 p-4 text-red-600">
                                        {(errors as Record<string, string>).error}
                                    </div>
                                )}

                                {/* Submit */}
                                <div className="flex justify-end gap-3">
                                    <Link href={route('servers.index')}>
                                        <Button variant="outline" type="button">Cancel</Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Server'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
