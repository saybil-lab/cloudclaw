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
import { Checkbox } from '@/Components/ui/checkbox';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Log in" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
                <div className="mb-8 flex items-center gap-2">
                    <img src="/images/logo.avif" alt="ClawdClaw" className="h-10 w-10 rounded-full object-cover" />
                    <span className="text-2xl font-light tracking-wide">ClawdClaw</span>
                </div>

                <div className="w-full max-w-md">
                    {status && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Welcome back</CardTitle>
                            <CardDescription>
                                Enter your email below to login to your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit}>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            autoComplete="email"
                                            autoFocus
                                            required
                                        />
                                        {errors.email && <FieldError>{errors.email}</FieldError>}
                                    </Field>

                                    <Field>
                                        <div className="flex items-center justify-between">
                                            <FieldLabel htmlFor="password">Password</FieldLabel>
                                            {canResetPassword && (
                                                <Link
                                                    href={route('password.request')}
                                                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                                                >
                                                    Forgot password?
                                                </Link>
                                            )}
                                        </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            autoComplete="current-password"
                                            required
                                        />
                                        {errors.password && <FieldError>{errors.password}</FieldError>}
                                    </Field>

                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="remember"
                                            checked={data.remember}
                                            onCheckedChange={(checked) => setData('remember', checked === true)}
                                        />
                                        <FieldLabel htmlFor="remember" className="text-sm font-normal">
                                            Remember me
                                        </FieldLabel>
                                    </Field>

                                    <Field>
                                        <Button
                                            type="submit"
                                            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                                            disabled={processing}
                                        >
                                            {processing ? 'Signing in...' : 'Sign in'}
                                        </Button>
                                        <FieldDescription className="text-center">
                                            Don't have an account?{' '}
                                            <Link href={route('register')} className="font-medium text-gray-900 hover:underline">
                                                Sign up
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
