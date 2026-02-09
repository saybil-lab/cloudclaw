import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, ArrowRight, Bot, Sparkles, Check, 
    Zap, Shield, Globe, Info, ChevronDown, ChevronUp 
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
}

export default function CreateAssistant({ serverTypes, locations, creditBalance }: Props) {
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
        post(route('assistants.store'));
    };

    const nextStep = () => {
        if (step === 1 && !data.name.trim()) {
            return;
        }
        setStep(s => Math.min(s + 1, 3));
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <Link href={route('assistants.index')}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Créer un assistant
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Étape {step} sur 3
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Créer un assistant" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    {/* Progress bar */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                                        s < step ? 'bg-primary text-white' :
                                        s === step ? 'bg-primary text-white' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                        {s < step ? <Check className="h-5 w-5" /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`w-24 sm:w-32 h-1 mx-2 ${
                                            s < step ? 'bg-primary' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground px-2">
                            <span>Nom</span>
                            <span>Puissance</span>
                            <span>Confirmer</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Step 1: Name */}
                        {step === 1 && (
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <Bot className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle>Comment voulez-vous appeler votre assistant ?</CardTitle>
                                    <CardDescription>
                                        Choisissez un nom facile à retenir
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Nom de l'assistant</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                            placeholder="mon-assistant"
                                            className="text-lg h-12"
                                            autoFocus
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Lettres, chiffres et tirets uniquement
                                        </p>
                                        {errors.name && (
                                            <p className="text-sm text-red-500">{errors.name}</p>
                                        )}
                                    </div>

                                    <Button 
                                        type="button" 
                                        onClick={nextStep}
                                        disabled={!data.name.trim()}
                                        className="w-full"
                                        size="lg"
                                    >
                                        Continuer
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 2: Server Type */}
                        {step === 2 && (
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <Zap className="h-8 w-8 text-primary" />
                                    </div>
                                    <CardTitle>Quelle puissance pour votre assistant ?</CardTitle>
                                    <CardDescription>
                                        Plus de puissance = plus de rapidité et de capacité
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-3">
                                        {serverTypes.map((type) => (
                                            <div
                                                key={type.name}
                                                className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                                                    data.server_type === type.name
                                                        ? 'border-primary bg-primary/5 shadow-sm'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                                onClick={() => setData('server_type', type.name)}
                                            >
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                            data.server_type === type.name ? 'bg-primary text-white' : 'bg-gray-100'
                                                        }`}>
                                                            {type.name === 'cx22' && <Sparkles className="h-6 w-6" />}
                                                            {type.name === 'cx32' && <Zap className="h-6 w-6" />}
                                                            {type.name === 'cx42' && <Shield className="h-6 w-6" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-lg">{type.label}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {type.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">€{type.monthly_price.toFixed(2)}</p>
                                                        <p className="text-sm text-muted-foreground">par mois</p>
                                                    </div>
                                                </div>
                                                {type.name === 'cx22' && (
                                                    <Badge className="absolute -top-2 left-4 bg-primary">
                                                        Recommandé
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
                                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        Options avancées
                                    </button>

                                    {showAdvanced && (
                                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                                            <Label className="flex items-center gap-2">
                                                <Globe className="h-4 w-4" />
                                                Localisation du serveur
                                            </Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {locations.map((loc) => (
                                                    <div
                                                        key={loc.id}
                                                        className={`flex items-center gap-2 cursor-pointer rounded-lg border p-3 transition-colors ${
                                                            data.datacenter === loc.id
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-gray-200 hover:border-gray-300'
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
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Button>
                                        <Button type="button" onClick={nextStep} className="flex-1">
                                            Continuer
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Step 3: Confirm */}
                        {step === 3 && (
                            <Card>
                                <CardHeader className="text-center">
                                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <Check className="h-8 w-8 text-green-600" />
                                    </div>
                                    <CardTitle>Prêt à créer votre assistant !</CardTitle>
                                    <CardDescription>
                                        Vérifiez les informations ci-dessous
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Summary */}
                                    <div className="rounded-xl bg-gray-50 p-6 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Nom</span>
                                            <span className="font-semibold flex items-center gap-2">
                                                <Bot className="h-4 w-4 text-primary" />
                                                {data.name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Formule</span>
                                            <span className="font-semibold">{selectedType?.label}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Localisation</span>
                                            <span className="font-semibold flex items-center gap-2">
                                                {selectedLocation?.flag} {selectedLocation?.name}
                                            </span>
                                        </div>
                                        <hr />
                                        <div className="flex justify-between items-center text-lg">
                                            <span className="font-medium">Total</span>
                                            <span className="font-bold text-primary">
                                                €{selectedType?.monthly_price.toFixed(2)}/mois
                                            </span>
                                        </div>
                                    </div>

                                    {/* Credit balance */}
                                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                                        <span className="text-blue-700">Votre solde actuel</span>
                                        <span className="font-bold text-blue-700">€{creditBalance.toFixed(2)}</span>
                                    </div>

                                    {/* Info message */}
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertDescription>
                                            Votre assistant sera prêt en 5-10 minutes. Vous pourrez y accéder 
                                            directement depuis votre navigateur.
                                        </AlertDescription>
                                    </Alert>

                                    {/* Insufficient credits warning */}
                                    {!canCreate && (
                                        <Alert variant="destructive">
                                            <AlertDescription>
                                                Solde insuffisant. Vous avez €{creditBalance.toFixed(2)} mais il faut €{selectedType?.monthly_price.toFixed(2)}.{' '}
                                                <Link href={route('credits.index')} className="underline font-medium">
                                                    Recharger mes crédits
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
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Retour
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={processing || !canCreate} 
                                            className="flex-1"
                                        >
                                            {processing ? (
                                                'Création en cours...'
                                            ) : (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Créer mon assistant
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
