<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Models\Order;

class ResponsibilityScoreService
{
    public const COMPLETED_POINTS = 2;
    public const CANCELLED_POINTS = -10;

    public function update(Order $order): void
    {
        $change = match ($order->status) {
            OrderStatus::Completed => self::COMPLETED_POINTS,
            OrderStatus::Cancelled => self::CANCELLED_POINTS,
            default => 0,
        };

        if ($change !== 0) {
            $order->receiver()->increment('responsibility_score', $change);
        }
    }
}
