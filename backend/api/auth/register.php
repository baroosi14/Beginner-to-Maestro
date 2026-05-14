<?php
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$fullName = trim($body['full_name'] ?? '');
$email    = trim($body['email']     ?? '');
$phone    = trim($body['phone']     ?? '');
$password = $body['password']       ?? '';

$errors = [];
if (!$fullName)                         $errors['full_name'] = 'Full name is required';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Valid email required';
if (strlen($password) < 8)              $errors['password'] = 'Password must be at least 8 characters';

if ($errors) Response::error('Validation failed', 422, $errors);

$db = Database::getInstance();

// Duplicate check
$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) Response::error('Email already registered', 409);

// Generate student ID: BTM-YEAR-XXXX
$year  = date('Y');
$stmt2 = $db->query("SELECT COUNT(*) FROM users WHERE role='student'");
$count = (int) $stmt2->fetchColumn() + 1;
$studentId = sprintf('BTM-%s-%04d', $year, $count);

$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

$ins = $db->prepare(
    'INSERT INTO users (student_id, full_name, email, phone, password_hash) VALUES (?,?,?,?,?)'
);
$ins->execute([$studentId, $fullName, $email, $phone, $hash]);
$userId = (int) $db->lastInsertId();

$token = JWT::generate(['sub' => $userId, 'role' => 'student', 'student_id' => $studentId]);

Response::success([
    'token'      => $token,
    'student_id' => $studentId,
    'user'       => [
        'id'        => $userId,
        'full_name' => $fullName,
        'email'     => $email,
        'role'      => 'student',
    ],
], 'Registration successful', 201);
