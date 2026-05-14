<?php
global $_ROUTE_PARAMS;
$slug = $_ROUTE_PARAMS[0] ?? '';
$db   = Database::getInstance();
$auth = AuthMiddleware::optionalAuth();

$stmt = $db->prepare(
    'SELECT c.*, cat.name as category, cat.slug as category_slug,
            u.full_name as instructor, u.avatar_url as instructor_avatar
     FROM courses c
     LEFT JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN users u ON u.id = c.instructor_id
     WHERE c.slug = ? AND c.is_published = 1'
);
$stmt->execute([$slug]);
$course = $stmt->fetch();
if (!$course) Response::error('Course not found', 404);

// Modules + lessons
$modStmt = $db->prepare(
    'SELECT id, title, description, sort_order FROM modules WHERE course_id = ? ORDER BY sort_order'
);
$modStmt->execute([$course['id']]);
$modules = $modStmt->fetchAll();

$enrolled = false;
if ($auth) {
    $e = $db->prepare(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"'
    );
    $e->execute([$auth['sub'], $course['id']]);
    $enrolled = (bool) $e->fetch();
}

foreach ($modules as &$mod) {
    $lesStmt = $db->prepare(
        'SELECT id, title, content_type, video_duration, is_free_preview, sort_order,
                ' . ($enrolled ? 'video_url, resource_url, resource_name' : '"" as video_url') . '
         FROM lessons WHERE module_id = ? ORDER BY sort_order'
    );
    $lesStmt->execute([$mod['id']]);
    $mod['lessons'] = $lesStmt->fetchAll();
}

$course['modules']     = $modules;
$course['is_enrolled'] = $enrolled;

// Enrollment count
$cnt = $db->prepare('SELECT COUNT(*) FROM enrollments WHERE course_id = ? AND status="active"');
$cnt->execute([$course['id']]);
$course['enrollment_count'] = (int) $cnt->fetchColumn();

Response::success($course);
