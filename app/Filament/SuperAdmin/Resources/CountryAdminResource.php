<?php

namespace App\Filament\SuperAdmin\Resources;

use App\Enums\UserRole;
use App\Filament\SuperAdmin\Resources\CountryAdminResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class CountryAdminResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-shield-check';

    protected static ?string $navigationLabel = 'Country admins';

    protected static ?string $navigationGroup = 'Users';

    protected static ?string $modelLabel = 'country admin';

    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('role', UserRole::CountryAdmin);
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('name')->required(),
                Forms\Components\TextInput::make('email')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true),
                Forms\Components\TextInput::make('phone'),
                Forms\Components\Select::make('country_id')
                    ->relationship('country', 'name')
                    ->required(),
                Forms\Components\TextInput::make('password')
                    ->password()
                    ->revealable()
                    ->required(fn (string $operation) => $operation === 'create')
                    ->dehydrated(fn ($state) => filled($state))
                    ->minLength(8),
                Forms\Components\Toggle::make('is_active')->label('Active')->default(true),
                Forms\Components\Hidden::make('role')->default(UserRole::CountryAdmin->value),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('email')->searchable(),
                Tables\Columns\TextColumn::make('country.name')->label('Country'),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCountryAdmins::route('/'),
            'create' => Pages\CreateCountryAdmin::route('/create'),
            'edit' => Pages\EditCountryAdmin::route('/{record}/edit'),
        ];
    }
}
