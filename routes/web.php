<?php

use App\Http\Controllers\Console\AdminController;
use App\Http\Controllers\Console\AuthController;
use App\Http\Controllers\Console\CampaignController;
use App\Http\Controllers\Console\CategoryController;
use App\Http\Controllers\Console\CommunityController;
use App\Http\Controllers\Console\CountryController;
use App\Http\Controllers\Console\DashboardController;
use App\Http\Controllers\Console\DonationController;
use App\Http\Controllers\Console\LearnController;
use App\Http\Controllers\Console\OrderController;
use App\Http\Controllers\Console\PackageController;
use App\Http\Controllers\Console\ReportController;
use App\Http\Controllers\Console\SettingsController;
use App\Http\Controllers\Console\UserController;
use App\Http\Controllers\Console\WalletController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('console.login');
});

Route::get('/admin/{any?}', fn () => redirect()->route('console.login'))->where('any', '.*');
Route::get('/super-admin/{any?}', fn () => redirect()->route('console.login'))->where('any', '.*');

Route::prefix('console')->name('console.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.attempt');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::middleware('console.admin')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

        Route::get('/donations', [DonationController::class, 'index'])->name('donations.index');
        Route::get('/donations/export', [DonationController::class, 'export'])->name('donations.export');
        Route::get('/donations/{donation}', [DonationController::class, 'show'])->name('donations.show');
        Route::get('/donations/{donation}/edit', [DonationController::class, 'edit'])->name('donations.edit');
        Route::post('/donations/{donation}', [DonationController::class, 'update'])->name('donations.update');
        Route::post('/donations/{donation}/approve', [DonationController::class, 'approve'])->name('donations.approve');
        Route::post('/donations/{donation}/reject', [DonationController::class, 'reject'])->name('donations.reject');
        Route::post('/donations/{donation}/publish', [DonationController::class, 'publish'])->name('donations.publish');
        Route::post('/donations/{donation}/status', [DonationController::class, 'setStatus'])->name('donations.status');
        Route::post('/donations/{donation}/split', [DonationController::class, 'split'])->name('donations.split');
        Route::post('/donations/{donation}/unsplit', [DonationController::class, 'unsplit'])->name('donations.unsplit');

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

        Route::get('/campaigns', [CampaignController::class, 'index'])->name('campaigns.index');
        Route::post('/campaigns', [CampaignController::class, 'store'])->name('campaigns.store');
        Route::get('/campaigns/{campaign}/edit', [CampaignController::class, 'edit'])->name('campaigns.edit');
        Route::post('/campaigns/{campaign}', [CampaignController::class, 'update'])->name('campaigns.update');
        Route::post('/campaigns/{campaign}/toggle', [CampaignController::class, 'toggle'])->name('campaigns.toggle');
        Route::post('/campaigns/{campaign}/delete', [CampaignController::class, 'destroy'])->name('campaigns.destroy');

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

        Route::middleware('console.super')->group(function () {
            Route::get('/countries', [CountryController::class, 'index'])->name('countries.index');
            Route::post('/countries/{country}/toggle', [CountryController::class, 'toggle'])->name('countries.toggle');

            Route::get('/admins', [AdminController::class, 'index'])->name('admins.index');
            Route::post('/admins/{user}/approve', [AdminController::class, 'approve'])->name('admins.approve');

            Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
        });
    });
});
