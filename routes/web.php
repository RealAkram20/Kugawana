<?php

use App\Http\Controllers\Console\AdminController;
use App\Http\Controllers\Console\AuthController;
use App\Http\Controllers\Console\BrandingController;
use App\Http\Controllers\Console\CampaignController;
use App\Http\Controllers\Console\CategoryController;
use App\Http\Controllers\Console\CommunityController;
use App\Http\Controllers\Console\CountryController;
use App\Http\Controllers\Console\DashboardController;
use App\Http\Controllers\Console\DonationController;
use App\Http\Controllers\Console\GoogleAuthController;
use App\Http\Controllers\Console\LearnController;
use App\Http\Controllers\Console\MailSettingController;
use App\Http\Controllers\Console\OrderController;
use App\Http\Controllers\Console\PackageController;
use App\Http\Controllers\Console\PasswordResetController;
use App\Http\Controllers\Console\PaymentGatewayController;
use App\Http\Controllers\Console\PushSubscriptionController;
use App\Http\Controllers\Console\ReportController;
use App\Http\Controllers\Console\SettingsController;
use App\Http\Controllers\Console\SupportContactController;
use App\Http\Controllers\Console\SupportFaqController;
use App\Http\Controllers\Console\SupportPageController;
use App\Http\Controllers\Console\SupportReportController;
use App\Http\Controllers\Console\UserController;
use App\Http\Controllers\Console\WalletController;
use App\Http\Controllers\Console\WarehouseController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('console.login');
});

// Clicked from a verification email; the signed middleware guarantees the link
// was issued by us and has not expired.
Route::get('/email/verify/{id}/{hash}', App\Http\Controllers\Auth\VerifyEmailController::class)
    ->middleware('signed')
    ->name('verification.verify');

// Public page Google Play's store listing points at for its account-deletion
// requirement; the in-app path is Profile → Edit profile → Delete account.
Route::view('/account-deletion', 'account-deletion')->name('account.deletion');

// The admin console operator's guide. A single self-contained HTML file with its
// screenshots inlined, so it is streamed as-is rather than rendered through
// Blade — its CSS carries @media rules Blade would try to read as directives.
// Matched case-insensitively because the link is handed out as /Docs.
Route::get('/{docs}', function () {
    $path = resource_path('docs/console-guide.html');

    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => 'text/html; charset=utf-8',
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->where('docs', '[Dd]ocs')->name('docs');

Route::get('/admin/{any?}', fn () => redirect()->route('console.login'))->where('any', '.*');
Route::get('/super-admin/{any?}', fn () => redirect()->route('console.login'))->where('any', '.*');
Route::get('/backoffice/{any?}', fn () => redirect()->route('console.login'))->where('any', '.*');

// Named without the console. prefix on purpose: Laravel's built-in ResetPassword
// notification builds its link from route('password.reset'), and the framework
// redirects guests to route('password.request').
Route::prefix('console')->group(function () {
    Route::get('/forgot-password', [PasswordResetController::class, 'request'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'email'])->middleware('throttle:auth')->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'reset'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'update'])->middleware('throttle:auth')->name('password.update');
});

Route::prefix('console')->name('console.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth')->name('login.attempt');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('console.admin')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::post('/push/subscribe', [PushSubscriptionController::class, 'store'])->name('push.subscribe');
        Route::delete('/push/subscribe', [PushSubscriptionController::class, 'destroy'])->name('push.destroy');

        Route::get('/donations', [DonationController::class, 'index'])->name('donations.index');
        Route::get('/donations/export', [DonationController::class, 'export'])->name('donations.export');
        Route::get('/donations/create', [DonationController::class, 'create'])->name('donations.create');
        Route::post('/donations', [DonationController::class, 'store'])->name('donations.store');
        Route::get('/donations/{donation}', [DonationController::class, 'show'])->name('donations.show');
        Route::get('/donations/{donation}/edit', [DonationController::class, 'edit'])->name('donations.edit');
        Route::post('/donations/{donation}', [DonationController::class, 'update'])->name('donations.update');
        Route::post('/donations/{donation}/approve', [DonationController::class, 'approve'])->name('donations.approve');
        Route::post('/donations/{donation}/reject', [DonationController::class, 'reject'])->name('donations.reject');
        Route::post('/donations/{donation}/publish', [DonationController::class, 'publish'])->name('donations.publish');
        Route::post('/donations/{donation}/status', [DonationController::class, 'setStatus'])->name('donations.status');
        Route::post('/donations/{donation}/split', [DonationController::class, 'split'])->name('donations.split');
        Route::post('/donations/{donation}/unsplit', [DonationController::class, 'unsplit'])->name('donations.unsplit');

        Route::get('/warehouses', [WarehouseController::class, 'index'])->name('warehouses.index');
        Route::get('/warehouses/create', [WarehouseController::class, 'create'])->name('warehouses.create');
        Route::post('/warehouses', [WarehouseController::class, 'store'])->name('warehouses.store');
        Route::get('/warehouses/{warehouse}/edit', [WarehouseController::class, 'edit'])->name('warehouses.edit');
        Route::post('/warehouses/{warehouse}', [WarehouseController::class, 'update'])->name('warehouses.update');
        Route::post('/warehouses/{warehouse}/toggle', [WarehouseController::class, 'toggle'])->name('warehouses.toggle');

        Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
        Route::post('/orders/group/{group}/accept', [OrderController::class, 'acceptGroup'])->name('orders.group.accept');
        Route::post('/orders/group/{group}/deliver', [OrderController::class, 'deliverGroup'])->name('orders.group.deliver');
        Route::post('/orders/group/{group}/cancel', [OrderController::class, 'cancelGroup'])->name('orders.group.cancel');
        Route::post('/orders/{order}/accept', [OrderController::class, 'accept'])->name('orders.accept');
        Route::post('/orders/{order}/deliver', [OrderController::class, 'deliver'])->name('orders.deliver');
        Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');

        Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index');
        Route::post('/wallet/packages', [PackageController::class, 'store'])->name('wallet.packages.store');
        Route::get('/wallet/packages/{package}/edit', [PackageController::class, 'edit'])->name('wallet.packages.edit');
        Route::post('/wallet/packages/{package}', [PackageController::class, 'update'])->name('wallet.packages.update');
        Route::post('/wallet/packages/{package}/toggle', [PackageController::class, 'toggle'])->name('wallet.packages.toggle');
        Route::post('/wallet/packages/{package}/delete', [PackageController::class, 'destroy'])->name('wallet.packages.destroy');
        Route::post('/wallet/{topup}/approve', [WalletController::class, 'approve'])->name('wallet.approve');
        Route::post('/wallet/{topup}/reject', [WalletController::class, 'reject'])->name('wallet.reject');

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::post('/users/grant-bulk', [UserController::class, 'grantBulk'])->name('users.grant-bulk');
        Route::get('/users/{user}', [UserController::class, 'show'])->name('users.show');
        Route::post('/users/{user}/toggle', [UserController::class, 'toggle'])->name('users.toggle');
        Route::post('/users/{user}/grant', [UserController::class, 'grant'])->name('users.grant');

        Route::get('/community', [CommunityController::class, 'index'])->name('community.index');
        Route::post('/community/{post}/keep', [CommunityController::class, 'keep'])->name('community.keep');
        Route::post('/community/{post}/remove', [CommunityController::class, 'remove'])->name('community.remove');

        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::post('/categories/{category}/toggle', [CategoryController::class, 'toggle'])->name('categories.toggle');

        Route::get('/learn', [LearnController::class, 'index'])->name('learn.index');
        Route::get('/learn/create', [LearnController::class, 'create'])->name('learn.create');
        Route::post('/learn', [LearnController::class, 'store'])->name('learn.store');
        Route::get('/learn/{article}/edit', [LearnController::class, 'edit'])->name('learn.edit');
        Route::post('/learn/{article}', [LearnController::class, 'update'])->name('learn.update');

        Route::get('/campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
        Route::post('/campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
        Route::get('/campaigns/{campaign}/edit', [CampaignController::class, 'edit'])->name('campaigns.edit');
        Route::post('/campaigns/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
        Route::post('/campaigns/{campaign}/toggle', [CampaignController::class, 'toggle'])->name('campaigns.toggle');
        Route::post('/campaigns/{campaign}/delete', [CampaignController::class, 'destroy'])->name('campaigns.destroy');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

        Route::prefix('support')->name('support.')->group(function () {
            Route::get('/faqs', [SupportFaqController::class, 'index'])->name('faqs.index');
            Route::post('/faqs', [SupportFaqController::class, 'store'])->name('faqs.store');
            Route::get('/faqs/{faq}/edit', [SupportFaqController::class, 'edit'])->name('faqs.edit');
            Route::post('/faqs/{faq}', [SupportFaqController::class, 'update'])->name('faqs.update');
            Route::post('/faqs/{faq}/toggle', [SupportFaqController::class, 'toggle'])->name('faqs.toggle');
            Route::post('/faqs/{faq}/delete', [SupportFaqController::class, 'destroy'])->name('faqs.destroy');

            Route::get('/pages', [SupportPageController::class, 'index'])->name('pages.index');
            Route::post('/pages', [SupportPageController::class, 'store'])->name('pages.store');
            Route::get('/pages/{page}/edit', [SupportPageController::class, 'edit'])->name('pages.edit');
            Route::post('/pages/{page}', [SupportPageController::class, 'update'])->name('pages.update');
            Route::post('/pages/{page}/toggle', [SupportPageController::class, 'toggle'])->name('pages.toggle');
            Route::post('/pages/{page}/delete', [SupportPageController::class, 'destroy'])->name('pages.destroy');

            Route::get('/contact', [SupportContactController::class, 'edit'])->name('contact.edit');
            Route::post('/contact', [SupportContactController::class, 'update'])->name('contact.update');

            Route::get('/reports', [SupportReportController::class, 'index'])->name('reports.index');
            Route::get('/reports/{report}', [SupportReportController::class, 'show'])->name('reports.show');
            Route::post('/reports/{report}', [SupportReportController::class, 'update'])->name('reports.update');
        });

        Route::middleware('console.super')->group(function () {
            Route::get('/countries', [CountryController::class, 'index'])->name('countries.index');
            Route::post('/countries/{country}/toggle', [CountryController::class, 'toggle'])->name('countries.toggle');

            Route::get('/admins', [AdminController::class, 'index'])->name('admins.index');
            Route::get('/admins/create', [AdminController::class, 'create'])->name('admins.create');
            Route::post('/admins', [AdminController::class, 'store'])->name('admins.store');
            Route::get('/admins/{user}/edit', [AdminController::class, 'edit'])->name('admins.edit');
            Route::post('/admins/{user}', [AdminController::class, 'update'])->name('admins.update');
            Route::post('/admins/{user}/approve', [AdminController::class, 'approve'])->name('admins.approve');

            Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
            Route::get('/settings/pesapal', [PaymentGatewayController::class, 'edit'])->name('settings.pesapal.edit');
            Route::post('/settings/pesapal', [PaymentGatewayController::class, 'update'])->name('settings.pesapal.update');
            Route::post('/settings/pesapal/register-ipn', [PaymentGatewayController::class, 'registerIpn'])->name('settings.pesapal.register-ipn');
            Route::post('/settings/pesapal/test', [PaymentGatewayController::class, 'test'])->name('settings.pesapal.test');

            Route::get('/settings/mail', [MailSettingController::class, 'edit'])->name('settings.mail.edit');
            Route::post('/settings/mail', [MailSettingController::class, 'update'])->name('settings.mail.update');
            Route::post('/settings/mail/test', [MailSettingController::class, 'test'])->name('settings.mail.test');

            Route::get('/settings/google', [GoogleAuthController::class, 'edit'])->name('settings.google.edit');
            Route::post('/settings/google', [GoogleAuthController::class, 'update'])->name('settings.google.update');

            Route::get('/settings/branding', [BrandingController::class, 'edit'])->name('settings.branding.edit');
            Route::post('/settings/branding', [BrandingController::class, 'update'])->name('settings.branding.update');
        });
    });
});
