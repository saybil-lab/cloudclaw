import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Briefcase, TrendingUp, Users, Mail, Calendar, FileText, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    user: {
        name: string;
        email: string;
    };
}

const useCases = [
    { id: 'sales', label: 'Sales & Prospecting', icon: TrendingUp, description: 'Lead generation, outreach' },
    { id: 'recruiting', label: 'Recruiting & HR', icon: Users, description: 'Sourcing, screening' },
    { id: 'executive', label: 'Executive Assistant', icon: Briefcase, description: 'Email, scheduling' },
    { id: 'marketing', label: 'Marketing & Content', icon: FileText, description: 'Content, social media' },
    { id: 'operations', label: 'Operations & Admin', icon: Calendar, description: 'Automation, reporting' },
    { id: 'other', label: 'Other', icon: Mail, description: 'Custom use case' },
];

const teamSizes = [
    { id: 'solo', label: 'Just me', emoji: '👤' },
    { id: 'small', label: '2-10', emoji: '👥' },
    { id: 'medium', label: '11-50', emoji: '🏢' },
    { id: 'large', label: '50+', emoji: '🏛️' },
];

const priorities = [
    { id: 'time', label: 'Save time', description: 'Automate repetitive tasks', emoji: '⏱️' },
    { id: 'scale', label: 'Scale operations', description: 'Grow without hiring', emoji: '📈' },
    { id: 'available', label: '24/7 availability', description: 'Always-on assistance', emoji: '🌙' },
    { id: 'cost', label: 'Reduce costs', description: 'Cut operational expenses', emoji: '💰' },
];

export default function Onboarding({ user }: Props) {
    const [step, setStep] = useState(1);
    const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
    const [selectedTeamSize, setSelectedTeamSize] = useState<string | null>(null);
    const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const toggleUseCase = (id: string) => {
        setSelectedUseCases(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const togglePriority = (id: string) => {
        setSelectedPriorities(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

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
            use_case: selectedUseCases.join(','),
            team_size: selectedTeamSize,
            priority: selectedPriorities.join(','),
        });
    };

    const canProceed = () => {
        if (step === 1) return selectedUseCases.length > 0;
        if (step === 2) return selectedTeamSize !== null;
        if (step === 3) return selectedPriorities.length > 0;
        return false;
    };

    return (
        <>
            <Head title="Get Started - ClawdClaw" />
            <div className="min-h-screen bg-white flex flex-col">
                {/* Header - Compact on mobile */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                    <div className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="grid grid-cols-3 items-center">
                            {/* Logo - left */}
                            <div className="flex items-center gap-2">
                                <img src="/images/logo.avif" alt="ClawdClaw" className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover" />
                                <span className="text-lg sm:text-xl font-light tracking-wide hidden sm:inline">ClawdClaw</span>
                            </div>

                            {/* Step indicators - centered */}
                            <div className="flex items-center justify-center gap-2">
                                {[1, 2, 3].map((s) => (
                                    <div
                                        key={s}
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            s === step ? "w-8 bg-gray-900" : s < step ? "w-2 bg-gray-900" : "w-2 bg-gray-200"
                                        )}
                                    />
                                ))}
                            </div>

                            {/* Step counter - right */}
                            <div className="text-xs sm:text-sm text-gray-500 text-right">
                                {step}/3
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 px-4 py-6 sm:px-6 sm:py-10 md:py-16 overflow-y-auto">
                        <div className="w-full max-w-lg mx-auto">
                            {/* Step 1: Use Case */}
                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-6 sm:mb-8">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                            What will you use your assistant for?
                                        </h1>
                                        <p className="text-gray-500 text-sm sm:text-base">
                                            Select all that apply
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        {useCases.map((useCase) => {
                                            const Icon = useCase.icon;
                                            const isSelected = selectedUseCases.includes(useCase.id);
                                            return (
                                                <button
                                                    key={useCase.id}
                                                    type="button"
                                                    onClick={() => toggleUseCase(useCase.id)}
                                                    className={cn(
                                                        "relative flex flex-col items-center p-4 sm:p-5 rounded-2xl border-2 text-center transition-all duration-200",
                                                        "active:scale-[0.98]",
                                                        isSelected
                                                            ? "border-gray-900 bg-gray-50 shadow-sm"
                                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                    <div className={cn(
                                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 transition-colors",
                                                        isSelected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                                                    )}>
                                                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                                                    </div>
                                                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">{useCase.label}</h3>
                                                    <p className="text-xs text-gray-500 mt-1 hidden sm:block">{useCase.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Team Size */}
                            {step === 2 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-6 sm:mb-8">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                            What's your team size?
                                        </h1>
                                        <p className="text-gray-500 text-sm sm:text-base">
                                            This helps us tailor the experience
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        {teamSizes.map((size) => {
                                            const isSelected = selectedTeamSize === size.id;
                                            return (
                                                <button
                                                    key={size.id}
                                                    type="button"
                                                    onClick={() => setSelectedTeamSize(size.id)}
                                                    className={cn(
                                                        "relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 transition-all duration-200",
                                                        "active:scale-[0.98]",
                                                        isSelected
                                                            ? "border-gray-900 bg-gray-50 shadow-sm"
                                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                                                            <Check className="h-3 w-3 text-white" />
                                                        </div>
                                                    )}
                                                    <span className="text-3xl sm:text-4xl mb-2">{size.emoji}</span>
                                                    <h3 className="font-semibold text-base sm:text-lg text-gray-900">{size.label}</h3>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Priority */}
                            {step === 3 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="text-center mb-6 sm:mb-8">
                                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                            What are your priorities?
                                        </h1>
                                        <p className="text-gray-500 text-sm sm:text-base">
                                            Select all that apply
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {priorities.map((priority) => {
                                            const isSelected = selectedPriorities.includes(priority.id);
                                            return (
                                                <button
                                                    key={priority.id}
                                                    type="button"
                                                    onClick={() => togglePriority(priority.id)}
                                                    className={cn(
                                                        "relative flex items-center w-full p-4 sm:p-5 rounded-2xl border-2 text-left transition-all duration-200",
                                                        "active:scale-[0.99]",
                                                        isSelected
                                                            ? "border-gray-900 bg-gray-50 shadow-sm"
                                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                                                    )}
                                                >
                                                    <span className="text-2xl sm:text-3xl mr-4">{priority.emoji}</span>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-base sm:text-lg text-gray-900">{priority.label}</h3>
                                                        <p className="text-xs sm:text-sm text-gray-500">{priority.description}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center ml-3">
                                                            <Check className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fixed bottom navigation */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
                        <div className="w-full max-w-lg mx-auto flex items-center gap-3">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setStep(step - 1)}
                                    className="h-12 px-4 sm:px-6 rounded-xl border-gray-200"
                                >
                                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Back</span>
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed() || isLoading}
                                className={cn(
                                    "flex-1 h-12 sm:h-14 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-medium text-base sm:text-lg transition-all",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : step === 3 ? (
                                    <>
                                        Continue to Payment
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                ) : (
                                    <>
                                        Continue
                                        <ArrowRight className="ml-2 h-5 w-5" />
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
