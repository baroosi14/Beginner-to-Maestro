<?php
global $_ROUTE_PARAMS;
$auth      = AuthMiddleware::requireAuth();
$uid       = (int) $auth['sub'];
$lessonId  = (int) $_ROUTE_PARAMS[0];
$db        = Database::getInstance();

$lesson = $db->prepare(
    'SELECT resource_url, resource_name, course_id FROM lessons WHERE id = ? AND resource_url IS NOT NULL'
);
$lesson->execute([$lessonId]);
$lesson = $lesson->fetch();
if (!$lesson) Response::error('Resource not found', 404);

$enrolled = $db->prepare(
    'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ? AND status = "active"'
);
$enrolled->execute([$uid, $lesson['course_id']]);
if (!$enrolled->fetch()) Response::error('Enroll to download this resource', 403);

// If S3 – redirect to pre-signed URL; if local – stream file
if (STORAGE_DRIVER === 's3') {
    // In production: generate a pre-signed S3 URL and redirect
    Response::success(['url' => $lesson['resource_url']]);
} else {
    $path = UPLOAD_DIR . ltrim($lesson['resource_url'], '/');
    if (!file_exists($path)) Response::error('File not found on server', 404);
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . ($lesson['resource_name'] ?: basename($path)) . '"');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}
