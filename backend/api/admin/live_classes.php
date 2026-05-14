<?php
global $_ROUTE_PARAMS;
$admin  = AuthMiddleware::requireAdmin();
$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$lid    = isset($_ROUTE_PARAMS[0]) ? (int)$_ROUTE_PARAMS[0] : null;

if ($method === 'GET') {
    $stmt = $db->query(
        'SELECT lc.*, u.full_name as instructor, c.title as course_title,
                (SELECT COUNT(*) FROM live_class_registrations r WHERE r.live_class_id=lc.id) as registered_count
         FROM live_classes lc
         JOIN users u ON u.id=lc.instructor_id
         LEFT JOIN courses c ON c.id=lc.course_id
         ORDER BY lc.scheduled_at DESC'
    );
    Response::success($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    foreach (['title','scheduled_at'] as $f) {
        if (empty($body[$f])) Response::error("$f is required", 422);
    }
    $db->prepare(
        'INSERT INTO live_classes (title, description, instructor_id, course_id, scheduled_at, duration_mins,
         platform, meeting_url, meeting_id, meeting_password, max_attendees, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $body['title'],
        $body['description']      ?? null,
        (int)($body['instructor_id'] ?? $admin['sub']),
        $body['course_id']        ?? null,
        $body['scheduled_at'],
        (int)($body['duration_mins'] ?? 60),
        $body['platform']         ?? 'zoom',
        $body['meeting_url']      ?? null,
        $body['meeting_id']       ?? null,
        $body['meeting_password'] ?? null,
        $body['max_attendees']    ?? null,
        'scheduled',
    ]);
    Response::success(['id' => (int)$db->lastInsertId()], 'Live class created', 201);
}

if ($method === 'PUT' && $lid) {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = []; $params = [];
    $map = ['title','description','scheduled_at','duration_mins','platform','meeting_url','meeting_id','meeting_password','max_attendees','status','is_recorded','recording_url'];
    foreach ($map as $f) {
        if (array_key_exists($f,$body)) { $fields[] = "$f=?"; $params[] = $body[$f]; }
    }
    if ($fields) { $params[] = $lid; $db->prepare('UPDATE live_classes SET '.implode(',',$fields).' WHERE id=?')->execute($params); }
    Response::success(null,'Live class updated');
}

if ($method === 'DELETE' && $lid) {
    $db->prepare("UPDATE live_classes SET status='cancelled' WHERE id=?")->execute([$lid]);
    Response::success(null,'Live class cancelled');
}

Response::error('Method not allowed', 405);
