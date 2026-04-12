<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LoanController;
use App\Http\Controllers\NegotiationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RatingController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect'])->middleware('throttle:10,1');
    Route::get('/google/callback', [AuthController::class, 'googleCallback'])->middleware('throttle:10,1');
});

Route::get('/categories', [CategoryController::class, 'index']);

Route::get('/items', [ItemController::class, 'index']);
Route::get('/items/{item}', [ItemController::class, 'show'])->whereNumber('item');

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
    });

    Route::get('/profile', [AuthController::class, 'profile']);

    Route::get('/dashboard', DashboardController::class);

    Route::post('/categories', [CategoryController::class, 'store']);

    Route::get('/items/mine', [ItemController::class, 'myItems']);
    Route::post('/items', [ItemController::class, 'store']);
    Route::put('/items/{item}', [ItemController::class, 'update'])->whereNumber('item');
    Route::delete('/items/{item}', [ItemController::class, 'destroy'])->whereNumber('item');

    Route::post('/loans', [LoanController::class, 'request']);
    Route::post('/loans/request', [LoanController::class, 'request']);
    Route::get('/loans/borrowed', [LoanController::class, 'myBorrowedLoans']);
    Route::get('/loans/lent', [LoanController::class, 'myLentLoans']);
    Route::get('/loans/{loan}', [LoanController::class, 'show'])->whereNumber('loan');
    Route::post('/loans/{loan}/approve', [LoanController::class, 'approve'])->whereNumber('loan');
    Route::post('/loans/{loan}/accept', [LoanController::class, 'approve'])->whereNumber('loan');
    Route::post('/loans/{loan}/counter-offer', [LoanController::class, 'counterOffer'])->whereNumber('loan');
    Route::post('/loans/{loan}/negotiate', [LoanController::class, 'counterOffer'])->whereNumber('loan');
    Route::post('/loans/{loan}/cancel', [LoanController::class, 'cancel'])->whereNumber('loan');
    Route::post('/loans/{loan}/confirm-handover', [LoanController::class, 'confirmHandover'])->whereNumber('loan');
    Route::post('/loans/{loan}/confirm-delivery', [LoanController::class, 'confirmHandover'])->whereNumber('loan');
    Route::get('/loans/{loan}/handover-code', [LoanController::class, 'getDeliveryCode'])->whereNumber('loan');
    Route::get('/loans/{loan}/delivery-code', [LoanController::class, 'getDeliveryCode'])->whereNumber('loan');
    Route::post('/loans/{loan}/start-return', [LoanController::class, 'initiateReturn'])->whereNumber('loan');
    Route::post('/loans/{loan}/initiate-return', [LoanController::class, 'initiateReturn'])->whereNumber('loan');
    Route::post('/loans/{loan}/confirm-return', [LoanController::class, 'confirmReturn'])->whereNumber('loan');
    Route::post('/loans/{loan}/rate', [LoanController::class, 'rate'])->whereNumber('loan');
    Route::delete('/loans/{loan}', [LoanController::class, 'destroy'])->whereNumber('loan');

    Route::post('/negotiations/{negotiation}/accept', [NegotiationController::class, 'accept'])->whereNumber('negotiation');

    Route::get('/users/{user}/ratings', [RatingController::class, 'userRatings'])->whereNumber('user');

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->whereNumber('notification');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::get('/admin/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/admin/users', [ReportController::class, 'users']);
    Route::patch('/admin/users/{user}/toggle', [ReportController::class, 'toggleUser'])->whereNumber('user');
    Route::post('/admin/users/{user}/toggle', [ReportController::class, 'toggleUser'])->whereNumber('user');
    Route::delete('/admin/users/{user}', [ReportController::class, 'deleteUser'])->whereNumber('user');
});
