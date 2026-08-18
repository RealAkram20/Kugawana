<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_comments', function (Blueprint $table) {
            // Threads are two levels deep: a null parent is a top-level comment,
            // anything else is a reply sitting under one. A reply-to-a-reply is
            // re-pointed at its grandparent by the controller, so this column
            // never chains further than one hop.
            $table->foreignId('parent_id')
                ->nullable()
                ->after('community_post_id')
                ->constrained('community_comments')
                ->cascadeOnDelete();

            // Denormalised so the feed can render "View 2 replies" without
            // counting rows for every comment on the page.
            $table->unsignedInteger('replies_count')->default(0)->after('content');

            $table->index(['community_post_id', 'parent_id']);
        });
    }

    public function down(): void
    {
        Schema::table('community_comments', function (Blueprint $table) {
            $table->dropIndex(['community_post_id', 'parent_id']);
            $table->dropConstrainedForeignId('parent_id');
            $table->dropColumn('replies_count');
        });
    }
};
