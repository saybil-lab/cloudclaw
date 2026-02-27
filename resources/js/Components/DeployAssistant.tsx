import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { TelegramIcon, DiscordIcon, WhatsAppIcon, GoogleIcon, ClaudeIcon, OpenAIIcon, GeminiIcon } from './SocialIcons';
import { Check, ArrowRight } from 'lucide-react';
import { usePage } from '@inertiajs/react';

export default function DeployAssistant() {
    const { auth } = usePage<any>().props;
    const user = auth.user;

    const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt' | 'gemini'>('claude');
    const [selectedChannel, setSelectedChannel] = useState<'telegram' | 'discord' | 'whatsapp'>('telegram');

    const handleGoogleLogin = () => {
        window.location.href = route('auth.google');
    };

    const handleGoToDashboard = () => {
        window.location.href = '/dashboard';
    };

    return (
        <Card className="w-full max-w-[640px] mx-auto bg-card border-border p-8 shadow-xl rounded-[24px]">
            {/* Model Selection */}
            <div className="mb-4">
                <h3 className="text-left text-foreground/90 text-[15px] font-medium mb-5 px-1">Which model do you want as default?</h3>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <button
                        onClick={() => setSelectedModel('claude')}
                        className={`flex items-center justify-between sm:justify-start gap-4 px-4 h-12 w-full sm:w-auto rounded-xl border transition-all duration-200 ${selectedModel === 'claude'
                            ? 'bg-secondary border-primary/20 text-foreground'
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <ClaudeIcon className="h-5 w-5 text-orange-500" />
                            <span className="text-[14px] font-medium">Claude Opus 4.6</span>
                        </div>
                        {selectedModel === 'claude' && <Check className="h-4 w-4 text-muted-foreground sm:ml-2 flex-shrink-0" />}
                    </button>

                    <button
                        onClick={() => setSelectedModel('gpt')}
                        className={`flex items-center justify-between sm:justify-start gap-4 px-4 h-12 w-full sm:w-auto rounded-xl border transition-all duration-200 ${selectedModel === 'gpt'
                            ? 'bg-secondary border-primary/20 text-foreground'
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <OpenAIIcon className="h-5 w-5 text-foreground/80" />
                            <span className="text-[14px] font-medium">GPT-5.2</span>
                        </div>
                        {selectedModel === 'gpt' && <Check className="h-4 w-4 text-muted-foreground sm:ml-2 flex-shrink-0" />}
                    </button>

                    <button
                        onClick={() => setSelectedModel('gemini')}
                        className={`flex items-center justify-between sm:justify-start gap-4 px-4 h-12 w-full sm:w-auto rounded-xl border transition-all duration-200 ${selectedModel === 'gemini'
                            ? 'bg-secondary border-primary/20 text-foreground'
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <GeminiIcon className="h-5 w-5" />
                            <span className="text-[14px] font-medium">Gemini 3 Pro</span>
                        </div>
                        {selectedModel === 'gemini' && <Check className="h-4 w-4 text-muted-foreground sm:ml-2 flex-shrink-0" />}
                    </button>
                </div>
            </div>

            {/* Channel Selection */}
            <div className="mb-8">
                <h3 className="text-left text-foreground/90 text-[15px] font-medium mb-5 px-1">Which channel do you want to use for sending messages?</h3>
                <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    <button
                        onClick={() => setSelectedChannel('telegram')}
                        className={`flex items-center justify-between sm:justify-start gap-4 px-3 h-12 w-full sm:w-auto rounded-xl border transition-all duration-200 ${selectedChannel === 'telegram'
                            ? 'bg-secondary border-primary/20 text-foreground'
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <TelegramIcon className="h-5 w-5 text-blue-500" />
                            <span className="text-[14px] font-medium">Telegram</span>
                        </div>
                        {selectedChannel === 'telegram' && <Check className="h-4 w-4 text-muted-foreground sm:ml-2 flex-shrink-0" />}
                    </button>

                    <button
                        onClick={() => setSelectedChannel('discord')}
                        className={`flex items-center justify-between sm:justify-start gap-4 px-3 h-12 w-full sm:w-auto rounded-xl border transition-all duration-200 ${selectedChannel === 'discord'
                            ? 'bg-secondary border-primary/20 text-foreground'
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <DiscordIcon className="h-5 w-5" />
                            <span className="text-[14px] font-medium">Discord</span>
                        </div>
                        {selectedChannel === 'discord' && <Check className="h-4 w-4 text-muted-foreground sm:ml-2 flex-shrink-0" />}
                    </button>

                    <button
                        onClick={() => setSelectedChannel('whatsapp')}
                        className={`flex items-center justify-between sm:justify-start gap-4 px-3 h-12 w-full sm:w-auto rounded-xl border transition-all duration-200 ${selectedChannel === 'whatsapp'
                            ? 'bg-secondary border-primary/20 text-foreground'
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <WhatsAppIcon className="h-5 w-5 text-green-500" />
                            <span className="text-[14px] font-medium">WhatsApp</span>
                        </div>
                        {selectedChannel === 'whatsapp' && <Check className="h-4 w-4 text-muted-foreground sm:ml-2 flex-shrink-0" />}
                    </button>
                </div>
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-start gap-5">
                {user ? (
                    <Button
                        onClick={handleGoToDashboard}
                        variant="default"
                        className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-xl text-[14px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        Go to Dashboard
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleGoogleLogin}
                        variant="outline"
                        className="w-full sm:w-auto h-11 px-5 rounded-xl text-[14px] font-semibold transition-all bg-transparent border-gray-300 hover:bg-gray-50 text-gray-900 active:scale-[0.98] flex items-center justify-center"
                    >
                        <GoogleIcon className="h-4 w-4 mr-2" />
                        Sign in with Google
                    </Button>
                )}

                <p className="text-[13px] text-muted-foreground leading-relaxed px-1">
                    {user ? (
                        <>Choose your plan starting at <span className="font-semibold text-foreground">$15/month</span> with 1,000 AI credits included.</>
                    ) : (
                        <>Sign in to get your AI assistant on Telegram in under a minute. Plans start at <span className="font-semibold text-foreground">$15/month</span>.</>
                    )}
                </p>
            </div>
        </Card>
    );
}
