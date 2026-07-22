<?php

use App\Jobs\ExpireOverdueFoodJob;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ExpireOverdueFoodJob)->everyFifteenMinutes();
