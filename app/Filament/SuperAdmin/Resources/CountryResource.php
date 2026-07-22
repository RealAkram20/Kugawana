<?php

namespace App\Filament\SuperAdmin\Resources;

use App\Filament\SuperAdmin\Resources\CountryResource\Pages;
use App\Models\Country;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class CountryResource extends Resource
{
    protected static ?string $model = Country::class;

    protected static ?string $navigationIcon = 'heroicon-o-globe-africa';

    protected static ?string $navigationGroup = 'Platform';

    protected static ?int $navigationSort = 1;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('name')->required(),
                Forms\Components\TextInput::make('code')
                    ->length(2)
                    ->required(),
                Forms\Components\TextInput::make('currency_code')
                    ->length(3)
                    ->default('UGX')
                    ->required(),
                Forms\Components\Toggle::make('is_active')->label('Active'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('code'),
                Tables\Columns\TextColumn::make('currency_code')->label('Currency'),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
                Tables\Columns\TextColumn::make('users_count')->counts('users')->label('Users'),
            ])
            ->actions([
                Tables\Actions\Action::make('toggle_active')
                    ->label(fn (Country $record) => $record->is_active ? 'Disable' : 'Enable')
                    ->icon('heroicon-o-power')
                    ->color(fn (Country $record) => $record->is_active ? 'danger' : 'success')
                    ->requiresConfirmation()
                    ->action(fn (Country $record) => $record->update(['is_active' => ! $record->is_active])),
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCountries::route('/'),
            'create' => Pages\CreateCountry::route('/create'),
            'edit' => Pages\EditCountry::route('/{record}/edit'),
        ];
    }
}
