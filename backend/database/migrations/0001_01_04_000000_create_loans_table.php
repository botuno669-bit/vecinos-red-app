<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->foreignId('borrower_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', [
                'requested',
                'negotiating',
                'active',
                'returned',
                'overdue',
                'cancelled'
            ])->default('requested');
            $table->integer('proposed_days');
            $table->integer('agreed_days')->nullable();
            $table->date('start_date')->nullable();
            $table->date('expected_return_date')->nullable();
            $table->date('actual_return_date')->nullable();
            $table->string('delivery_code', 6)->nullable();
            $table->string('return_code', 6)->nullable();
            $table->timestamp('delivery_confirmed_at')->nullable();
            $table->timestamp('return_confirmed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status']);
            $table->index(['borrower_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
