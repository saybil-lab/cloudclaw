import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { TelegramIcon, DiscordIcon, WhatsAppIcon } from './SocialIcons';
import { useState } from 'react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

interface ChannelModalProps {
    isOpen: boolean;
    onClose: () => void;
    channel: 'telegram' | 'discord' | 'whatsapp';
    onConnect?: (token: string) => void;
}

export function ChannelModal({ isOpen, onClose, channel, onConnect }: ChannelModalProps) {
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        setIsLoading(true);
        // Simulate saving
        setTimeout(() => {
            setIsLoading(false);
            if (onConnect && token) {
                onConnect(token);
            }
            onClose();
            setToken('');
        }, 800);
    };

    const channelConfig = {
        telegram: {
            name: 'Telegram',
            icon: TelegramIcon,
            color: 'text-blue-500',
            steps: [
                'Open Telegram and go to @BotFather.',
                'Start a chat and type /newbot.',
                'Follow the prompts to name your bot and choose a username.',
                'BotFather will send you a message with your bot token.',
                'Paste the token below to connect.'
            ],
            placeholder: '1234567890:ABCdef... '
        },
        discord: {
            name: 'Discord',
            icon: DiscordIcon,
            color: 'text-indigo-500',
            steps: [
                'Go to Discord Developer Portal.',
                'Create a New Application.',
                'Go to Bot tab and Add Bot.',
                'Copy the Token.'
            ],
            placeholder: 'MTA... '
        },
        whatsapp: {
            name: 'WhatsApp',
            icon: WhatsAppIcon,
            color: 'text-green-500',
            steps: [
                'Go to Meta Developers portal.',
                'Create text app.',
                'Setup WhatsApp product.',
                'Get Access Token.'
            ],
            placeholder: 'EAAG...'
        }
    };

    const config = channelConfig[channel];
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="!max-w-5xl p-0 overflow-y-auto overflow-x-hidden max-h-[100vh] bg-card border-border shadow-2xl rounded-[24px]">
                <div className="flex flex-col md:flex-row h-auto min-h-[700px]">
                    {/* Left Side: Form */}
                    <div className="flex-[1.2] p-10 flex flex-col">
                        <DialogHeader className="mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-secondary rounded-xl border border-border">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <DialogTitle className="text-xl font-semibold text-foreground/90">Connect {config.name}</DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="space-y-8 flex-1">
                            <div>
                                <h3 className="text-[14px] font-semibold text-foreground/90 mb-4 opacity-50 uppercase tracking-wider">Instructions</h3>
                                <ol className="space-y-4">
                                    {config.steps.map((step, i) => (
                                        <li key={i} className="flex gap-4 items-start">
                                            <span className="flex-shrink-0 text-muted-foreground font-mono text-sm mt-0.5">
                                                {i + 1}.
                                            </span>
                                            <span className="text-[14px] text-foreground/70 leading-relaxed">{step}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            <div className="space-y-2.5 pt-2">
                                <Label htmlFor="token" className="text-foreground/60 text-sm ml-1">Enter bot token</Label>
                                <Input
                                    id="token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder={config.placeholder}
                                    className="h-12 bg-muted/50 border-input text-foreground placeholder:text-muted-foreground/50 font-mono text-sm rounded-xl focus:border-primary/20 transition-all"
                                />
                            </div>

                            <Button
                                onClick={handleSave}
                                disabled={isLoading || !token}
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]"
                            >
                                {isLoading ? 'Saving...' : 'Save & Connect'}
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Visual */}
                    <div className="flex-1 bg-[#111] border-t md:border-t-0 md:border-l border-border relative flex flex-col items-center justify-center overflow-hidden min-h-[700px] sm:min-h-[450px] md:min-h-0">
                        <video
                            src="/demo.mp4"
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay
                            loop
                            muted
                            playsInline
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
