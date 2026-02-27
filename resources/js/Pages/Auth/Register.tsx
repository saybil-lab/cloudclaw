import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/Components/ui/field';
import { Input } from '@/Components/ui/input';
import { GoogleIcon } from '@/Components/SocialIcons';
import { Separator } from '@/Components/ui/separator';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const handleGoogleLogin = () => {
        window.location.href = route('auth.google');
    };

    return (
        <>
            <Head title="Create Account" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
                <div className="mb-8 flex items-center gap-2">
                    <img src="/images/logo.avif" alt="ClawdClaw" className="h-10 w-10 rounded-full object-cover" />
                    <span className="text-2xl font-light tracking-wide">ClawdClaw</span>
                </div>

                <div className="w-full max-w-md">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Create your account</CardTitle>
                            <CardDescription>
                                Get your AI assistant in under a minute
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Google Auth */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11"
                                onClick={handleGoogleLogin}
                            >
                                <GoogleIcon className="h-4 w-4 mr-2" />
                                Continue with Google
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <form onSubmit={submit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="John Doe"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            autoComplete="name"
                                            autoFocus
                                            required
                                        />
                                        {errors.name && <FieldError>{errors.name}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            autoComplete="email"
                                            required
                                        />
                                        {errors.email && <FieldError>{errors.email}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                        <FieldDescription>
                                            Must be at least 8 characters long
                                        </FieldDescription>
                                        {errors.password && <FieldError>{errors.password}</FieldError>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password_confirmation">Confirm Password</FieldLabel>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            autoComplete="new-password"
                                            required
                                        />
                                        {errors.password_confirmation && (
                                            <FieldError>{errors.password_confirmation}</FieldError>
                                        )}
                                    </Field>

                                    <Field>
                                        <Button
                                            type="submit"
                                            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                                            disabled={processing}
                                        >
                                            {processing ? 'Creating account...' : 'Create account'}
                                        </Button>
                                        <FieldDescription className="text-center">
                                            Already have an account?{' '}
                                            <Link href={route('login')} className="font-medium text-gray-900 hover:underline">
                                                Sign in
                                            </Link>
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
