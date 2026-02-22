<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'is_admin' => $request->user()->is_admin,
                    'llm_billing_mode' => $request->user()->llm_billing_mode,
                    'avatar' => $request->user()->avatar,
                    'google_id' => $request->user()->google_id,
                    'subscription_status' => $request->user()->subscription_status,
                    'llm_credits' => $request->user()->llm_credits,
                    'onboarding_completed' => $request->user()->onboarding_completed,
                    'use_case' => $request->user()->use_case,
                    'team_size' => $request->user()->team_size,
                    'priority' => $request->user()->priority,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
                'gtm_event' => fn () => $request->session()->get('gtm_event'),
            ],
        ];
    }
}
