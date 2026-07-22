<?php

namespace App\Filament\SuperAdmin\Resources;

use App\Filament\SuperAdmin\Resources\RewardCampaignResource\Pages;
use App\Models\RewardCampaign;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class RewardCampaignResource extends Resource
{
    protected static ?string $model = RewardCampaign::class;

    protected static ?string $navigationIcon = 'heroicon-o-sparkles';

    protected static ?string $navigationLabel = 'Reward campaigns';

    protected static ?string $navigationGroup = 'Finance';

    protected static ?int $navigationSort = 2;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\TextInput::make('name')->required(),
                Forms\Components\TextInput::make('points')
                    ->numeric()
                    ->minValue(1)
                    ->required(),
                Forms\Components\Select::make('type')
                    ->options([
                        'signup' => 'Signup',
                        'donation' => 'Donation',
                        'manual' => 'Manual',
                    ])
                    ->default('manual')
                    ->required(),
                Forms\Components\Select::make('country_id')
                    ->relationship('country', 'name')
                    ->label('Country'),
                Forms\Components\DateTimePicker::make('starts_at'),
                Forms\Components\DateTimePicker::make('ends_at'),
                Forms\Components\Toggle::make('is_active')->label('Active')->default(true),
                Forms\Components\Textarea::make('description')->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')->searchable(),
                Tables\Columns\TextColumn::make('points'),
                Tables\Columns\TextColumn::make('type'),
                Tables\Columns\TextColumn::make('starts_at')->dateTime(),
                Tables\Columns\TextColumn::make('ends_at')->dateTime(),
                Tables\Columns\IconColumn::make('is_active')->label('Active')->boolean(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListRewardCampaigns::route('/'),
            'create' => Pages\CreateRewardCampaign::route('/create'),
            'edit' => Pages\EditRewardCampaign::route('/{record}/edit'),
        ];
    }
}
