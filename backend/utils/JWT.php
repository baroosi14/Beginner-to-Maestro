<?php
class JWT {
    private static function base64UrlEncode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string {
        $padded = str_pad(strtr($data, '-_', '+/'), strlen($data) + (4 - strlen($data) % 4) % 4, '=');
        return base64_decode($padded);
    }

    public static function generate(array $payload): string {
        $header  = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['iat'] = time();
        $payload['exp'] = time() + JWT_EXPIRY;
        $body    = self::base64UrlEncode(json_encode($payload));
        $sig     = self::base64UrlEncode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        return "$header.$body.$sig";
    }

    public static function verify(string $token): array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new RuntimeException('Invalid token format');
        }
        [$header, $body, $sig] = $parts;
        $expected = self::base64UrlEncode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        if (!hash_equals($expected, $sig)) {
            throw new RuntimeException('Invalid token signature');
        }
        $payload = json_decode(self::base64UrlDecode($body), true);
        if ($payload['exp'] < time()) {
            throw new RuntimeException('Token has expired');
        }
        return $payload;
    }

    public static function fromRequest(): array {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!$auth && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $auth    = $headers['Authorization'] ?? '';
        }
        if (!str_starts_with($auth, 'Bearer ')) {
            Response::error('Unauthorized – no token', 401);
        }
        try {
            return self::verify(substr($auth, 7));
        } catch (RuntimeException $e) {
            Response::error($e->getMessage(), 401);
        }
    }
}
