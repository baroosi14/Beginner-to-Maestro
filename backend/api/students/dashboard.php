<?php
$auth = AuthMiddleware::requireAuth();
$uid  = (int) $auth['sub'];
$db   = Database::getInstance();

// Enrolled courses with progress
$enrollments = $db->prepare(
    'SELECT c.id, c.title, c.slug, c.thumbnail_url, c.total_lessons, c.level,
            e.enrolled_at, e.status as enrollment_status,
            cat.name as category,
            COALESCE(prog.completed,0) as completed_lessons
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     LEFT JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN (
         SELECT course_id, COUNT(*) as completed
         FROM lesson_progress
         WHERE user_id = ? AND is_completed = 1
         GROUP BY course_id
     ) prog ON prog.course_id = c.id
     WHERE e.user_id = ? AND e.status = "active"
     ORDER BY e.enrolled_at DESC
     LIMIT 6'
);
$enrollments->execute([$uid, $uid]);
$courses = $enrollments->fetchAll();

// Add percentage
foreach ($courses as &$c) {
    $total = (int) $c['total_lessons'];
    $done  = (int) $c['completed_lessons'];
    $c['progress_pct'] = $total > 0 ? round($done / $total * 100) : 0;
}

// Upcoming live classes
$live = $db->prepare(
    'SELECT lc.id, lc.title, lc.scheduled_at, lc.duration_mins, lc.platform, lc.meeting_url,
            u.full_name as instructor
     FROM live_classes lc
     JOIN users u ON u.id = lc.instructor_id
     LEFT JOIN live_class_registrations r ON r.live_class_id = lc.id AND r.user_id = ?
     WHERE lc.status = "scheduled" AND lc.scheduled_at >= NOW()
       AND (lc.course_id IN (SELECT course_id FROM enrollments WHERE user_id = ? AND status="active")
            OR r.user_id IS NOT NULL)
     ORDER BY lc.scheduled_at ASC
     LIMIT 5'
);
$live->execute([$uid, $uid]);

// Unread notifications count
$notif = $db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
$notif->execute([$uid]);

// Stats
$totalEnrolled = $db->prepare('SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND status="active"');
$totalEnrolled->execute([$uid]);

$totalCompleted = $db->prepare(
    'SELECT COUNT(DISTINCT course_id) FROM lesson_progress
     WHERE user_id = ? AND is_completed = 1'
);
$totalCompleted->execute([$uid]);

Response::success([
    'enrolled_courses'    => $courses,
    'upcoming_classes'    => $live->fetchAll(),
    'unread_notifications'=> (int) $notif->fetchColumn(),
    'stats'               => [
        'total_enrolled'  => (int) $totalEnrolled->fetchColumn(),
        'completed_courses'=> (int) $totalCompleted->fetchColumn(),
    ],
]);
