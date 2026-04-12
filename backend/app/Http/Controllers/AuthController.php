<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\GoogleAuthService;
use App\Services\Auth\TokenService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        private readonly TokenService $tokenService,
        private readonly GoogleAuthService $googleAuthService,
    ) {
    }

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'password' => $request->string('password')->toString(),
            'apartment' => $request->input('apartment'),
            'phone' => $request->input('phone'),
            'role' => 'resident',
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Cuenta creada correctamente. Tu registro debe ser validado por la Administración antes de poder iniciar sesión.',
            'user' => UserResource::make($user),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (!$user || !$user->password || !Hash::check($request->string('password')->toString(), $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciales inválidas.'],
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta está desactivada.'],
            ]);
        }

        $token = $this->tokenService->issue($user, (bool) $request->boolean('remember'));

        return response()->json([
            'message' => 'Sesión iniciada.',
            'token' => $token->plainTextToken,
            'user' => UserResource::make($user),
        ]);
    }

    public function googleRedirect(): JsonResponse
    {
        return response()->json([
            'redirect_url' => $this->googleAuthService->redirectUrl(),
        ]);
    }

    public function googleCallback(Request $request)
    {
        $user = $this->googleAuthService->resolveUserFromCallback();
        $token = $this->tokenService->issue($user, true);

        $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
        $query = http_build_query([
            'token' => $token->plainTextToken,
            'name' => $user->name,
            'email' => $user->email,
        ]);

        return redirect()->away("{$frontendUrl}/auth/google/callback?{$query}");
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesión cerrada.',
        ]);
    }

    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->loadCount([
            'items',
            'borrowedLoans',
        ]);

        return response()->json([
            'user' => UserResource::make($user),
            'stats' => [
                'items_count' => $user->items_count,
                'borrowed_loans_count' => $user->borrowed_loans_count,
            ],
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $request->user()->update($request->validated());

        return response()->json([
            'message' => 'Perfil actualizado.',
            'user' => UserResource::make($request->user()->fresh()),
        ]);
    }
}
