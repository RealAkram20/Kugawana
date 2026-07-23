<?php

namespace App\Filament\Admin\Resources;

use App\Enums\TopupStatus;
use App\Enums\UserRole;
use App\Filament\Admin\Resources\WalletTopupResource\Pages;
use App\Models\WalletTopup;
use App\Services\WalletService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class WalletTopupResource extends Resource
{
    protected static ?string $model = WalletTopup::class;

    protected static ?string $navigationIcon = 'heroicon-o-wallet';

    protected static ?string $navigationLabel = 'Wallet topups';

    protected static ?string $navigationGroup = 'Finance';

    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->when(
            auth()->user()->role === UserRole::CountryAdmin,
            fn (Builder $query) => $query->whereHas(
                'user',
                fn (Builder $q) => $q->where('country_id', auth()->user()->country_id)
            )
        );
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getEloquentQuery()
            ->where('status', TopupStatus::Pending)
            ->count() ?: null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload()
                    ->required(),
                Forms\Components\Select::make('point_package_id')
                    ->relationship('pointPackage', 'name')
                    ->label('Package'),
                Forms\Components\TextInput::make('points')
                    ->numeric()
                    ->minValue(1)
                    ->required(),
                Forms\Components\TextInput::make('amount')
                    ->numeric()
                    ->minValue(0)
                    ->required(),
                Forms\Components\Select::make('payment_method')
                    ->options([
                        'manual' => 'Manual',
                        'pesapal' => 'Pesapal',
                    ])
                    ->default('manual')
                    ->required(),
                Forms\Components\TextInput::make('payment_reference'),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('User')->searchable(),
                Tables\Columns\TextColumn::make('points'),
                Tables\Columns\TextColumn::make('amount')->money(fn (WalletTopup $record) => $record->currency),
                Tables\Columns\TextColumn::make('payment_method')->label('Method'),
                Tables\Columns\TextColumn::make('payment_reference')->label('Reference')->searchable(),
                Tables\Columns\TextColumn::make('status')->badge(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options(TopupStatus::class)
                    ->default(TopupStatus::Pending->value),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(fn (WalletTopup $record) => app(WalletService::class)->applyTopup($record, auth()->id()))
                    ->visible(fn (WalletTopup $record) => $record->status === TopupStatus::Pending),
                Tables\Actions\Action::make('reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(fn (WalletTopup $record) => $record->update([
                        'status' => TopupStatus::Rejected,
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ]))
                    ->visible(fn (WalletTopup $record) => $record->status === TopupStatus::Pending),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListWalletTopups::route('/'),
            'create' => Pages\CreateWalletTopup::route('/create'),
        ];
    }
}
