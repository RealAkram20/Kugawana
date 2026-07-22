<?php

namespace App\Filament\Admin\Resources\ArticleResource\Pages;

use App\Filament\Admin\Resources\ArticleResource;
use Filament\Resources\Pages\EditRecord;

class EditArticle extends EditRecord
{
    protected static string $resource = ArticleResource::class;
}
