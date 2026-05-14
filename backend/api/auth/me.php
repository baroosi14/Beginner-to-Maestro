<?php
$auth = AuthMiddleware::requireAuth();
$db   = Database::getInstance();

$stmt = $db->prepare(
    'SELECT id, student_id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?'
);
$stmt->execute([$auth['sub']]);
$user = $stmt->fetch();

if (!$user) Response::error('User not found', 404);

Response::success($user);
