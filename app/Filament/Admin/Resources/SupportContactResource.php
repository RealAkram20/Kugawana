<?php

namespace App\Filament\Admin\Resources;

use App\Filament\Admin\Resources\SupportContactResource\Pages;
use App\Models\SupportContact;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;

/**
 * Single-row settings: the blurb at the top of Help & Support and the ways a
 * member can reach the team. There is only ever one record, so creating and
 * deleting are both off — the list is a one-row jumping-off point to the form.
 */
class SupportContactResource extends Resource
{
    protected static ?string $model = SupportContact::class;

    protected static ?string $navigationIcon = 'heroicon-o-lifebuoy';

    protected static ?string $navigationGroup = 'Support';

    protected static ?string $navigationLabel = 'Contact details';

    protected static ?string $modelLabel = 'contact details';

    protected static ?int $navigationSort = 3;

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make('Intro')
                ->description('Shown at the top of Help & Support in the app.')
                ->schema([
                    Forms\Components\Textarea::make('intro')
                        ->rows(3)
                        ->maxLength(500)
                        ->columnSpanFull(),
                ]),
            Forms\Components\Section::make('How members reach you')
                ->description('Leave a field blank to hide that option in the app.')
                ->schema([
                    Forms\Components\TextInput::make('email')
                        ->email()
                        ->maxLength(255),
                    Forms\Components\TextInput::make('phone')
                        ->tel()
                        ->maxLength(50),
                    Forms\Components\TextInput::make('whatsapp')
                        ->label('WhatsApp number')
                        ->tel()
                        ->maxLength(50)
                        ->helperText('International format, e.g. 256700000000.'),
                    Forms\Components\TextInput::make('hours')
                        ->label('Support hours')
                        ->maxLength(255)
                        ->helperText('e.g. Mon–Fri, 9am–5pm'),
                ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('email')->placeholder('Not set'),
                Tables\Columns\TextColumn::make('phone')->placeholder('Not set'),
                Tables\Columns\TextColumn::make('whatsapp')->label('WhatsApp')->placeholder('Not set'),
                Tables\Columns\TextColumn::make('hours')->placeholder('Not set'),
                Tables\Columns\TextColumn::make('updated_at')->dateTime(),
            ])
            ->actions([
                Tables\Actions\EditAction::make(),
            ])
            ->paginated(false);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canDelete(\Illuminate\Database\Eloquent\Model $record): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSupportContacts::route('/'),
            'edit' => Pages\EditSupportContact::route('/{record}/edit'),
        ];
    }
}
