---
name: kugawana-admin
description: FilamentPHP admin panel patterns for the Kugawana platform. Use whenever building admin resources, pages, widgets, or any FilamentPHP component for Kugawana. Read kugawana-project and kugawana-backend first.
---

# Kugawana Admin Panel

Read `kugawana-project` and `kugawana-backend` SKILL.md before this one.

## Stack

- FilamentPHP v3
- Laravel 12
- Two panels: SuperAdmin panel, Country Admin panel

## Panel Structure

```
app/
  Filament/
    SuperAdmin/
      Resources/
        CountryResource.php
        CountryAdminResource.php
        PointPackageResource.php
        RewardCampaignResource.php
        UserResource.php
      Pages/
        GlobalReports.php
      Widgets/
        GlobalStatsWidget.php
      SuperAdminPanelProvider.php
    Admin/
      Resources/
        FoodDonationResource.php
        OrderResource.php
        WarehouseResource.php
        CategoryResource.php
        UserResource.php
        ArticleResource.php
        CommunityPostResource.php
      Pages/
        CountryReports.php
      Widgets/
        CountryStatsWidget.php
        RecentDonationsWidget.php
      AdminPanelProvider.php
```

## Panel Registration

```php
class SuperAdminPanelProvider extends PanelProvider {
    public function panel(Panel $panel): Panel {
        return $panel
            ->id('super-admin')
            ->path('super-admin')
            ->authMiddleware([Authenticate::class])
            ->authGuard('web')
            ->middleware([
                fn ($request, $next) => auth()->user()?->role === UserRole::SuperAdmin
                    ? $next($request)
                    : abort(403)
            ])
            ->resources([
                CountryResource::class,
                CountryAdminResource::class,
                PointPackageResource::class,
                RewardCampaignResource::class,
            ])
            ->pages([GlobalReports::class])
            ->widgets([GlobalStatsWidget::class])
            ->navigationGroups(['Users', 'Platform', 'Finance']);
    }
}
```

## Food Donation Resource

The most critical resource. Admin reviews, approves, and manages food donations.

```php
class FoodDonationResource extends Resource {
    protected static ?string $model = FoodDonation::class;
    protected static ?string $navigationIcon = 'heroicon-o-gift';
    protected static ?string $navigationLabel = 'Donations';

    public static function form(Form $form): Form {
        return $form->schema([
            Section::make()->schema([
                TextInput::make('title')->required(),
                Select::make('status')
                    ->options(FoodStatus::class)
                    ->required(),
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                Select::make('warehouse_id')
                    ->relationship('warehouse', 'name'),
                TextInput::make('points_required')
                    ->numeric()
                    ->required(),
                DateTimePicker::make('expiry_date')->required(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table {
        return $table
            ->columns([
                TextColumn::make('title')->searchable()->sortable(),
                TextColumn::make('donor.full_name')->label('Donor'),
                BadgeColumn::make('status')->colors([
                    'warning' => FoodStatus::Pending->value,
                    'success' => FoodStatus::Published->value,
                    'danger' => FoodStatus::Expired->value,
                    'secondary' => FoodStatus::Completed->value,
                ]),
                TextColumn::make('expiry_date')->dateTime()->sortable(),
                TextColumn::make('points_required'),
            ])
            ->filters([
                SelectFilter::make('status')->options(FoodStatus::class),
                SelectFilter::make('category')->relationship('category', 'name'),
            ])
            ->actions([
                Tables\Actions\Action::make('approve')
                    ->action(fn (FoodDonation $record) => $record->update(['status' => FoodStatus::Approved]))
                    ->requiresConfirmation()
                    ->visible(fn (FoodDonation $record) => $record->status === FoodStatus::Reviewed),
                Tables\Actions\EditAction::make(),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
```

## Order Resource

Admin marks orders as Delivered from here.

```php
Tables\Actions\Action::make('mark_delivered')
    ->label('Mark delivered')
    ->action(function (Order $record) {
        $record->update(['status' => OrderStatus::Completed]);
        $record->receiver->notify(new OrderDeliveredNotification($record));
    })
    ->requiresConfirmation()
    ->visible(fn (Order $record) => $record->status === OrderStatus::Accepted),
```

## Stats Widget

```php
class CountryStatsWidget extends StatsOverviewWidget {
    protected function getStats(): array {
        return [
            Stat::make('Active listings', FoodDonation::published()->count()),
            Stat::make('Orders today', Order::whereDate('created_at', today())->count()),
            Stat::make('Total users', User::whereCountry(auth()->user()->country)->count()),
            Stat::make('Points sold', WalletTransaction::where('type', TransactionType::Credit)->sum('points')),
        ];
    }
}
```

## Learn Articles Resource

Admin creates and publishes articles for the Learn tab.

```php
class ArticleResource extends Resource {
    public static function form(Form $form): Form {
        return $form->schema([
            TextInput::make('title')->required()->translatable(),
            Select::make('category')
                ->options([
                    'preservation' => 'Food Preservation',
                    'nutrition' => 'Nutrition',
                    'handling' => 'Safe Handling',
                    'waste' => 'Reducing Waste',
                    'community' => 'Community Guides',
                ]),
            RichEditor::make('content')->required(),
            FileUpload::make('cover_image')->image(),
            Toggle::make('is_published'),
        ]);
    }
}
```

## Admin UI Rules

- No explainer text or helper tooltips unless a field is genuinely ambiguous
- Labels are short — one to three words maximum
- No hyphens in any label or button text
- Confirmation dialogs for all destructive or irreversible actions
- Table columns: show the minimum needed to identify and act on a record
- Navigation group by domain: Food, Orders, Users, Finance, Content

## Expired Items View

Add a filter and tab to the FoodDonationResource table:

```php
SelectFilter::make('status')
    ->options(FoodStatus::class)
    ->default(FoodStatus::Pending->value),

Tabs::make()->tabs([
    Tab::make('Active')->modifyQueryUsing(fn ($q) => $q->whereIn('status', [
        FoodStatus::Pending, FoodStatus::Reviewed, FoodStatus::Published
    ])),
    Tab::make('Expired')->modifyQueryUsing(fn ($q) => $q->where('status', FoodStatus::Expired)),
    Tab::make('Completed')->modifyQueryUsing(fn ($q) => $q->where('status', FoodStatus::Completed)),
]),
```

Expired tab is admin-only. The word "Expired" never appears on the mobile app.
