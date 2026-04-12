<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LoanFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_loan_flow_is_coherent(): void
    {
        $category = Category::create([
            'name' => 'Herramientas',
            'icon' => 'Wrench',
            'description' => 'Herramientas del conjunto',
        ]);

        $owner = User::factory()->create([
            'name' => 'Carlos',
            'email' => 'owner@example.com',
        ]);

        $borrower = User::factory()->create([
            'name' => 'Laura',
            'email' => 'borrower@example.com',
        ]);

        $item = Item::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'name' => 'Taladro Bosch',
            'description' => 'Taladro para mantenimiento',
            'condition' => 'bueno',
            'status' => 'available',
        ]);

        Sanctum::actingAs($borrower);

        $requestLoan = $this->postJson('/api/loans', [
            'item_id' => $item->id,
            'proposed_days' => 4,
            'notes' => 'Lo necesito para arreglar una repisa.',
        ]);

        $loanId = $requestLoan->json('data.id');

        $requestLoan
            ->assertCreated()
            ->assertJsonPath('data.status', 'requested')
            ->assertJsonPath('data.workflow_state', 'pending_owner');

        Sanctum::actingAs($owner);

        $approveLoan = $this->postJson("/api/loans/{$loanId}/approve", [
            'agreed_days' => 3,
        ]);

        $approveLoan
            ->assertOk()
            ->assertJsonPath('data.workflow_state', 'pending_handover');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'status' => 'unavailable',
        ]);

        $deliveryCodeResponse = $this->getJson("/api/loans/{$loanId}/handover-code")
            ->assertOk();

        $deliveryCode = $deliveryCodeResponse->json('delivery_code');

        Sanctum::actingAs($borrower);

        $this->postJson("/api/loans/{$loanId}/confirm-handover", [
            'code' => $deliveryCode,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'status' => 'on_loan',
        ]);

        $returnStartResponse = $this->postJson("/api/loans/{$loanId}/start-return")
            ->assertOk();

        $returnCode = $returnStartResponse->json('return_code');

        Sanctum::actingAs($owner);

        $this->postJson("/api/loans/{$loanId}/confirm-return", [
            'code' => $returnCode,
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'returned');

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'status' => 'available',
            'times_loaned' => 1,
        ]);

        Sanctum::actingAs($borrower);

        $this->postJson("/api/loans/{$loanId}/rate", [
            'score' => 5,
            'comment' => 'Todo salió bien.',
        ])
            ->assertCreated();

        $this->assertDatabaseHas('ratings', [
            'loan_id' => $loanId,
            'rater_id' => $borrower->id,
            'score' => 5,
        ]);
    }

    public function test_approved_item_disappears_from_marketplace(): void
    {
        $category = Category::create([
            'name' => 'Electrodomésticos',
            'icon' => 'Zap',
            'description' => 'Objetos del hogar',
        ]);

        $owner = User::factory()->create();
        $borrower = User::factory()->create();

        $item = Item::create([
            'user_id' => $owner->id,
            'category_id' => $category->id,
            'name' => 'Aspiradora',
            'description' => 'Aspiradora portátil',
            'condition' => 'bueno',
            'status' => 'available',
        ]);

        Sanctum::actingAs($borrower);

        $loanId = $this->postJson('/api/loans', [
            'item_id' => $item->id,
            'proposed_days' => 2,
        ])->json('data.id');

        Sanctum::actingAs($owner);
        $this->postJson("/api/loans/{$loanId}/approve", [
            'agreed_days' => 2,
        ])->assertOk();

        $this->getJson('/api/items')
            ->assertOk()
            ->assertJsonMissing(['id' => $item->id]);
    }
}
