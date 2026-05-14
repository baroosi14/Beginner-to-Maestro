<?php
global $_ROUTE_PARAMS;
AuthMiddleware::requireAdmin();
$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$lid    = isset($_ROUTE_PARAMS[0]) ? (int)$_ROUTE_PARAMS[0] : null;
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
    foreach (['module_id','course_id','title'] as $f) {
        if (empty($body[$f])) Response::error("$f is required", 422);
    }
    $db->prepare(
        'INSERT INTO lessons (module_id, course_id, title, description, content_type, video_url,
         video_duration, resource_url, resource_name, is_free_preview, sort_order)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        (int)$body['module_id'], (int)$body['course_id'], $body['title'],
        $body['description'] ?? null,
        $body['content_type']    ?? 'video',
        $body['video_url']       ?? null,
        $body['video_duration']  ?? null,
        $body['resource_url']    ?? null,
        $body['resource_name']   ?? null,
        !empty($body['is_free_preview']) ? 1 : 0,
        (int)($body['sort_order'] ?? 0),
    ]);
    $newId = (int)$db->lastInsertId();
    // Update lesson count on course
    $db->prepare(
        'UPDATE courses SET total_lessons=(SELECT COUNT(*) FROM lessons WHERE course_id=?) WHERE id=?'
    )->execute([(int)$body['course_id'], (int)$body['course_id']]);

    Response::success(['id' => $newId], 'Lesson created', 201);
}

if ($method === 'PUT' && $lid) {
    $fields = []; $params = [];
    $map = ['title','description','content_type','video_url','video_duration','resource_url','resource_name','is_free_preview','sort_order'];
    foreach ($map as $f) {
        if (array_key_exists($f,$body)) {
            $fields[] = "$f=?";
            $params[] = $f === 'is_free_preview' ? (int)$body[$f] : $body[$f];
        }
    }
    if ($fields) { $params[] = $lid; $db->prepare('UPDATE lessons SET '.implode(',',$fields).' WHERE id=?')->execute($params); }
    Response::success(null,'Lesson updated');
}

if ($method === 'DELETE' && $lid) {
    $l = $db->prepare('SELECT course_id FROM lessons WHERE id=?'); $l->execute([$lid]); $row = $l->fetch();
    $db->prepare('DELETE FROM lessons WHERE id=?')->execute([$lid]);
    if ($row) {
        $db->prepare('UPDATE courses SET total_lessons=(SELECT COUNT(*) FROM lessons WHERE course_id=?) WHERE id=?')
           ->execute([$row['course_id'], $row['course_id']]);
    }
    Response::success(null,'Lesson deleted');
}

Response::error('Method not allowed', 405);
