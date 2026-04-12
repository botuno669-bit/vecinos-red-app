<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_login_and_logout(): void
    {
        $registerResponse = $this->postJson('/api/auth/register', [
            'name' => 'Ana Torres',
            'email' => 'ana@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'apartment' => 'Torre 1 Apto 101',
            'phone' => '3001231234',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('user.email', 'ana@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'ana@example.com',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'ana@example.com',
            'password' => 'Password123',
            'remember' => true,
        ]);

        $token = $loginResponse->json('token');

        $loginResponse
            ->assertOk()
            ->assertJsonPath('user.name', 'Ana Torres');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'ana@example.com');

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => 'Password123',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }
}
