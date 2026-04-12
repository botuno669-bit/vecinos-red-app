<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loan_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('previous_status', 30)->nullable();
            $table->string('new_status', 30);
            $table->string('action', 100);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['loan_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_history');
    }
};
