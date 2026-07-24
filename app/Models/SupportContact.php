<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportContact extends Model
{
    protected $fillable = [
        'intro',
        'email',
        'phone',
        'whatsapp',
        'hours',
    ];

    /**
     * The one and only settings row. Created on demand so a fresh install — or an
     * admin who opens the panel before the seeder runs — still gets a form to fill
     * rather than an empty table.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([]);
    }
}
