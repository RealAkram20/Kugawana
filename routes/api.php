<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CommunityController;
use App\Http\Controllers\Api\FoodController;
use App\Http\Controllers\Api\LearnController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::get('/food', [FoodController::class, 'index']);
    Route::get('/food/mine', [FoodController::class, 'mine']);
    Route::get('/food/{food}', [FoodController::class, 'show']);
    Route::post('/food', [FoodController::class, 'store']);
    Route::get('/categories', [FoodController::class, 'categories']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);

    Route::get('/wallet', [WalletController::class, 'index']);
    Route::get('/wallet/packages', [WalletController::class, 'packages']);
    Route::post('/wallet/topup', [WalletController::class, 'topup']);

    Route::get('/community', [CommunityController::class, 'index']);
    Route::post('/community', [CommunityController::class, 'store']);
    Route::post('/community/{post}/like', [CommunityController::class, 'like']);

    Route::get('/learn', [LearnController::class, 'index']);
    Route::get('/learn/{article}', [LearnController::class, 'show']);
});
