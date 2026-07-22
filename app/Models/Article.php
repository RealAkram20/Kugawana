<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'title',
        'category',
        'content',
        'cover_image',
        'is_published',
    ];

    protected $casts = [
        'is_published' => 'boolean',
    ];
}
