import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { ArrowRight, Briefcase, TrendingUp, Users, Mail, Calendar, FileText, CheckCircle } from 'lucide-react';

interface Props {
    user: {
        name: string;
        email: string;
    };
}

const useCases = [
    { id: 'sales', label: 'Sales & Prospecting', icon: TrendingUp, description: 'Lead generation, outreach, CRM management' },
    { id: 'recruiting', label: 'Recruiting & HR', icon: Users, description: 'Candidate sourcing, screening, scheduling' },
    { id: 'executive', label: 'Executive Assistant', icon: Briefcase, description: 'Email management, scheduling, research' },
    { id: 'marketing', label: 'Marketing & Content', icon: FileText, description: 'Content creation, social media, analytics' },
    { id: 'operations', label: 'Operations & Admin', icon: Calendar, description: 'Process automation, data entry, reporting' },
    { id: 'other', label: 'Other', icon: Mail, description: 'Custom use case' },
];

const teamSizes = [
    { id: 'solo', label: 'Just me' },
    { id: 'small', label: '2-10 people' },
    { id: 'medium', label: '11-50 people' },
    { id: 'large', label: '50+ people' },
];

const priorities = [
    { id: 'time', label: 'Save time on repetitive tasks' },
    { id: 'scale', label: 'Scale operations without hiring' },
    { id: 'available', label: '24/7 availability' },
    { id: 'cost', label: 'Reduce operational costs' },
];

export default function Onboarding({ user }: Props) {
    const [step, setStep] = useState(1);
    const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
    const [selectedTeamSize, setSelectedTeamSize] = useState<string | null>(null);
    const [selectedPriority, setSelectedPriority] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsLoading(true);
        router.post(route('onboarding.complete'), {
            use_case: selectedUseCase,
            team_size: selectedTeamSize,
            priority: selectedPriority,
        });
    };

    const canProceed = () => {
        if (step === 1) return selectedUseCase !== null;
        if (step === 2) return selectedTeamSize !== null;
        if (step === 3) return selectedPriority !== null;
        return false;
    };

    return (
        <>
            <Head title="Get Started - ClawdClaw" />
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header */}
                <header className="py-6 px-8 bg-white border-b">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <img src="/images/logo.avif" alt="ClawdClaw" className="h-8 w-8 rounded-full object-cover" />
                            <span className="text-xl font-light tracking-wide">ClawdClaw</span>
                        </div>
                        <div className="text-sm text-gray-500">
                            Welcome, {user.name}
                        </div>
                    </div>
                </header>

                {/* Progress bar */}
                <div className="bg-white border-b">
                    <div className="max-w-4xl mx-auto px-8 py-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Step {step} of 3</span>
                            <span className="text-sm text-gray-500">{Math.round((step / 3) * 100)}% complete</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                            <div
                                className="h-2 bg-gray-900 rounded-full transition-all duration-300"
                                style={{ width: `${(step / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-2xl">
                        {/* Step 1: Use Case */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold mb-2">What will you use your assistant for?</h1>
                                    <p className="text-gray-500">This helps us configure your assistant for your needs</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {useCases.map((useCase) => {
                                        const Icon = useCase.icon;
                                        return (
                                            <Card
                                                key={useCase.id}
                                                className={`cursor-pointer transition-all hover:border-gray-400 ${
                                                    selectedUseCase === useCase.id
                                                        ? 'border-gray-900 ring-2 ring-gray-900'
                                                        : ''
                                                }`}
                                                onClick={() => setSelectedUseCase(useCase.id)}
                                            >
                                                <CardContent className="p-4 flex items-start gap-4">
                                                    <div className={`p-2 rounded-lg ${selectedUseCase === useCase.id ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{useCase.label}</h3>
                                                        <p className="text-sm text-gray-500">{useCase.description}</p>
                                                    </div>
                                                    {selectedUseCase === useCase.id && (
                                                        <CheckCircle className="h-5 w-5 text-gray-900 ml-auto" />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Team Size */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold mb-2">What's your team size?</h1>
                                    <p className="text-gray-500">Help us understand your organization</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {teamSizes.map((size) => (
                                        <Card
                                            key={size.id}
                                            className={`cursor-pointer transition-all hover:border-gray-400 ${
                                                selectedTeamSize === size.id
                                                    ? 'border-gray-900 ring-2 ring-gray-900'
                                                    : ''
                                            }`}
                                            onClick={() => setSelectedTeamSize(size.id)}
                                        >
                                            <CardContent className="p-6 text-center">
                                                <h3 className="font-semibold">{size.label}</h3>
                                                {selectedTeamSize === size.id && (
                                                    <CheckCircle className="h-5 w-5 text-gray-900 mx-auto mt-2" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Priority */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h1 className="text-3xl font-bold mb-2">What's your main priority?</h1>
                                    <p className="text-gray-500">We'll optimize your assistant accordingly</p>
                                </div>
                                <div className="space-y-3">
                                    {priorities.map((priority) => (
                                        <Card
                                            key={priority.id}
                                            className={`cursor-pointer transition-all hover:border-gray-400 ${
                                                selectedPriority === priority.id
                                                    ? 'border-gray-900 ring-2 ring-gray-900'
                                                    : ''
                                            }`}
                                            onClick={() => setSelectedPriority(priority.id)}
                                        >
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <h3 className="font-medium">{priority.label}</h3>
                                                {selectedPriority === priority.id && (
                                                    <CheckCircle className="h-5 w-5 text-gray-900" />
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="mt-8 flex items-center justify-between">
                            {step > 1 ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(step - 1)}
                                >
                                    Back
                                </Button>
                            ) : (
                                <div />
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed() || isLoading}
                                className="bg-gray-900 hover:bg-gray-800 text-white px-8"
                            >
                                {isLoading ? (
                                    'Loading...'
                                ) : step === 3 ? (
                                    <>
                                        Continue to Payment
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
