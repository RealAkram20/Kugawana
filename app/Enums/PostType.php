<?php

namespace App\Enums;

enum PostType: string
{
    case Request = 'request';
    case Offer = 'offer';
    case Discussion = 'discussion';
}
