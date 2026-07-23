<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\LearnController;
use App\Http\Controllers\Api\MemberController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RatingController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/google', [AuthController::class, 'google']);

Route::get('/wallet/pesapal/callback', [WalletController::class, 'pesapalCallback']);
Route::get('/wallet/pesapal/ipn', [WalletController::class, 'pesapalIpn']);
Route::post('/wallet/pesapal/ipn', [WalletController::class, 'pesapalIpn']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::get('/members', [MemberController::class, 'index']);
    Route::get('/members/{member}', [MemberController::class, 'show']);

    Route::get('/food', [FoodController::class, 'index']);
    Route::get('/food/mine', [FoodController::class, 'mine']);
    Route::get('/food/{food}', [FoodController::class, 'show']);
    Route::post('/food', [FoodController::class, 'store']);
    Route::put('/food/{food}', [FoodController::class, 'update']);
    Route::post('/food/{food}/complete', [FoodController::class, 'complete']);
    Route::get('/food/{food}/interested', [FoodController::class, 'interested']);
    Route::get('/categories', [FoodController::class, 'categories']);
    Route::get('/units', [FoodController::class, 'units']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);
    Route::post('/orders/{order}/complete', [OrderController::class, 'complete']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{order}/rate', [RatingController::class, 'store']);
    Route::get('/members/{member}/reviews', [RatingController::class, 'forMember']);

    Route::get('/wallet', [WalletController::class, 'index']);
    Route::get('/wallet/packages', [WalletController::class, 'packages']);
    Route::post('/wallet/topup', [WalletController::class, 'topup']);
    Route::get('/wallet/topup/{topup}/status', [WalletController::class, 'topupStatus']);

    Route::get('/community', [CommunityController::class, 'index']);
    Route::post('/community', [CommunityController::class, 'store']);
    Route::get('/community/{post}', [CommunityController::class, 'show']);
    Route::post('/community/{post}/like', [CommunityController::class, 'like']);
    Route::post('/community/{post}/comment', [CommunityController::class, 'comment']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::post('/push-token', [NotificationController::class, 'registerToken']);
    Route::delete('/push-token', [NotificationController::class, 'removeToken']);

    Route::get('/learn', [LearnController::class, 'index']);
    Route::get('/learn/{article}', [LearnController::class, 'show']);
});
