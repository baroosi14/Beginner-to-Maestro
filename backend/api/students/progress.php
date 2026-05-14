<?php
$auth     = AuthMiddleware::requireAuth();
$uid      = (int) $auth['sub'];
$db       = Database::getInstance();
$courseId = (int) ($_GET['course_id'] ?? 0);

if (!$courseId) Response::error('course_id required', 422);

// Verify enrollment
$enrol = $db->prepare(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"'
);
$enrol->execute([$uid, $courseId]);
if (!$enrol->fetch()) Response::error('Not enrolled in this course', 403);

$stmt = $db->prepare(
    'SELECT lp.lesson_id, lp.is_completed, lp.watch_time, lp.completed_at,
            l.title, l.sort_order, m.id as module_id, m.title as module_title
     FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id
     JOIN modules m ON m.id = l.module_id
     WHERE lp.user_id = ? AND lp.course_id = ?
     ORDER BY m.sort_order, l.sort_order'
);
$stmt->execute([$uid, $courseId]);

Response::success($stmt->fetchAll());
