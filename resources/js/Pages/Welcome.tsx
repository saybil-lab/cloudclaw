import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Server, Zap, Shield, CreditCard, ArrowRight } from 'lucide-react';

interface Props {
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
}

export default function Welcome({ canLogin, canRegister }: Props) {
    return (
        <>
            <Head title="Welcome to CloudClaw" />
            <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
                {/* Header */}
                <header className="py-6 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Cloud className="h-8 w-8 text-primary" />
                        <span className="text-2xl font-bold">CloudClaw</span>
                    </div>
                    <nav className="flex items-center gap-4">
                        {canLogin && (
                            <Link href={route('login')}>
                                <Button variant="ghost">Log in</Button>
                            </Link>
                        )}
                        {canRegister && (
                            <Link href={route('register')}>
                                <Button>Get Started</Button>
                            </Link>
                        )}
                    </nav>
                </header>

                {/* Hero */}
                <section className="py-20 px-8 text-center">
                    <Badge variant="secondary" className="mb-4">
                        🚀 Now in Beta
                    </Badge>
                    <h1 className="text-5xl font-bold tracking-tight mb-6">
                        Deploy Your Own AI Assistant
                        <br />
                        <span className="text-primary">In Minutes</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                        CloudClaw makes it easy to deploy and manage your personal OpenClaw instance.
                        Pay only for what you use with our simple credit system.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        {canRegister && (
                            <Link href={route('register')}>
                                <Button size="lg" className="text-lg px-8">
                                    Start Free
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        )}
                        <Button variant="outline" size="lg" className="text-lg px-8">
                            View Pricing
                        </Button>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20 px-8 max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Everything You Need
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <Card>
                            <CardHeader>
                                <Server className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>One-Click Deploy</CardTitle>
                                <CardDescription>
                                    Launch your OpenClaw server with a single click.
                                    We handle all the setup and configuration.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <Zap className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>High Performance</CardTitle>
                                <CardDescription>
                                    Powered by Hetzner cloud infrastructure.
                                    Fast, reliable, and available worldwide.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CreditCard className="h-10 w-10 text-primary mb-2" />
                                <CardTitle>Pay As You Go</CardTitle>
                                <CardDescription>
                                    No monthly commitments. Add credits and pay only
                                    for the server time you actually use.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </section>

                {/* Pricing */}
                <section className="py-20 px-8 bg-gray-50">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-center text-muted-foreground mb-12">
                            Choose the server that fits your needs
                        </p>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Starter</CardTitle>
                                    <CardDescription>2 vCPU, 4GB RAM</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">€0.0065<span className="text-lg font-normal">/hr</span></div>
                                    <p className="text-sm text-muted-foreground">~€4.68/month</p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li>✓ 40GB SSD</li>
                                        <li>✓ Perfect for personal use</li>
                                        <li>✓ Full OpenClaw features</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="border-primary">
                                <CardHeader>
                                    <Badge className="w-fit mb-2">Popular</Badge>
                                    <CardTitle>Standard</CardTitle>
                                    <CardDescription>4 vCPU, 8GB RAM</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">€0.013<span className="text-lg font-normal">/hr</span></div>
                                    <p className="text-sm text-muted-foreground">~€9.36/month</p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li>✓ 80GB SSD</li>
                                        <li>✓ Better for teams</li>
                                        <li>✓ Full OpenClaw features</li>
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Performance</CardTitle>
                                    <CardDescription>8 vCPU, 16GB RAM</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">€0.026<span className="text-lg font-normal">/hr</span></div>
                                    <p className="text-sm text-muted-foreground">~€18.72/month</p>
                                    <ul className="mt-4 space-y-2 text-sm">
                                        <li>✓ 160GB SSD</li>
                                        <li>✓ Heavy workloads</li>
                                        <li>✓ Full OpenClaw features</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 px-8 text-center">
                    <h2 className="text-3xl font-bold mb-4">
                        Ready to Get Started?
                    </h2>
                    <p className="text-muted-foreground mb-8">
                        Create your account and deploy your first server in minutes.
                    </p>
                    {canRegister && (
                        <Link href={route('register')}>
                            <Button size="lg" className="text-lg px-8">
                                Create Free Account
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    )}
                </section>

                {/* Footer */}
                <footer className="py-8 px-8 border-t text-center text-muted-foreground">
                    <p>© 2024 CloudClaw. All rights reserved.</p>
                </footer>
            </div>
        </>
    );
}
