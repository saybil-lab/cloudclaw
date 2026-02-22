import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { TelegramIcon, DiscordIcon, WhatsAppIcon, GoogleIcon, ClaudeIcon, OpenAIIcon, GeminiIcon } from './SocialIcons';
import { Check, LogOut } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { usePage, router } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function DeployAssistant() {
    const { auth } = usePage<any>().props;
    const user = auth.user;

    const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt' | 'gemini'>('claude');
    const [selectedChannel, setSelectedChannel] = useState<'telegram' | 'discord' | 'whatsapp'>('telegram');

    const handleGoogleLogin = () => {
        window.location.href = route('auth.google');
    };

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const [isLoading, setIsLoading] = useState(false);

    const getCookie = (name: string): string => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()?.split(';').shift() || '')
        }
        return ''
    }

    const handleDeploy: FormEventHandler = async (e) => {
        e.preventDefault();

        setIsLoading(true);
        trackEvent('begin_checkout');

        try {
            const response = await fetch('/subscription/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
                },
                credentials: 'same-origin',
            })

            const data = await response.json()

            if (data.error) {
                console.error(data.error);
                setIsLoading(false);
                return;
            }

            if (data.mock || data.success) {
                window.location.reload();
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error('An error occurred during checkout.', err);
            setIsLoading(false);
        }
    };

    const renderSubtext = () => {
        if (!user) {
            return (
                <>
                    Sign in to deploy your ai assistant and connect your channels. <span className="text-blue-600 font-medium tracking-tight">Limited cloud servers — only 23 left</span>
                </>
            );
        }
        return (
            <>
                <span className="font-semibold text-foreground">$39 per month.</span> Includes $15 in AI credits refreshed monthly. <span className="text-blue-600 font-medium tracking-tight">Limited cloud servers — only 23 left</span>
            </>
        );
    };

    return (
        <>
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
                        <>
                            <div className="flex items-center gap-3 mb-2 px-1">

                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} className="h-10 w-10 rounded-full bg-muted border border-border" />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold border border-border">
                                        {user.name?.charAt(0)}
                                    </div>
                                )}
                                <div className="flex flex-col items-start p-0 h-auto gap-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[14px] font-medium text-foreground">{user.name}</span>
                                        <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                                            <LogOut className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <span className="text-[12px] text-muted-foreground">{user.email}</span>
                                </div>
                            </div>

                            <form onSubmit={handleDeploy} className="w-full">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    variant="default"
                                    className="w-full sm:w-auto bg-foreground text-background hover:bg-foreground/90 h-11 px-6 rounded-xl text-[14px] font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-r-transparent mr-1" />
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                            <path d="M11.5 2 L2 12 H10 V22 L19.5 12 H11.5 Z" />
                                        </svg>
                                    )}
                                    {isLoading ? 'Processing...' : 'Deploy OpenClaw'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <Button
                            onClick={handleGoogleLogin}
                            variant={"outline"}
                            className="w-full sm:w-auto h-11 px-5 rounded-xl text-[14px] font-semibold transition-all bg-transparent border-gray-300 hover:bg-gray-50 text-gray-900 active:scale-[0.98] flex items-center justify-center"
                        >
                            <GoogleIcon className="h-4 w-4 mr-2" />
                            Sign in with Google
                        </Button>
                    )}

                    <p className="text-[13px] text-muted-foreground leading-relaxed px-1">
                        {renderSubtext()}
                    </p>
                </div>
            </Card>

        </>
    );
}
