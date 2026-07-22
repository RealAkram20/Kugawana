<?php

namespace App\Filament\Admin\Resources\CommunityPostResource\Pages;

use App\Filament\Admin\Resources\CommunityPostResource;
use Filament\Resources\Pages\ListRecords;

class ListCommunityPosts extends ListRecords
{
    protected static string $resource = CommunityPostResource::class;
}
