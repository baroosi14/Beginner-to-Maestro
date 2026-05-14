<?php
// JWT is stateless; client discards the token.
// For server-side invalidation, maintain a token denylist in Redis/DB.
AuthMiddleware::requireAuth();
Response::success(null, 'Logged out successfully');
