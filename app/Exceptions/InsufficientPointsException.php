<?php

namespace App\Exceptions;

use Exception;

class InsufficientPointsException extends Exception
{
    protected $message = 'Insufficient points in wallet';
}
