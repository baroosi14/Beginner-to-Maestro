<?php
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$identifier = trim($body['identifier'] ?? '');  // email OR student_id
$password   = $body['password'] ?? '';

if (!$identifier || !$password) {
    Response::error('Identifier and password are required', 422);
}

$db   = Database::getInstance();
$stmt = $db->prepare(
    'SELECT id, student_id, full_name, email, password_hash, role, avatar_url, is_active
     FROM users
     WHERE email = ? OR student_id = ?
     LIMIT 1'
);
$stmt->execute([$identifier, $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    Response::error('Invalid credentials', 401);
}
if (!$user['is_active']) {
    Response::error('Account deactivated. Contact support.', 403);
}

$token = JWT::generate([
    'sub'        => (int) $user['id'],
    'role'       => $user['role'],
    'student_id' => $user['student_id'],
]);

unset($user['password_hash'], $user['is_active']);

Response::success([
    'token' => $token,
    'user'  => $user,
], 'Login successful');
