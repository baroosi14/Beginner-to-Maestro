<?php
global $_ROUTE_PARAMS;
$id   = (int) $_ROUTE_PARAMS[0];
$db   = Database::getInstance();
$auth = AuthMiddleware::optionalAuth();

$stmt = $db->prepare(
    'SELECT lc.*, u.full_name as instructor, u.avatar_url as instructor_avatar,
            c.title as course_title
     FROM live_classes lc
     JOIN users u ON u.id = lc.instructor_id
     LEFT JOIN courses c ON c.id = lc.course_id
     WHERE lc.id = ?'
);
$stmt->execute([$id]);
$class = $stmt->fetch();
if (!$class) Response::error('Live class not found', 404);

$cnt = $db->prepare('SELECT COUNT(*) FROM live_class_registrations WHERE live_class_id=?');
$cnt->execute([$id]);
$class['registered_count'] = (int) $cnt->fetchColumn();

if ($auth) {
    $reg = $db->prepare(
        'SELECT id FROM live_class_registrations WHERE live_class_id=? AND user_id=?'
    );
    $reg->execute([$id, (int)$auth['sub']]);
    $class['is_registered'] = (bool) $reg->fetch();
    // Only expose meeting details to registered users
    if (!$class['is_registered']) {
        $class['meeting_url']      = null;
        $class['meeting_id']       = null;
        $class['meeting_password'] = null;
    }
}

Response::success($class);
