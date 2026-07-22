<?php

namespace App\Filament\SuperAdmin\Resources;

use App\Filament\SuperAdmin\Resources\PointPackageResource\Pages;
use App\Models\PointPackage;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class PointPackageResource extends Resource
{
    protected static ?string $model = PointPackage::class;

    protected static ?string $navigationIcon = 'heroicon-o-currency-dollar';

    protected static ?string $navigationLabel = 'Point packages';

    protected static ?string $navigationGroup = 'Finance';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('name')->required(),
                Forms\Components\TextInput::make('points')
                    ->numeric()
                    ->minValue(1)
                    ->required(),
                Forms\Components\TextInput::make('price')
                    ->numeric()
                    ->minValue(0)
                    ->required(),
                Forms\Components\TextInput::make('currency')
                    ->length(3)
                    ->default('UGX')
                    ->required(),
                Forms\Components\Select::make('country_id')
                    ->relationship('country', 'name')
                    ->label('Country'),
                Forms\Components\Toggle::make('is_active')->label('Active')->default(true),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable(),
                Tables\Columns\TextColumn::make('points')->sortable(),
                Tables\Columns\TextColumn::make('price')->money(fn (PointPackage $record) => $record->currency)->sortable(),
                Tables\Columns\TextColumn::make('country.name')->label('Country'),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('points');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPointPackages::route('/'),
            'create' => Pages\CreatePointPackage::route('/create'),
            'edit' => Pages\EditPointPackage::route('/{record}/edit'),
        ];
    }
}
