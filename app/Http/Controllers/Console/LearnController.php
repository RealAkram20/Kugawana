<?php

namespace App\Http\Controllers\Console;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\View\View;

class LearnController extends Controller
{
    public function index(): View
    {
        $articles = Article::latest()->paginate(25);

        return view('console.learn.index', [
            'title' => 'Learn',
            'articles' => $articles,
        ]);
    }
}
