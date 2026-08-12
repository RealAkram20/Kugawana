<?php

use App\Jobs\ExpireOverdueFoodJob;
use App\Jobs\ExpireStalePesapalTopupsJob;
use Illuminate\Support\Facades\Schedule;

Schedule::job(new ExpireOverdueFoodJob)->everyFifteenMinutes();
Schedule::job(new ExpireStalePesapalTopupsJob)->hourly();
