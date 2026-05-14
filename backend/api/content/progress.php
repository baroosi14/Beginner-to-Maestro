<?php
global $_ROUTE_PARAMS;
$auth     = AuthMiddleware::requireAuth();
$uid      = (int) $auth['sub'];
$lessonId = (int) $_ROUTE_PARAMS[0];
$db       = Database::getInstance();
$body     = json_decode(file_get_contents('php://input'), true) ?? [];

$watchTime   = (int) ($body['watch_time'] ?? 0);
$isCompleted = !empty($body['completed']) ? 1 : 0;

$lesson = $db->prepare('SELECT course_id FROM lessons WHERE id = ?');
$lesson->execute([$lessonId]);
$lesson = $lesson->fetch();
if (!$lesson) Response::error('Lesson not found', 404);

$enrolled = $db->prepare(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"'
);
$enrolled->execute([$uid, $lesson['course_id']]);
if (!$enrolled->fetch()) Response::error('Not enrolled', 403);

$completedAt = $isCompleted ? date('Y-m-d H:i:s') : null;

$db->prepare(
    'INSERT INTO lesson_progress (user_id, lesson_id, course_id, watch_time, is_completed, completed_at)
     VALUES (?,?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       watch_time = GREATEST(watch_time, VALUES(watch_time)),
       is_completed = GREATEST(is_completed, VALUES(is_completed)),
       completed_at = COALESCE(completed_at, VALUES(completed_at))'
)->execute([$uid, $lessonId, $lesson['course_id'], $watchTime, $isCompleted, $completedAt]);

Response::success(['saved' => true]);
