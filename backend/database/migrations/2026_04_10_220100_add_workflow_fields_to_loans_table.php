<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->timestamp('approved_at')->nullable()->after('agreed_days');
            $table->timestamp('return_requested_at')->nullable()->after('delivery_confirmed_at');
            $table->index(['status', 'approved_at']);
        });
    }

    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->dropIndex(['status', 'approved_at']);
            $table->dropColumn(['approved_at', 'return_requested_at']);
        });
    }
};
