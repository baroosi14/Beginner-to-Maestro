<?php
$auth = AuthMiddleware::requireAuth();
$uid  = (int) $auth['sub'];
$db   = Database::getInstance();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare(
        'SELECT id, student_id, full_name, email, phone, role, avatar_url, created_at FROM users WHERE id = ?'
    );
    $stmt->execute([$uid]);
    Response::success($stmt->fetch());
}

// PUT – update profile
$body     = json_decode(file_get_contents('php://input'), true) ?? [];
$fields   = [];
$params   = [];

if (!empty($body['full_name'])) { $fields[] = 'full_name = ?';  $params[] = trim($body['full_name']); }
if (!empty($body['phone']))     { $fields[] = 'phone = ?';      $params[] = trim($body['phone']); }
if (!empty($body['avatar_url'])){ $fields[] = 'avatar_url = ?'; $params[] = trim($body['avatar_url']); }

if (!empty($body['password'])) {
    if (strlen($body['password']) < 8) Response::error('Password must be at least 8 characters', 422);
    $fields[] = 'password_hash = ?';
    $params[] = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);
}

if (empty($fields)) Response::error('No valid fields to update', 422);

$params[] = $uid;
$db->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);

$stmt = $db->prepare(
    'SELECT id, student_id, full_name, email, phone, role, avatar_url FROM users WHERE id = ?'
);
$stmt->execute([$uid]);
Response::success($stmt->fetch(), 'Profile updated');
