<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\UnitResource\Pages;
use App\Models\Unit;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class UnitResource extends Resource
{
    protected static ?string $model = Unit::class;

    protected static ?string $navigationIcon = 'heroicon-o-scale';

    protected static ?string $navigationLabel = 'Units';

    protected static ?string $navigationGroup = 'Food';

    protected static ?int $navigationSort = 4;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\TextInput::make('name')
                ->required()
                ->helperText('The full name, e.g. Kilogram.'),
            Forms\Components\TextInput::make('symbol')
                ->required()
                ->maxLength(20)
                ->helperText('What people see next to the number, e.g. Kg.'),
            Forms\Components\TextInput::make('sort_order')
                ->numeric()
                ->minValue(0)
                ->default(0)
                ->helperText('Lower numbers appear first in the app.'),
            Forms\Components\Toggle::make('is_active')
                ->label('Active')
                ->default(true)
                ->helperText('Inactive units stay on existing donations but are hidden from the app.'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('symbol')->searchable(),
                Tables\Columns\TextColumn::make('sort_order')->label('Order')->sortable(),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
                Tables\Columns\TextColumn::make('donations_count')->counts('donations')->label('Donations'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('sort_order');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUnits::route('/'),
            'create' => Pages\CreateUnit::route('/create'),
            'edit' => Pages\EditUnit::route('/{record}/edit'),
        ];
    }
}
