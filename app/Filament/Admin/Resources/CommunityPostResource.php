<?php

namespace App\Filament\Admin\Resources;

use App\Enums\PostStatus;
use App\Filament\Admin\Resources\CommunityPostResource\Pages;
use App\Models\CommunityPost;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CommunityPostResource extends Resource
{
    protected static ?string $model = CommunityPost::class;

    protected static ?string $navigationIcon = 'heroicon-o-chat-bubble-left-right';

    protected static ?string $navigationLabel = 'Community';

    protected static ?string $navigationGroup = 'Content';

    protected static ?int $navigationSort = 2;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('Author')->searchable(),
                Tables\Columns\TextColumn::make('content')->limit(60)->searchable(),
                Tables\Columns\TextColumn::make('likes_count')->label('Likes'),
                Tables\Columns\TextColumn::make('comments_count')->label('Comments'),
                Tables\Columns\TextColumn::make('status')->badge(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(PostStatus::class),
            ])
            ->actions([
                Tables\Actions\Action::make('hide')
                    ->icon('heroicon-o-eye-slash')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(fn (CommunityPost $record) => $record->update(['status' => PostStatus::Hidden]))
                    ->visible(fn (CommunityPost $record) => $record->status === PostStatus::Published),
                Tables\Actions\Action::make('restore')
                    ->icon('heroicon-o-eye')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(fn (CommunityPost $record) => $record->update(['status' => PostStatus::Published]))
                    ->visible(fn (CommunityPost $record) => $record->status === PostStatus::Hidden),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCommunityPosts::route('/'),
        ];
    }
}
