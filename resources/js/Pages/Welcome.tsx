import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { PhoneInput } from '@/Components/ui/phone-input';
import { Server, Zap, Shield, MessageCircle, ArrowRight, Menu, Star, ChevronLeft, ChevronRight, Bell, Calendar, Mail, Clock, PenTool, Globe, Calculator, Handshake, ShoppingCart, Search, Users, FileText, BarChart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { GoogleIcon } from '@/Components/SocialIcons';

interface Props {
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
}

const testimonials = [
    {
        quote: "ClawdClaw has transformed how I manage my daily tasks. It's like having a personal chief of staff available 24/7.",
        name: "Sarah Chen",
        title: "CEO, TechVentures Inc.",
        rating: 5,
    },
    {
        quote: "The security aspect sold me. Knowing my data stays on my own instance gives me peace of mind.",
        name: "Michael Torres",
        title: "CFO, Global Finance Group",
        rating: 5,
    },
    {
        quote: "Setup took less than a minute. Now I can't imagine running my company without it.",
        name: "Emma Williams",
        title: "Founder, StartupLab",
        rating: 5,
    },
    {
        quote: "I asked my assistant to scan my entire mailbox and extract emails of prospects. In a few seconds, I had 4,500 contacts ready to use.",
        name: "David Park",
        title: "VP Sales, GrowthMakers",
        rating: 5,
    },
];

const useCases = [
    [
        { text: "Notify before a meeting", icon: Bell },
        { text: "Schedule meetings from chat", icon: Calendar },
        { text: "Read & summarize email", icon: Mail },
        { text: "Draft replies", icon: PenTool },
        { text: "Remind you of deadlines", icon: Clock },
        { text: "Plan your week", icon: Calendar },
        { text: "Take meeting notes", icon: PenTool },
    ],
    [
        { text: "Sync across time zones", icon: Globe },
        { text: "Do your taxes", icon: Calculator },
        { text: "Negotiate deals", icon: Handshake },
        { text: "Run payroll calculations", icon: Calculator },
        { text: "Negotiate refunds", icon: Handshake },
        { text: "Find coupons", icon: ShoppingCart },
        { text: "Find best prices online", icon: Search },
    ],
    [
        { text: "Write contracts and NDAs", icon: FileText },
        { text: "Research competitors", icon: Search },
        { text: "Screen and prioritize leads", icon: Users },
        { text: "Generate invoices", icon: FileText },
        { text: "Run standup summaries", icon: MessageCircle },
        { text: "Track OKRs and KPIs", icon: BarChart },
        { text: "Monitor news and alerts", icon: Bell },
    ]
];

function UseCasesSection() {
    return (
        <section className="py-24 bg-white overflow-hidden border-t border-border">
            <div className="max-w-5xl mx-auto px-8 text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                    What can OpenClaw do for you?
                </h2>
                <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                    One assistant, thousands of use cases
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-4 relative">
                {/* Edge Fades */}
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none hidden md:block" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none hidden md:block" />

                <div className="flex flex-col gap-6">
                    {useCases.map((row, i) => (
                        <div key={i} className="flex relative overflow-hidden h-14">
                            <div className={`flex gap-4 items-center whitespace-nowrap ${i === 0 ? 'animate-marquee' : i === 1 ? 'animate-marquee-reverse' : 'animate-marquee-slow'
                                }`}>
                                {[...row, ...row, ...row, ...row].map((item, j) => (
                                    <div key={j} className="flex items-center gap-2.5 px-5 h-11 bg-zinc-50 border border-border rounded-full shadow-sm hover:border-primary/20 transition-colors group">
                                        <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        <span className="text-[14px] font-medium text-foreground/80">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-8 text-center mt-16">
                <p className="text-sm text-muted-foreground italic">
                    PS. You can add as many use cases as you want via natural language
                </p>
            </div>
        </section>
    );
}

function TestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalSlides = Math.ceil(testimonials.length / 2);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    return (
        <section id="testimonials" className="py-20 px-8 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-4">
                    Loved by Executives and CEOs
                </h2>
                <p className="text-center text-muted-foreground mb-12">
                    Join thousands of leaders who trust ClawdClaw
                </p>

                <div className="relative">
                    {/* Slider */}
                    <div className="overflow-hidden">
                        <div
                            className="flex transition-transform duration-500 ease-in-out"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                                <div key={slideIndex} className="w-full flex-shrink-0 px-4">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {testimonials.slice(slideIndex * 2, slideIndex * 2 + 2).map((testimonial, index) => (
                                            <Card key={index} className="bg-white">
                                                <CardContent className="pt-6 pb-6">
                                                    {/* Stars */}
                                                    <div className="flex gap-1 mb-4">
                                                        {[...Array(testimonial.rating)].map((_, i) => (
                                                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                        ))}
                                                    </div>
                                                    {/* Quote */}
                                                    <blockquote className="text-gray-700 mb-6 leading-relaxed">
                                                        "{testimonial.quote}"
                                                    </blockquote>
                                                    {/* Author */}
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                                        <p className="text-sm text-gray-500">{testimonial.title}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
                    >
                        <ChevronRight className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalSlides }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2 w-2 rounded-full transition-colors ${index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function Welcome({ canLogin, canRegister }: Props) {
    return (
        <>
            <Head title="Welcome to ClawdClaw" />
            <div className="min-h-screen bg-white">
                {/* Header */}
                <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto flex h-16 items-center justify-between px-4">
                        <Link href="/" className="flex items-center gap-2">
                            <img src="/images/logo.avif" alt="ClawdClaw" className="h-8 w-8 rounded-full object-cover" />
                            <span className="text-xl font-light tracking-wide">ClawdClaw</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <a
                                href="#features"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#testimonials"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Testimonials
                            </a>
                            <a
                                href="#pricing"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Pricing
                            </a>
                            <a
                                href="#faq"
                                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                FAQ
                            </a>
                        </nav>
                        <div className="hidden md:flex items-center gap-4">
                            {canLogin ? (
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-gray-900 text-white shadow hover:bg-gray-800 h-9 px-4 py-2"
                                >
                                    Get my Assistant
                                </Link>
                            ) : (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-gray-900 text-white shadow hover:bg-gray-800 h-9 px-4 py-2"
                                >
                                    Dashboard
                                </Link>
                            )}
                        </div>
                        <button className="md:hidden p-2">
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </header>

                {/* Hero */}
                <section className="py-28 md:py-36 px-8">
                    <div className="mx-auto max-w-5xl text-center">
                        <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-gray-100 text-gray-700 mb-6">
                            Join 5,000+ Executives and CEOs using ClawdClaw
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Your <span className="text-primary">OpenClaw</span> Assistant,
                            <br />
                            Ready in 30 Seconds
                        </h1>
                        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
                            A personal AI that works for you 24/7 on Telegram, WhatsApp, or the web. No setup, no code, no hassle.
                        </p>
                        <div className="mt-10 flex flex-col items-center gap-4">
                            {canLogin ? (
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold transition-all bg-gray-900 text-white shadow-lg hover:bg-gray-800 active:scale-[0.98] h-14 px-10"
                                >

                                    Get My Assistant Now
                                    <ArrowRight className="ml-1 h-5 w-5" />
                                </Link>
                            ) : (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold transition-all bg-gray-900 text-white shadow-lg hover:bg-gray-800 active:scale-[0.98] h-14 px-10"
                                >
                                    Go to Dashboard
                                    <ArrowRight className="ml-1 h-5 w-5" />
                                </Link>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Plans starting at <span className="font-semibold text-foreground">$15/month</span> with 1,000 AI credits included. Cancel anytime.
                            </p>
                        </div>

                        {/* Use case carousel */}
                        <div className="mt-14 relative overflow-hidden max-w-3xl mx-auto">
                            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                            <div className="flex gap-3 animate-marquee">
                                {[
                                    { icon: Mail, text: "Read & reply to emails" },
                                    { icon: Calendar, text: "Schedule meetings" },
                                    { icon: Search, text: "Research competitors" },
                                    { icon: FileText, text: "Draft contracts" },
                                    { icon: Users, text: "Screen leads" },
                                    { icon: BarChart, text: "Track KPIs" },
                                    { icon: Bell, text: "Meeting reminders" },
                                    { icon: Calculator, text: "Run payroll" },
                                    { icon: PenTool, text: "Write proposals" },
                                    { icon: Globe, text: "Sync time zones" },
                                    { icon: Mail, text: "Read & reply to emails" },
                                    { icon: Calendar, text: "Schedule meetings" },
                                    { icon: Search, text: "Research competitors" },
                                    { icon: FileText, text: "Draft contracts" },
                                    { icon: Users, text: "Screen leads" },
                                    { icon: BarChart, text: "Track KPIs" },
                                    { icon: Bell, text: "Meeting reminders" },
                                    { icon: Calculator, text: "Run payroll" },
                                    { icon: PenTool, text: "Write proposals" },
                                    { icon: Globe, text: "Sync time zones" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-border rounded-full shrink-0">
                                        <item.icon className="h-3.5 w-3.5 text-primary" />
                                        <span className="text-xs font-medium text-foreground/70 whitespace-nowrap">{item.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comparison */}
                <section className="py-24 px-8 bg-zinc-50/50 border-y border-border">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-sm font-semibold text-primary tracking-wider uppercase mb-3 inline-block">Comparison</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                                Traditional Method vs ClawdClaw
                            </h2>
                        </div>

                        <div className="flex flex-col md:flex-row gap-0 border border-border rounded-2xl overflow-hidden bg-background shadow-sm">
                            {/* Left Side - Traditional */}
                            <div className="flex-1 p-8 md:p-12 border-b md:border-b-0 md:border-r border-border bg-zinc-50/50">
                                <h3 className="text-xl font-semibold mb-8 text-muted-foreground italic">Traditional</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Purchasing local virtual machine</span>
                                        <span>15 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Creating SSH keys and storing securely</span>
                                        <span>10 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Connecting to the server via SSH</span>
                                        <span>5 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Installing Node.js and NPM</span>
                                        <span>5 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Installing OpenClaw</span>
                                        <span>7 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Setting up OpenClaw</span>
                                        <span>10 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Connecting to AI provider</span>
                                        <span>4 min</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
                                        <span>Pairing with Telegram</span>
                                        <span>4 min</span>
                                    </div>
                                </div>
                                <div className="border-t border-border pt-6 flex justify-between items-center font-bold text-lg text-foreground mb-6">
                                    <span>Total</span>
                                    <span>60 min</span>
                                </div>
                                <p className="text-sm text-muted-foreground italic leading-relaxed">
                                    If you're <span className="text-red-500 font-semibold">non-technical</span>, multiply these <span className="text-red-500 font-semibold bg-red-50 px-1 rounded">times by 10</span> — you have to learn each step before doing.
                                </p>
                            </div>

                            {/* Right Side - ClawdClaw */}
                            <div className="flex-1 p-8 md:p-12 bg-background flex flex-col justify-center">
                                <h3 className="text-xl font-semibold mb-6 text-foreground italic">ClawdClaw</h3>
                                <div className="text-5xl md:text-7xl font-bold text-foreground mb-6 tracking-tight">
                                    &lt; 1 min
                                </div>
                                <p className="text-base md:text-lg text-muted-foreground mb-6 leading-relaxed">
                                    Pick a model, connect Telegram, deploy — done under 1 minute.
                                </p>
                                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                                    Servers, SSH and OpenClaw Environment are already set up, waiting to get assigned. Simple, secure and fast connection to your bot.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-24 px-8 max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Everything You Need
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <Card>
                            <CardHeader>
                                <Server className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>One-Click Deploy</CardTitle>
                                <CardDescription>
                                    Get started in less than 60 seconds. We handle all the setup and configuration.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Shield className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Your Own Instance</CardTitle>
                                <CardDescription>
                                    All your data stays on a dedicated machine. Your data remains yours. Security first.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <MessageCircle className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Chat Anywhere</CardTitle>
                                <CardDescription>
                                    Talk to your assistant on Slack, Telegram, WhatsApp, or the web. Always available.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Zap className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>High Performance</CardTitle>
                                <CardDescription>
                                    Powered by the latest AI models, including Opus 4.6.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>

                {/* Testimonials */}
                <TestimonialsSection />

                {/* Use Cases */}
                <UseCasesSection />

                {/* Pricing */}
                <section id="pricing" className="py-20 px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-muted-foreground mb-12">
                            Choose the plan that fits your needs
                        </p>

                        <div className="grid gap-6 md:grid-cols-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Starter</CardTitle>
                                    <CardDescription>For getting started</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold mb-1">$15<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                                    <p className="text-sm text-muted-foreground mb-6">1,000 credits/mo</p>
                                    <ul className="space-y-2 text-sm text-left">
                                        <li>✓ Telegram integration</li>
                                        <li>✓ Claude AI (latest models)</li>
                                        <li>✓ Cancel anytime</li>
                                    </ul>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center w-full mt-6 gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 h-10 px-6"
                                    >
                                        Get Started
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card className="border-primary relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-gray-900 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-xl">Pro</CardTitle>
                                    <CardDescription>For professionals</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold mb-1">$39<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                                    <p className="text-sm text-muted-foreground mb-6">3,000 credits/mo</p>
                                    <ul className="space-y-2 text-sm text-left">
                                        <li>✓ Telegram integration</li>
                                        <li>✓ Claude AI (latest models)</li>
                                        <li>✓ Priority support</li>
                                        <li>✓ Cancel anytime</li>
                                    </ul>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center w-full mt-6 gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-gray-900 text-white shadow hover:bg-gray-800 h-10 px-6"
                                    >
                                        Get Started
                                        <ArrowRight className="ml-1 h-4 w-4" />
                                    </Link>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-xl">Beast</CardTitle>
                                    <CardDescription>For power users</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-4xl font-bold mb-1">$89<span className="text-base font-normal text-muted-foreground">/mo</span></div>
                                    <p className="text-sm text-muted-foreground mb-6">8,000 credits/mo</p>
                                    <ul className="space-y-2 text-sm text-left">
                                        <li>✓ Telegram integration</li>
                                        <li>✓ Claude AI (latest models)</li>
                                        <li>✓ Priority support</li>
                                        <li>✓ Cancel anytime</li>
                                    </ul>
                                    <Link
                                        href={route('register')}
                                        className="inline-flex items-center justify-center w-full mt-6 gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 h-10 px-6"
                                    >
                                        Get Started
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section id="faq" className="py-20 px-8 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-6">
                        <div className="border-b pb-6">
                            <h3 className="font-semibold text-lg mb-2">What is ClawdClaw?</h3>
                            <p className="text-gray-500">
                                ClawdClaw is a service that helps you deploy your own AI assistant on a dedicated machine with full capabilities. Think of it as having us recruit and train your super AI analyst – so you don't have to deal with all the setup and configuration yourself.
                            </p>
                        </div>
                        <div className="border-b pb-6">
                            <h3 className="font-semibold text-lg mb-2">How does billing work?</h3>
                            <p className="text-gray-500">
                                You are charged on a monthly basis and can cancel anytime you want. No hidden fees, no long-term commitments.
                            </p>
                        </div>
                        <div className="border-b pb-6">
                            <h3 className="font-semibold text-lg mb-2">How can I reach my assistant?</h3>
                            <p className="text-gray-500">
                                Think of it as hiring a super employee running 24/7 with their own computer and email address. You can reach them via Telegram, email, WhatsApp, Slack, or the web.
                            </p>
                        </div>
                        <div className="border-b pb-6">
                            <h3 className="font-semibold text-lg mb-2">What tasks can my assistant perform?</h3>
                            <p className="text-gray-500">
                                Literally anything – from recruiting to prospecting to data analysis, research, email management, and much more. Your assistant adapts to your specific needs.
                            </p>
                        </div>
                        <div className="pb-6">
                            <h3 className="font-semibold text-lg mb-2">What if I have questions or need help?</h3>
                            <p className="text-gray-500">
                                We provide human support. You can reach out to us anytime for assistance and advice on how to get the most out of your assistant.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section className="py-20 px-8 bg-gray-50">
                    <div className="max-w-md mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Have a Question?
                        </h2>
                        <p className="text-gray-500 mb-8">
                            Leave your contact details and we'll call you back.
                        </p>
                        <form className="space-y-4 text-left">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="h-12 bg-white !border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone number</Label>
                                <PhoneInput
                                    defaultCountry="FR"
                                    placeholder="6 12 34 56 78"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-gray-900 hover:bg-gray-800 text-white h-12 text-base mt-2"
                            >
                                Request a Callback
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-8 px-8 border-t text-center text-gray-400">
                    <p>© 2026 ClawdClaw. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}
