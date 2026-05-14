<?php
global $_ROUTE_PARAMS;
$auth      = AuthMiddleware::requireAuth();
$uid       = (int) $auth['sub'];
$lessonId  = (int) $_ROUTE_PARAMS[0];
$db        = Database::getInstance();

$lesson = $db->prepare(
    'SELECT l.*, m.title as module_title, c.title as course_title, c.slug as course_slug
     FROM lessons l
     JOIN modules m ON m.id = l.module_id
     JOIN courses c ON c.id = l.course_id
     WHERE l.id = ?'
);
$lesson->execute([$lessonId]);
$lesson = $lesson->fetch();
if (!$lesson) Response::error('Lesson not found', 404);

// Free preview OR enrollment check
if (!$lesson['is_free_preview']) {
    $enrolled = $db->prepare(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"'
    );
    $enrolled->execute([$uid, $lesson['course_id']]);
    if (!$enrolled->fetch()) Response::error('Purchase this course to access this lesson', 403);
}

// Track view in progress table
$prog = $db->prepare(
    'INSERT INTO lesson_progress (user_id, lesson_id, course_id) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE updated_at = NOW()'
);
$prog->execute([$uid, $lessonId, $lesson['course_id']]);

Response::success($lesson);
