<?php

namespace App\Filament\Admin\Resources;

use App\Enums\UserRole;
use App\Filament\Admin\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $navigationIcon = 'heroicon-o-users';

    protected static ?string $navigationGroup = 'Users';

    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereIn('role', [UserRole::Donor, UserRole::Receiver])
            ->when(
                auth()->user()->role === UserRole::CountryAdmin,
                fn (Builder $query) => $query->where('country_id', auth()->user()->country_id)
            );
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('name')->required(),
                Forms\Components\TextInput::make('email')->email()->required(),
                Forms\Components\TextInput::make('phone'),
                Forms\Components\Select::make('role')
                    ->options([
                        UserRole::Donor->value => 'Donor',
                        UserRole::Receiver->value => 'Receiver',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('district'),
                Forms\Components\TextInput::make('responsibility_score')->numeric(),
                Forms\Components\Toggle::make('is_active')->label('Active'),
                Forms\Components\FileUpload::make('profile_photo')
                    ->label('Profile photo')
                    ->image()
                    ->avatar()
                    ->directory('avatars'),
                Forms\Components\Textarea::make('bio')
                    ->maxLength(500)
                    ->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\ImageColumn::make('profile_photo')->label('Photo')->circular(),
                Tables\Columns\TextColumn::make('name')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('email')->searchable(),
                Tables\Columns\TextColumn::make('phone')->searchable(),
                Tables\Columns\TextColumn::make('role')->badge(),
                Tables\Columns\TextColumn::make('wallet_balance')->label('Points'),
                Tables\Columns\TextColumn::make('responsibility_score')->label('Score'),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('role')->options([
                    UserRole::Donor->value => 'Donor',
                    UserRole::Receiver->value => 'Receiver',
                ]),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
            'edit' => Pages\EditUser::route('/{record}/edit'),
        ];
    }
}
