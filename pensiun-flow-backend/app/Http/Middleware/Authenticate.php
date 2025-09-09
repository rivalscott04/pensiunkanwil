<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo($request): ?string
    {
        // For API requests, do not redirect (let it return 401 JSON)
        if ($request->expectsJson() || $request->is('api/*')) {
            return null;
        }

        // If you later add a web login page, return route('login') here
        return null;
    }
}


