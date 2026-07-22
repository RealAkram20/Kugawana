<?php

namespace App\Filament\Admin\Resources;

use App\Enums\FoodStatus;
use App\Enums\UserRole;
use App\Filament\Admin\Resources\FoodDonationResource\Pages;
use App\Models\FoodDonation;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class FoodDonationResource extends Resource
{
    protected static ?string $model = FoodDonation::class;

    protected static ?string $navigationIcon = 'heroicon-o-gift';

    protected static ?string $navigationLabel = 'Donations';

    protected static ?string $navigationGroup = 'Food';

    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->when(
            auth()->user()->role === UserRole::CountryAdmin,
            fn (Builder $query) => $query->where('country_id', auth()->user()->country_id)
        );
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getEloquentQuery()
            ->where('status', FoodStatus::Pending)
            ->count() ?: null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('title')->required(),
                Forms\Components\Select::make('status')
                    ->options(FoodStatus::class)
                    ->required(),
                Forms\Components\Select::make('food_category_id')
                    ->relationship('category', 'name')
                    ->label('Category')
                    ->required(),
                Forms\Components\Select::make('warehouse_id')
                    ->relationship('warehouse', 'name')
                    ->label('Warehouse'),
                Forms\Components\TextInput::make('points_required')
                    ->numeric()
                    ->minValue(0)
                    ->required(),
                Forms\Components\TextInput::make('quantity')->required(),
                Forms\Components\DateTimePicker::make('expiry_date')->required(),
                Forms\Components\TextInput::make('contact_number'),
                Forms\Components\Textarea::make('description')->columnSpanFull(),
                Forms\Components\Textarea::make('admin_notes')->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('donor.name')->label('Donor')->searchable(),
                Tables\Columns\TextColumn::make('category.name')->label('Category'),
                Tables\Columns\TextColumn::make('status')->badge(),
                Tables\Columns\TextColumn::make('expiry_date')->dateTime()->sortable(),
                Tables\Columns\TextColumn::make('points_required')->label('Points'),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(FoodStatus::class),
                Tables\Filters\SelectFilter::make('category')->relationship('category', 'name'),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->form([
                        Forms\Components\Select::make('warehouse_id')
                            ->relationship('warehouse', 'name')
                            ->label('Warehouse'),
                        Forms\Components\TextInput::make('points_required')
                            ->numeric()
                            ->minValue(0)
                            ->required()
                            ->default(fn (FoodDonation $record) => $record->points_required),
                    ])
                    ->action(function (FoodDonation $record, array $data) {
                        $record->update([
                            'status' => FoodStatus::Approved,
                            'warehouse_id' => $data['warehouse_id'],
                            'points_required' => $data['points_required'],
                            'approved_by' => auth()->id(),
                            'approved_at' => now(),
                        ]);
                    })
                    ->visible(fn (FoodDonation $record) => in_array($record->status, [FoodStatus::Pending, FoodStatus::Reviewed])),
                Tables\Actions\Action::make('reject')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->form([
                        Forms\Components\Textarea::make('admin_notes')
                            ->label('Reason')
                            ->required(),
                    ])
                    ->action(function (FoodDonation $record, array $data) {
                        $record->update([
                            'status' => FoodStatus::Rejected,
                            'admin_notes' => $data['admin_notes'],
                        ]);
                    })
                    ->visible(fn (FoodDonation $record) => in_array($record->status, [FoodStatus::Pending, FoodStatus::Reviewed])),
                Tables\Actions\Action::make('publish')
                    ->icon('heroicon-o-eye')
                    ->color('primary')
                    ->requiresConfirmation()
                    ->action(fn (FoodDonation $record) => $record->update(['status' => FoodStatus::Published]))
                    ->visible(fn (FoodDonation $record) => in_array($record->status, [FoodStatus::Approved, FoodStatus::Collected, FoodStatus::Stored]) && $record->points_required > 0),
                Tables\Actions\EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListFoodDonations::route('/'),
            'edit' => Pages\EditFoodDonation::route('/{record}/edit'),
        ];
    }
}
