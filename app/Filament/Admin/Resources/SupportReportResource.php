<?php

namespace App\Filament\Admin\Resources;

use App\Enums\SupportReportStatus;
use App\Filament\Admin\Resources\SupportReportResource\Pages;
use App\Models\SupportReport;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

class SupportReportResource extends Resource
{
    protected static ?string $model = SupportReport::class;

    protected static ?string $navigationIcon = 'heroicon-o-flag';

    protected static ?string $navigationGroup = 'Support';

    protected static ?string $navigationLabel = 'Reported problems';

    protected static ?string $modelLabel = 'reported problem';

    protected static ?int $navigationSort = 4;

    /** Nudge admins toward the queue when something is waiting. */
    public static function getNavigationBadge(): ?string
    {
        $open = static::getModel()::where('status', SupportReportStatus::New)->count();

        return $open > 0 ? (string) $open : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Report')
                ->description('Submitted from the app — read only.')
                ->schema([
                    Forms\Components\Placeholder::make('reporter')
                        ->label('From')
                        ->content(fn (?SupportReport $record) => $record?->user?->name ?? '—'),
                    Forms\Components\Placeholder::make('submitted')
                        ->label('Submitted')
                        ->content(fn (?SupportReport $record) => $record?->created_at?->diffForHumans() ?? '—'),
                    Forms\Components\Placeholder::make('subject_text')
                        ->label('Subject')
                        ->content(fn (?SupportReport $record) => $record?->subject ?? '—')
                        ->columnSpanFull(),
                    Forms\Components\Placeholder::make('message_text')
                        ->label('Message')
                        ->content(fn (?SupportReport $record) => $record?->message ?? '—')
                        ->columnSpanFull(),
                ])->columns(2),

            Forms\Components\Section::make('Handling')->schema([
                Forms\Components\Select::make('status')
                    ->options(SupportReportStatus::class)
                    ->required()
                    ->native(false),
                Forms\Components\Select::make('handled_by')
                    ->label('Assigned to')
                    ->relationship('handler', 'name')
                    ->searchable()
                    ->preload(),
                Forms\Components\Textarea::make('admin_response')
                    ->label('Internal notes / response')
                    ->rows(5)
                    ->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('subject')->searchable()->wrap()->limit(60),
                Tables\Columns\TextColumn::make('user.name')->label('From')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('status')->badge()->sortable(),
                Tables\Columns\TextColumn::make('handler.name')->label('Assigned')->placeholder('Unassigned'),
                Tables\Columns\TextColumn::make('created_at')->label('Submitted')->dateTime()->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(SupportReportStatus::class),
            ])
            ->actions([
                Tables\Actions\EditAction::make()->label('Handle'),
                Tables\Actions\DeleteAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSupportReports::route('/'),
            'edit' => Pages\EditSupportReport::route('/{record}/edit'),
        ];
    }
}
