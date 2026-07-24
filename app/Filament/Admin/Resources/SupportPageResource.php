<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\SupportPageResource\Pages;
use App\Models\SupportPage;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class SupportPageResource extends Resource
{
    protected static ?string $model = SupportPage::class;

    protected static ?string $navigationIcon = 'heroicon-o-document-text';

    protected static ?string $navigationGroup = 'Support';

    protected static ?string $navigationLabel = 'Policy pages';

    protected static ?string $modelLabel = 'policy page';

    protected static ?int $navigationSort = 2;

    // The model is slug-routed for the API; admin URLs stay on the id so that
    // renaming a slug cannot break the page you are currently editing.
    protected static ?string $recordRouteKeyName = 'id';

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('title')
                    ->required()
                    ->maxLength(255)
                    ->live(onBlur: true)
                    ->afterStateUpdated(fn (Forms\Set $set, ?string $state, string $operation) => $operation === 'create'
                        ? $set('slug', Str::slug((string) $state))
                        : null),
                Forms\Components\TextInput::make('slug')
                    ->required()
                    ->maxLength(255)
                    ->unique(ignoreRecord: true)
                    ->helperText('Used in the app link. Changing it breaks existing links.'),
                Forms\Components\Textarea::make('body')
                    ->label('Content')
                    ->required()
                    ->rows(18)
                    ->helperText('Plain text. Leave a blank line between paragraphs — the app has no rich-text renderer, so formatting markup would reach members as stray characters.')
                    ->columnSpanFull(),
                Forms\Components\TextInput::make('sort_order')
                    ->numeric()
                    ->default(0)
                    ->helperText('Lower numbers appear first.'),
                Forms\Components\Toggle::make('is_published')
                    ->label('Published')
                    ->default(true),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('sort_order')->label('#')->sortable(),
                Tables\Columns\TextColumn::make('title')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('slug')->badge()->color('gray'),
                Tables\Columns\IconColumn::make('is_published')->label('Published')->boolean(),
                Tables\Columns\TextColumn::make('updated_at')->dateTime()->sortable(),
            ])
            ->filters([
                Tables\Filters\TernaryFilter::make('is_published')->label('Published'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->reorderable('sort_order')
            ->defaultSort('sort_order');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSupportPages::route('/'),
            'create' => Pages\CreateSupportPage::route('/create'),
            'edit' => Pages\EditSupportPage::route('/{record}/edit'),
        ];
    }
}
