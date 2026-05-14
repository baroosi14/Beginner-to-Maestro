<?php
global $_ROUTE_PARAMS;
$auth     = AuthMiddleware::requireAuth();
$uid      = (int) $auth['sub'];
$slug     = $_ROUTE_PARAMS[0] ?? '';
$db       = Database::getInstance();

$course = $db->prepare('SELECT id, price, is_free, is_published FROM courses WHERE slug = ?');
$course->execute([$slug]);
$course = $course->fetch();
if (!$course) Response::error('Course not found', 404);
if (!$course['is_published']) Response::error('Course is not available', 400);

// Already enrolled?
$exists = $db->prepare(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"'
);
$exists->execute([$uid, $course['id']]);
if ($exists->fetch()) Response::error('Already enrolled', 409);

// Free courses enroll directly
if ($course['is_free'] || (float) $course['price'] === 0.0) {
    $db->prepare(
        'INSERT INTO enrollments (user_id, course_id, status) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status="active"'
    )->execute([$uid, $course['id'], 'active']);

    Response::success(['enrolled' => true], 'Enrolled successfully');
}

// Paid – check payment
$body = json_decode(file_get_contents('php://input'), true) ?? [];
$ref  = $body['payment_reference'] ?? '';
if (!$ref) Response::error('Payment reference required for paid course', 402);

$pay = $db->prepare(
    'SELECT id, status FROM payments WHERE provider_ref = ? AND user_id = ? AND course_id = ?'
);
$pay->execute([$ref, $uid, $course['id']]);
$payment = $pay->fetch();
if (!$payment || $payment['status'] !== 'success') {
    Response::error('Valid payment not found', 402);
}

$db->prepare(
    'INSERT INTO enrollments (user_id, course_id, status) VALUES (?,?,?) ON DUPLICATE KEY UPDATE status="active"'
)->execute([$uid, $course['id'], 'active']);

Response::success(['enrolled' => true], 'Enrollment confirmed');
