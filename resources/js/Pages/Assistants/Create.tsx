import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { SubscriptionCTA } from '@/Components/SubscriptionCTA';
import {
    ArrowLeftIcon, ArrowRightIcon, CheckIcon,
    ZapIcon, ShieldIcon, GlobeIcon, InfoIcon, ChevronDownIcon, ChevronUpIcon,
    SparklesIcon, CpuIcon
} from 'lucide-react';
import { FormEvent, useState } from 'react';

interface ServerType {
    name: string;
    label: string;
    description: string;
    monthly_price: number;
}

interface Location {
    id: string;
    name: string;
    flag: string;
}

interface Props {
    serverTypes: ServerType[];
    locations: Location[];
    creditBalance: number;
    hasActiveSubscription: boolean;
}

function CreateAssistant({ serverTypes, locations, creditBalance, hasActiveSubscription }: Props) {
    if (!hasActiveSubscription) {
        return <SubscriptionCTA />;
    }

    const [step, setStep] = useState(1);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        server_type: 'cx22',
        datacenter: 'fsn1',
    });

    const selectedType = serverTypes.find(t => t.name === data.server_type);
    const selectedLocation = locations.find(l => l.id === data.datacenter);
    const canCreate = creditBalance >= (selectedType?.monthly_price || 0);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post('/assistants');
    };

    const nextStep = () => {
        if (step === 1 && !data.name.trim()) {
            return;
        }
        setStep(s => Math.min(s + 1, 3));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Assistant</h1>
                    <p className="text-muted-foreground">
                        Step {step} of 3
                    </p>
                </div>
            </div>

            <div className="mx-auto max-w-2xl">
                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium border-2 transition-colors ${
                                    s < step ? 'bg-primary border-primary text-primary-foreground' :
                                    s === step ? 'border-primary text-primary' :
                                    'border-muted text-muted-foreground'
                                }`}>
                                    {s < step ? <CheckIcon className="h-5 w-5" /> : s}
                                </div>
                                {s < 3 && (
                                    <div className={`w-24 sm:w-32 h-0.5 mx-2 transition-colors ${
                                        s < step ? 'bg-primary' : 'bg-muted'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground px-2">
                        <span>Name</span>
                        <span>Configuration</span>
                        <span>Confirm</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Step 1: Name */}
                    {step === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Name your assistant</CardTitle>
                                <CardDescription>
                                    Choose a memorable name for your AI assistant
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Assistant name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                        placeholder="my-assistant"
                                        className="h-11"
                                        autoFocus
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Letters, numbers and hyphens only
                                    </p>
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!data.name.trim()}
                                    className="w-full"
                                >
                                    Continue
                                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 2: Server Type */}
                    {step === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Choose configuration</CardTitle>
                                <CardDescription>
                                    More power means faster performance and more capacity
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    {serverTypes.map((type, index) => (
                                        <div
                                            key={type.name}
                                            className={`relative flex cursor-pointer rounded-lg border p-4 transition-all ${
                                                data.server_type === type.name
                                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                    : 'border-border hover:border-muted-foreground/50'
                                            }`}
                                            onClick={() => setData('server_type', type.name)}
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                        data.server_type === type.name
                                                            ? 'bg-primary text-primary-foreground'
                                                            : 'bg-muted'
                                                    }`}>
                                                        {index === 0 && <SparklesIcon className="h-5 w-5" />}
                                                        {index === 1 && <ZapIcon className="h-5 w-5" />}
                                                        {index === 2 && <ShieldIcon className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{type.label}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {type.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold">€{type.monthly_price.toFixed(2)}</p>
                                                    <p className="text-sm text-muted-foreground">per month</p>
                                                </div>
                                            </div>
                                            {index === 0 && (
                                                <Badge className="absolute -top-2 left-4" variant="default">
                                                    Recommended
                                                </Badge>
                                            )}
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

                                {/* Advanced options toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showAdvanced ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
                                    Advanced options
                                </button>

                                {showAdvanced && (
                                    <div className="space-y-3 p-4 border rounded-lg">
                                        <Label className="flex items-center gap-2">
                                            <GlobeIcon className="h-4 w-4" />
                                            Server location
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {locations.map((loc) => (
                                                <div
                                                    key={loc.id}
                                                    className={`flex items-center gap-2 cursor-pointer rounded-lg border p-3 transition-colors ${
                                                        data.datacenter === loc.id
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-border hover:border-muted-foreground/50'
                                                    }`}
                                                    onClick={() => setData('datacenter', loc.id)}
                                                >
                                                    <span className="text-lg">{loc.flag}</span>
                                                    <div>
                                                        <p className="font-medium text-sm">{loc.id.toUpperCase()}</p>
                                                        <p className="text-xs text-muted-foreground">{loc.name}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button type="button" onClick={nextStep} className="flex-1">
                                        Continue
                                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Review & Create</CardTitle>
                                <CardDescription>
                                    Verify the configuration below
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Summary */}
                                <div className="rounded-lg border p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-medium flex items-center gap-2">
                                            <CpuIcon className="h-4 w-4 text-muted-foreground" />
                                            {data.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Configuration</span>
                                        <span className="font-medium">{selectedType?.label}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Location</span>
                                        <span className="font-medium flex items-center gap-2">
                                            {selectedLocation?.flag} {selectedLocation?.name}
                                        </span>
                                    </div>
                                    <div className="border-t pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Monthly cost</span>
                                            <span className="font-semibold text-lg">
                                                €{selectedType?.monthly_price.toFixed(2)}/mo
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit balance */}
                                <div className="flex justify-between items-center p-4 border rounded-lg">
                                    <span className="text-muted-foreground">Your balance</span>
                                    <span className="font-semibold">€{creditBalance.toFixed(2)}</span>
                                </div>

                                {/* Info message */}
                                <Alert>
                                    <InfoIcon className="h-4 w-4" />
                                    <AlertDescription>
                                        Your assistant will be ready in 5-10 minutes. You can access it directly from your browser.
                                    </AlertDescription>
                                </Alert>

                                {/* Insufficient credits warning */}
                                {!canCreate && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            Insufficient balance. You have €{creditBalance.toFixed(2)} but need €{selectedType?.monthly_price.toFixed(2)}.{' '}
                                            <Link href="/credits" className="underline font-medium">
                                                Add credits
                                            </Link>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Error message */}
                                {(errors as Record<string, string>).error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>
                                            {(errors as Record<string, string>).error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || !canCreate}
                                        className="flex-1"
                                    >
                                        {processing ? (
                                            'Creating...'
                                        ) : (
                                            <>
                                                <SparklesIcon className="mr-2 h-4 w-4" />
                                                Create Assistant
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </form>
            </div>
        </>
    );
}

CreateAssistant.layout = (page: React.ReactNode) => <DashboardLayout title="Create Assistant">{page}</DashboardLayout>

export default CreateAssistant
