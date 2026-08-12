<?php

namespace Tests\Feature;

use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * There is no public landing page: the root URL belongs to the admin
     * console, which sends anyone who is not signed in to its login screen.
     */
    public function test_the_root_url_sends_visitors_to_the_console_login(): void
    {
        $this->get('/console')->assertRedirect(route('console.login'));

        $this->get('/console/login')->assertOk();
    }
}
