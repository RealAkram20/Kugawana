<?php

namespace App\Filament\Admin\Resources;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Filament\Admin\Resources\OrderResource\Pages;
use App\Models\Order;
use App\Notifications\KugawanaNotification;
use App\Services\WalletService;
use Filament\Forms;
use Filament\Forms\Form;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class OrderResource extends Resource
{
    protected static ?string $model = Order::class;

    protected static ?string $navigationIcon = 'heroicon-o-shopping-bag';

    protected static ?string $navigationGroup = 'Orders';

    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->when(
            auth()->user()->role === UserRole::CountryAdmin,
            fn (Builder $query) => $query->whereHas(
                'foodDonation',
                fn (Builder $q) => $q->where('country_id', auth()->user()->country_id)
            )
        );
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getEloquentQuery()
            ->where('status', OrderStatus::Pending)
            ->count() ?: null;
    }

    public static function form(Form $form): Form
    {
        return $form->schema([
            Forms\Components\Section::make()->schema([
                Forms\Components\Select::make('status')
                    ->options(OrderStatus::class)
                    ->required(),
                Forms\Components\Select::make('delivery_method')
                    ->options([
                        'pickup' => 'Pickup',
                        'delivery' => 'Delivery',
                    ])
                    ->required(),
                Forms\Components\TextInput::make('delivery_address'),
                Forms\Components\Textarea::make('notes')->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('id')->label('Order')->sortable(),
                Tables\Columns\TextColumn::make('receiver.name')->label('Receiver')->searchable(),
                Tables\Columns\TextColumn::make('foodDonation.title')->label('Food')->searchable(),
                Tables\Columns\TextColumn::make('points_spent')->label('Points'),
                Tables\Columns\TextColumn::make('delivery_method')->label('Method'),
                Tables\Columns\TextColumn::make('status')->badge(),
                Tables\Columns\TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')->options(OrderStatus::class),
            ])
            ->actions([
                Tables\Actions\Action::make('accept')
                    ->icon('heroicon-o-check-circle')
                    ->color('info')
                    ->requiresConfirmation()
                    ->action(function (Order $record) {
                        $record->update(['status' => OrderStatus::Accepted]);

                        static::notifyReceiver(
                            $record,
                            'order.accepted',
                            'Your request was accepted',
                            "Your request for \"{$record->foodDonation?->title}\" was accepted."
                        );
                    })
                    ->visible(fn (Order $record) => $record->status === OrderStatus::Pending),
                Tables\Actions\Action::make('mark_delivered')
                    ->label('Mark delivered')
                    ->icon('heroicon-o-truck')
                    ->color('success')
                    ->requiresConfirmation()
                    ->action(function (Order $record) {
                        $record->update([
                            'status' => OrderStatus::Completed,
                            'completed_at' => now(),
                        ]);

                        static::notifyReceiver(
                            $record,
                            'order.completed',
                            'Order delivered',
                            "\"{$record->foodDonation?->title}\" was marked as delivered."
                        );
                    })
                    ->visible(fn (Order $record) => $record->status === OrderStatus::Accepted),
                Tables\Actions\Action::make('cancel')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->action(function (Order $record) {
                        DB::transaction(function () use ($record) {
                            $locked = Order::lockForUpdate()->find($record->id);

                            if (! in_array($locked->status, [OrderStatus::Pending, OrderStatus::Accepted], true)) {
                                return;
                            }

                            $locked->update(['status' => OrderStatus::Cancelled]);
                            if ($locked->points_spent > 0) {
                                app(WalletService::class)->credit(
                                    $locked->receiver,
                                    $locked->points_spent,
                                    'order refund',
                                    (string) $locked->id
                                );
                            }

                            static::notifyReceiver(
                                $locked,
                                'order.cancelled',
                                'Your request was cancelled',
                                "Your request for \"{$locked->foodDonation?->title}\" was cancelled and refunded."
                            );
                        });
                    })
                    ->visible(fn (Order $record) => in_array($record->status, [OrderStatus::Pending, OrderStatus::Accepted])),
                Tables\Actions\EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOrders::route('/'),
            'edit' => Pages\EditOrder::route('/{record}/edit'),
        ];
    }

    /** Tells the person who requested the food that an admin acted on their order. */
    private static function notifyReceiver(Order $order, string $type, string $title, string $body): void
    {
        $order->receiver?->notify(new KugawanaNotification($type, $title, $body, 'orders'));
    }
}
