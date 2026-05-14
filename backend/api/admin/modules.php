<?php
global $_ROUTE_PARAMS;
AuthMiddleware::requireAdmin();
$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$mid    = isset($_ROUTE_PARAMS[0]) ? (int)$_ROUTE_PARAMS[0] : null;
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
    if (empty($body['course_id']) || empty($body['title'])) Response::error('course_id and title required', 422);
    $db->prepare('INSERT INTO modules (course_id, title, description, sort_order) VALUES (?,?,?,?)')->execute([
        (int)$body['course_id'], $body['title'],
        $body['description'] ?? null,
        (int)($body['sort_order'] ?? 0),
    ]);
    Response::success(['id' => (int)$db->lastInsertId()], 'Module created', 201);
}

if ($method === 'PUT' && $mid) {
    $fields = []; $params = [];
    foreach (['title','description','sort_order'] as $f) {
        if (isset($body[$f])) { $fields[] = "$f=?"; $params[] = $body[$f]; }
    }
    if ($fields) { $params[] = $mid; $db->prepare('UPDATE modules SET ' . implode(',',$fields) . ' WHERE id=?')->execute($params); }
    Response::success(null, 'Module updated');
}

if ($method === 'DELETE' && $mid) {
    $db->prepare('DELETE FROM modules WHERE id=?')->execute([$mid]);
    Response::success(null, 'Module deleted');
}

Response::error('Method not allowed', 405);
