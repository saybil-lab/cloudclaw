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
}

export function ChannelModal({ isOpen, onClose, channel }: ChannelModalProps) {
    const [token, setToken] = useState('');

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
            <DialogContent className="!max-w-5xl p-0 overflow-hidden bg-card border-border shadow-2xl rounded-[24px]">
                <div className="flex flex-col md:flex-row h-auto min-h-[500px]">
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

                            <Button className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-[14px] font-semibold rounded-xl transition-all shadow-md active:scale-[0.98]">
                                Save & Connect
                            </Button>
                        </div>
                    </div>

                    {/* Right Side: Visual */}
                    <div className="flex-1 bg-secondary border-l border-border relative hidden md:flex flex-col items-center justify-center p-10">
                        <div className="w-full aspect-video bg-background rounded-2xl border border-border shadow-sm flex items-center justify-center group cursor-pointer hover:border-border/80 transition-all overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
                            <div className="w-16 h-16 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 border border-slate-200 shadow-sm">
                                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-slate-800 border-b-[8px] border-b-transparent ml-1"></div>
                            </div>
                        </div>
                        <div className="mt-8 text-center max-w-[240px]">
                            <h4 className="text-[15px] font-semibold text-foreground/90">Setup Tutorial</h4>
                            <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                                Watch how to set up your {config.name} bot in under 60 seconds.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
