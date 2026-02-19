import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { TelegramIcon, DiscordIcon, WhatsAppIcon, GoogleIcon, ClaudeIcon, OpenAIIcon, GeminiIcon } from './SocialIcons';
import { ChannelModal } from './ChannelModal';
import { Check } from 'lucide-react';

export default function DeployAssistant() {
    const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt' | 'gemini'>('claude');
    const [selectedChannel, setSelectedChannel] = useState<'telegram' | 'discord' | 'whatsapp' | null>(null);

    const handleGoogleLogin = () => {
        window.location.href = route('auth.google');
    };

    return (
        <>
            <Card className="w-full max-w-[640px] mx-auto bg-card border-border p-8 shadow-xl rounded-[24px]">
                {/* Model Selection */}
                <div className="mb-4">
                    <h3 className="text-left text-foreground/90 text-[15px] font-medium mb-5 px-1">Which model do you want as default?</h3>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => setSelectedModel('claude')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${selectedModel === 'claude'
                                ? 'bg-secondary border-primary/20 text-foreground'
                                : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                                }`}
                        >
                            <ClaudeIcon className="h-5 w-5 text-orange-500" />
                            <span className="text-[14px] font-medium">Claude Opus 4.6</span>
                            {selectedModel === 'claude' && <Check className="h-3.5 w-3.5 text-muted-foreground ml-1" />}
                        </button>

                        <button
                            onClick={() => setSelectedModel('gpt')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${selectedModel === 'gpt'
                                ? 'bg-secondary border-primary/20 text-foreground'
                                : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                                }`}
                        >
                            <OpenAIIcon className="h-5 w-5 text-foreground/80" />
                            <span className="text-[14px] font-medium">GPT-5.2</span>
                            {selectedModel === 'gpt' && <Check className="h-3.5 w-3.5 text-muted-foreground ml-1" />}
                        </button>

                        <button
                            onClick={() => setSelectedModel('gemini')}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200 ${selectedModel === 'gemini'
                                ? 'bg-secondary border-primary/20 text-foreground'
                                : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50'
                                }`}
                        >
                            <GeminiIcon className="h-5 w-5" />
                            <span className="text-[14px] font-medium">Gemini 3 Pro</span>
                            {selectedModel === 'gemini' && <Check className="h-3.5 w-3.5 text-muted-foreground ml-1" />}
                        </button>
                    </div>
                </div>

                {/* Channel Selection */}
                <div className="mb-4">
                    <h3 className="text-left text-foreground/90 text-[15px] font-medium mb-5 px-1">Which channel do you want to use for sending messages?</h3>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => setSelectedChannel('telegram')}
                            className="flex items-center gap-3 px-5 py-3 rounded-xl border bg-transparent border-border text-foreground hover:bg-muted/50 hover:border-border/80 transition-all group"
                        >
                            <TelegramIcon className="h-5 w-5 text-blue-500" />
                            <span className="text-[14px] font-medium">Telegram</span>
                        </button>

                        <button
                            onClick={() => setSelectedChannel('discord')}
                            className="flex items-center gap-3 px-5 py-3 rounded-xl border bg-transparent border-border text-foreground hover:bg-muted/50 hover:border-border/80 transition-all group"
                        >
                            <DiscordIcon className="h-5 w-5 text-indigo-500" />
                            <span className="text-[14px] font-medium">Discord</span>
                        </button>

                        <button
                            onClick={() => setSelectedChannel('whatsapp')}
                            className="flex items-center gap-3 px-5 py-3 rounded-xl border bg-transparent border-border text-foreground hover:bg-muted/50 hover:border-border/80 transition-all group"
                        >
                            <WhatsAppIcon className="h-5 w-5 text-green-500" />
                            <span className="text-[14px] font-medium">WhatsApp</span>
                        </button>
                    </div>
                </div>

                {/* Login */}
                <div className="flex flex-col items-start gap-4">
                    <Button
                        onClick={handleGoogleLogin}
                        variant={"outline"}
                        className=" h-11 px-5 rounded-xl text-[14px] font-semibold transition-all active:scale-[0.98]"
                    >
                        <GoogleIcon className="h-4 w-4 mr-2" />
                        Sign in with Google
                    </Button>
                    <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[500px]">

                        Launch your AI assistant in seconds and connect all your channels. <span className="text-blue-600 font-medium">Only 23 cloud spots remaining.</span>

                    </p>
                </div>
            </Card>

            {/* Modals */}
            {selectedChannel && (
                <ChannelModal
                    isOpen={!!selectedChannel}
                    onClose={() => setSelectedChannel(null)}
                    channel={selectedChannel}
                />
            )}
        </>
    );
}
