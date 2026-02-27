<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Apple Sign In.
     * POST /api/auth/apple
     */
    public function apple(Request $request): JsonResponse
    {
        $request->validate([
            'identity_token' => 'required|string',
            'user' => 'nullable|array',
            'user.name' => 'nullable|string',
            'user.email' => 'nullable|email',
        ]);

        $identityToken = $request->input('identity_token');

        // Decode and verify the Apple identity token
        $payload = $this->verifyAppleToken($identityToken);

        if (!$payload) {
            return response()->json(['error' => 'Invalid Apple identity token'], 401);
        }

        $appleUserId = $payload['sub'];
        $email = $payload['email'] ?? $request->input('user.email');
        $name = $request->input('user.name');

        $isNewUser = false;
        $user = User::where('apple_user_id', $appleUserId)->first();

        if (!$user && $email) {
            // Check if user exists by email (e.g., signed up via Google on web)
            $user = User::where('email', $email)->first();
            if ($user) {
                $user->update(['apple_user_id' => $appleUserId]);
            }
        }

        if (!$user) {
            $isNewUser = true;
            $user = User::create([
                'name' => $name ?? 'CloudClaw User',
                'email' => $email ?? $appleUserId . '@apple.cloudclaw.com',
                'password' => Hash::make(Str::random(32)),
                'apple_user_id' => $appleUserId,
                'platform' => 'ios',
                'llm_billing_mode' => 'credits',
                'llm_credits' => 10.00,
                'received_welcome_bonus' => true,
                'has_consented' => false,
            ]);

            CreditTransaction::create([
                'user_id' => $user->id,
                'type' => 'bonus',
                'amount' => 10.00,
                'balance_after' => 10.00,
                'description' => 'Welcome bonus (new account)',
            ]);

            Log::info('New Apple Sign In user created', ['user_id' => $user->id, 'apple_user_id' => $appleUserId]);
        }

        // Create a Sanctum token for mobile auth
        $token = $user->createToken('mobile')->plainTextToken;

        $server = $user->servers()->where('status', '!=', 'deleted')->latest()->first();
        $credits = (float) $user->llm_credits;

        return response()->json([
            'token' => $token,
            'is_new_user' => $isNewUser,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'has_consented' => (bool) $user->has_consented,
                'subscription_status' => $user->subscription_status,
                'subscription_tier' => $user->subscription_tier,
                'llm_credits' => $credits,
                'credits_low' => $credits > 0 && $credits <= 1.00,
                'credits_depleted' => $credits <= 0,
                'has_server' => (bool) $server,
                'server' => $server ? [
                    'id' => $server->id,
                    'status' => $server->status,
                    'provision_status' => $server->provision_status,
                    'bot_username' => $server->bot_username,
                    'telegram_url' => $server->bot_username ? "https://t.me/{$server->bot_username}" : null,
                    'is_ready' => $server->isReady(),
                ] : null,
                'llm_billing_mode' => $user->llm_billing_mode ?? 'credits',
                'has_anthropic_key' => !empty($user->anthropic_api_key),
            ],
        ]);
    }

    /**
     * Set user consent.
     * POST /api/auth/consent
     */
    public function consent(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['has_consented' => true]);

        return response()->json(['ok' => true]);
    }

    /**
     * Logout — revoke current token.
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Verify Apple identity token using Apple's public keys (JWKS).
     */
    protected function verifyAppleToken(string $identityToken): ?array
    {
        try {
            $parts = explode('.', $identityToken);
            if (count($parts) !== 3) {
                return null;
            }

            // Decode header to get kid
            $header = json_decode(base64_decode(strtr($parts[0], '-_', '+/')), true);
            $kid = $header['kid'] ?? null;
            $alg = $header['alg'] ?? null;

            if (!$kid || !$alg) {
                return null;
            }

            // Fetch Apple's public keys
            $response = Http::get('https://appleid.apple.com/auth/keys');
            if (!$response->successful()) {
                Log::error('Failed to fetch Apple JWKS');
                return null;
            }

            $keys = $response->json('keys', []);
            $matchingKey = null;

            foreach ($keys as $key) {
                if ($key['kid'] === $kid) {
                    $matchingKey = $key;
                    break;
                }
            }

            if (!$matchingKey) {
                Log::error('No matching Apple key found for kid', ['kid' => $kid]);
                return null;
            }

            // Convert JWK to PEM
            $pem = $this->jwkToPem($matchingKey);

            // Decode and verify the payload
            $payload = base64_decode(strtr($parts[1], '-_', '+/'));
            $claims = json_decode($payload, true);

            // Verify signature using openssl
            $data = $parts[0] . '.' . $parts[1];
            $signature = base64_decode(strtr($parts[2], '-_', '+/'));

            $pubKey = openssl_pkey_get_public($pem);
            if (!$pubKey) {
                Log::error('Failed to parse Apple public key');
                return null;
            }

            $algMap = ['RS256' => OPENSSL_ALGO_SHA256, 'ES256' => OPENSSL_ALGO_SHA256];
            $opensslAlg = $algMap[$alg] ?? OPENSSL_ALGO_SHA256;

            // For ES256 (ECDSA), convert from JWT DER format to OpenSSL DER format
            if ($alg === 'ES256') {
                $signature = $this->ecSignatureToDer($signature);
            }

            $valid = openssl_verify($data, $signature, $pubKey, $opensslAlg);

            if ($valid !== 1) {
                Log::error('Apple token signature verification failed');
                return null;
            }

            // Verify claims
            if (($claims['iss'] ?? '') !== 'https://appleid.apple.com') {
                return null;
            }

            $bundleId = config('services.apple.bundle_id', 'com.cloudclaw.app');
            if (($claims['aud'] ?? '') !== $bundleId) {
                return null;
            }

            if (($claims['exp'] ?? 0) < time()) {
                return null;
            }

            return $claims;
        } catch (\Exception $e) {
            Log::error('Apple token verification error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Convert a JWK RSA key to PEM format.
     */
    protected function jwkToPem(array $jwk): string
    {
        if (($jwk['kty'] ?? '') === 'EC') {
            return $this->ecJwkToPem($jwk);
        }

        $n = base64_decode(strtr($jwk['n'], '-_', '+/'));
        $e = base64_decode(strtr($jwk['e'], '-_', '+/'));

        // Build the DER encoding
        $modulus = ltrim($n, "\x00");
        if (ord($modulus[0]) > 127) {
            $modulus = "\x00" . $modulus;
        }

        $exponent = ltrim($e, "\x00");
        if (ord($exponent[0]) > 127) {
            $exponent = "\x00" . $exponent;
        }

        $modulus = "\x02" . $this->derLength(strlen($modulus)) . $modulus;
        $exponent = "\x02" . $this->derLength(strlen($exponent)) . $exponent;

        $rsaPublicKey = "\x30" . $this->derLength(strlen($modulus . $exponent)) . $modulus . $exponent;

        // Wrap in bit string
        $rsaPublicKey = "\x03" . $this->derLength(strlen($rsaPublicKey) + 1) . "\x00" . $rsaPublicKey;

        // RSA OID
        $oid = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00";

        $der = "\x30" . $this->derLength(strlen($oid . $rsaPublicKey)) . $oid . $rsaPublicKey;

        return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----";
    }

    /**
     * Convert EC JWK to PEM format.
     */
    protected function ecJwkToPem(array $jwk): string
    {
        $x = base64_decode(strtr($jwk['x'], '-_', '+/'));
        $y = base64_decode(strtr($jwk['y'], '-_', '+/'));

        // Uncompressed EC point: 0x04 || x || y
        $point = "\x04" . str_pad($x, 32, "\x00", STR_PAD_LEFT) . str_pad($y, 32, "\x00", STR_PAD_LEFT);

        // P-256 OID
        $ecOid = "\x30\x13\x06\x07\x2a\x86\x48\xce\x3d\x02\x01\x06\x08\x2a\x86\x48\xce\x3d\x03\x01\x07";

        $bitString = "\x03" . $this->derLength(strlen($point) + 1) . "\x00" . $point;

        $der = "\x30" . $this->derLength(strlen($ecOid . $bitString)) . $ecOid . $bitString;

        return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der), 64, "\n") . "-----END PUBLIC KEY-----";
    }

    /**
     * Convert ES256 signature from JWS format (r || s) to DER format.
     */
    protected function ecSignatureToDer(string $signature): string
    {
        $length = max(1, (int) (strlen($signature) / 2));
        $r = ltrim(substr($signature, 0, $length), "\x00");
        $s = ltrim(substr($signature, $length), "\x00");

        if (ord($r[0]) > 127) $r = "\x00" . $r;
        if (ord($s[0]) > 127) $s = "\x00" . $s;

        $r = "\x02" . chr(strlen($r)) . $r;
        $s = "\x02" . chr(strlen($s)) . $s;

        return "\x30" . chr(strlen($r . $s)) . $r . $s;
    }

    protected function derLength(int $length): string
    {
        if ($length < 128) {
            return chr($length);
        }

        $bytes = '';
        $temp = $length;
        while ($temp > 0) {
            $bytes = chr($temp & 0xFF) . $bytes;
            $temp >>= 8;
        }

        return chr(0x80 | strlen($bytes)) . $bytes;
    }
}
