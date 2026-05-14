<?php
class AuthMiddleware {
    public static function requireAuth(): array {
        return JWT::fromRequest();
    }

    public static function requireAdmin(): array {
        $payload = JWT::fromRequest();
        if (($payload['role'] ?? '') !== 'admin') {
            Response::error('Forbidden – admin only', 403);
        }
        return $payload;
    }

    public static function optionalAuth(): ?array {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!$auth) return null;
        try {
            return JWT::fromRequest();
        } catch (Throwable) {
            return null;
        }
    }
}
