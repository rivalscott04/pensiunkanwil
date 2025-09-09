<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $origin = $request->headers->get('Origin');
        $allowed = array_map('trim', explode(',', (string) env('FRONTEND_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080')));

        if ($origin && in_array($origin, $allowed, true)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
        }

        // Handle preflight
        if ($request->getMethod() === 'OPTIONS') {
            $resp = response('')->setStatusCode(204);
            if ($origin && in_array($origin, $allowed, true)) {
                $resp->headers->set('Access-Control-Allow-Origin', $origin);
                $resp->headers->set('Vary', 'Origin');
                $resp->headers->set('Access-Control-Allow-Credentials', 'true');
                $resp->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
                $resp->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With');
            }
            return $resp;
        }

        return $response;
    }
}


