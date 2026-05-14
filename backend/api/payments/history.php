<?php
$auth = AuthMiddleware::requireAuth();
$uid  = (int) $auth['sub'];
$db   = Database::getInstance();

$stmt = $db->prepare(
    'SELECT p.id, p.amount, p.currency, p.provider, p.provider_ref, p.status, p.paid_at, p.created_at,
            c.title as course_title, c.slug as course_slug
     FROM payments p
     LEFT JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC
     LIMIT 50'
);
$stmt->execute([$uid]);
Response::success($stmt->fetchAll());
