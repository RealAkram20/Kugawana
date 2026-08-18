<?php

namespace App\Exceptions;

use Exception;

class OutOfStockException extends Exception
{
    protected $message = 'Not enough units left in this donation';
}
