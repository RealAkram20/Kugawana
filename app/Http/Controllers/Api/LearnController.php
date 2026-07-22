<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use Illuminate\Http\JsonResponse;

class LearnController extends Controller
{
    public function index(): JsonResponse
    {
        $articles = Article::where('is_published', true)->latest()->get();

        return response()->json([
            'success' => true,
            'data' => ArticleResource::collection($articles),
            'message' => 'Articles retrieved',
        ]);
    }

    public function show(Article $article): JsonResponse
    {
        abort_unless($article->is_published, 404);

        return response()->json([
            'success' => true,
            'data' => new ArticleResource($article),
            'message' => 'Article retrieved',
        ]);
    }
}
