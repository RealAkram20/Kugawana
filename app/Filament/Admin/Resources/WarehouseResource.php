<?php

namespace App\Filament\Admin\Resources;

use App\Enums\UserRole;
use App\Filament\Admin\Resources\WarehouseResource\Pages;
use App\Models\Warehouse;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class WarehouseResource extends Resource
{
    protected static ?string $model = Warehouse::class;

    protected static ?string $navigationIcon = 'heroicon-o-building-storefront';

    protected static ?string $navigationGroup = 'Food';

    protected static ?int $navigationSort = 2;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->when(
            auth()->user()->role === UserRole::CountryAdmin,
            fn (Builder $query) => $query->where('country_id', auth()->user()->country_id)
        );
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('name')->required(),
                Forms\Components\Select::make('country_id')
                    ->relationship('country', 'name')
                    ->default(fn () => auth()->user()->country_id)
                    ->required(),
                Forms\Components\TextInput::make('district'),
                Forms\Components\TextInput::make('address'),
                Forms\Components\TextInput::make('capacity')->numeric(),
                Forms\Components\Toggle::make('is_refrigerated')->label('Refrigerated'),
                Forms\Components\Toggle::make('is_active')->label('Active')->default(true),
                Forms\Components\Textarea::make('notes')->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('district'),
                Tables\Columns\TextColumn::make('capacity'),
                Tables\Columns\IconColumn::make('is_refrigerated')->label('Refrigerated')->boolean(),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
                Tables\Columns\TextColumn::make('donations_count')->counts('donations')->label('Donations'),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWarehouses::route('/'),
            'create' => Pages\CreateWarehouse::route('/create'),
            'edit' => Pages\EditWarehouse::route('/{record}/edit'),
        ];
    }
}
