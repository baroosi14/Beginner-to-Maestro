<?php
global $_ROUTE_PARAMS;
$auth = AuthMiddleware::requireAuth();
$uid  = (int) $auth['sub'];
$id   = (int) $_ROUTE_PARAMS[0];
$db   = Database::getInstance();

$class = $db->prepare(
    'SELECT id, title, scheduled_at, max_attendees, status FROM live_classes WHERE id = ?'
);
$class->execute([$id]);
$class = $class->fetch();
if (!$class) Response::error('Live class not found', 404);
if ($class['status'] === 'cancelled') Response::error('This class has been cancelled', 400);

// Check capacity
if ($class['max_attendees']) {
    $cnt = $db->prepare('SELECT COUNT(*) FROM live_class_registrations WHERE live_class_id=?');
    $cnt->execute([$id]);
    if ((int)$cnt->fetchColumn() >= (int)$class['max_attendees']) {
        Response::error('Class is full', 400);
    }
}

$db->prepare(
    'INSERT IGNORE INTO live_class_registrations (live_class_id, user_id) VALUES (?,?)'
)->execute([$id, $uid]);

// Reminder notification
$db->prepare(
    'INSERT INTO notifications (user_id, title, body, type, data) VALUES (?,?,?,"live_class",?)'
)->execute([
    $uid,
    "Registered: {$class['title']}",
    "You are registered for the class on " . date('M j, Y g:i A', strtotime($class['scheduled_at'])),
    json_encode(['live_class_id' => $id]),
]);

Response::success(['registered' => true], 'Registered for live class');
