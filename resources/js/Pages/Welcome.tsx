import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Server, Zap, Shield, MessageCircle, ArrowRight, Menu, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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
                            className={`h-2 w-2 rounded-full transition-colors ${
                                index === currentIndex ? 'bg-gray-900' : 'bg-gray-300'
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
                <section className="py-24 px-8">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200 mb-4">
                            Join 5000+ Executives and CEOs using ClawdClaw
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                            Your <span className="text-primary">OpenClaw</span> Assistant
                            <br />
                            in 60 seconds
                        </h1>
                        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                            Your personal AI assistant. Chat with it on Slack, Telegram,
                            WhatsApp or the web – it learns your workflows, manages tasks, and gets things done.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href={route('register')}
                                className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-gray-900 text-white shadow hover:bg-gray-800 h-10 rounded-md text-lg px-8"
                            >
                                Get my Assistant
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            No technical skills required. Cancel anytime.
                        </p>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="py-20 px-8 max-w-6xl mx-auto">
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

                {/* Pricing */}
                <section id="pricing" className="py-20 px-8">
                    <div className="max-w-xl mx-auto text-center">
                        <h2 className="text-3xl font-bold mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-muted-foreground mb-12">
                            One plan, everything included
                        </p>

                        <Card className="border-primary">
                            <CardHeader>
                                <CardTitle className="text-2xl">Pro</CardTitle>
                                <CardDescription>Everything you need</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold mb-2">$199<span className="text-xl font-normal text-muted-foreground">/month</span></div>
                                <ul className="mt-6 space-y-3 text-sm text-left">
                                    <li>✓ Your own dedicated instance</li>
                                    <li>✓ Unlimited conversations</li>
                                    <li>✓ Slack, Telegram, WhatsApp integration</li>
                                    <li>✓ Latest AI models (including Opus 4.6)</li>
                                    <li>✓ Priority support (human)</li>
                                    <li>✓ Personalized advisory service tailored to your use cases</li>
                                    <li>✓ Cancel anytime</li>
                                </ul>
                                <Link
                                    href={route('register')}
                                    className="inline-flex items-center justify-center w-full mt-8 gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-gray-900 text-white shadow hover:bg-gray-800 h-11 px-8"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </CardContent>
                        </Card>
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
