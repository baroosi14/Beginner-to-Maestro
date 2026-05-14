<?php
$db   = Database::getInstance();
$auth = AuthMiddleware::optionalAuth();

$upcoming = isset($_GET['upcoming']);
$where    = ['lc.status != "cancelled"'];
$params   = [];
if ($upcoming) { $where[] = 'lc.scheduled_at >= NOW()'; }
if (!empty($_GET['course_id'])) { $where[] = 'lc.course_id = ?'; $params[] = (int)$_GET['course_id']; }

$whereStr = 'WHERE ' . implode(' AND ', $where);
$stmt = $db->prepare(
    "SELECT lc.id, lc.title, lc.description, lc.scheduled_at, lc.duration_mins, lc.platform,
            lc.meeting_url, lc.max_attendees, lc.is_recorded, lc.status,
            u.full_name as instructor, u.avatar_url as instructor_avatar,
            c.title as course_title, c.slug as course_slug,
            (SELECT COUNT(*) FROM live_class_registrations r WHERE r.live_class_id = lc.id) as registered_count
     FROM live_classes lc
     JOIN users u ON u.id = lc.instructor_id
     LEFT JOIN courses c ON c.id = lc.course_id
     $whereStr
     ORDER BY lc.scheduled_at ASC"
);
$stmt->execute($params);
$classes = $stmt->fetchAll();

if ($auth) {
    $uid = (int) $auth['sub'];
    $ids = array_column($classes, 'id');
    if ($ids) {
        $ph   = implode(',', array_fill(0, count($ids), '?'));
        $regS = $db->prepare("SELECT live_class_id FROM live_class_registrations WHERE user_id=? AND live_class_id IN($ph)");
        $regS->execute([$uid, ...$ids]);
        $registered = array_column($regS->fetchAll(), 'live_class_id');
        foreach ($classes as &$c) {
            $c['is_registered'] = in_array($c['id'], $registered, false);
        }
    }
}

Response::success($classes);
