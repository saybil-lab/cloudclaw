<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        try {
            \Illuminate\Support\Facades\Log::info('Google Auth Callback Started');
            
            $googleUser = Socialite::driver('google')->stateless()->user();
            \Illuminate\Support\Facades\Log::info('Google User Retrieved', ['email' => $googleUser->getEmail(), 'id' => $googleUser->getId()]);
            
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                \Illuminate\Support\Facades\Log::info('Creating new user');
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                    'password' => bcrypt(Str::random(16)),
                    'email_verified_at' => now(),
                ]);
                session()->flash('gtm_event', 'sign_up');
            } else {
                \Illuminate\Support\Facades\Log::info('Updating existing user', ['id' => $user->id]);
                $user->update([
                    'google_id' => $googleUser->getId(),
                    'avatar' => $googleUser->getAvatar(),
                ]);
            }

            Auth::login($user);
            \Illuminate\Support\Facades\Log::info('User logged in', ['id' => $user->id]);

            return redirect()->intended('/');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google Login Error: ' . $e->getMessage());
            \Illuminate\Support\Facades\Log::error($e->getTraceAsString());
            return redirect()->route('login')->with('error', 'Something went wrong with Google Login: ' . $e->getMessage());
        }
    }
}
