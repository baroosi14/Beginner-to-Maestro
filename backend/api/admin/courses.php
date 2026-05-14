<?php
global $_ROUTE_PARAMS;
$admin  = AuthMiddleware::requireAdmin();
$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$cid    = isset($_ROUTE_PARAMS[0]) ? (int)$_ROUTE_PARAMS[0] : null;

function slugify(string $text): string {
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text), '-'));
}

if ($method === 'GET') {
    $stmt = $db->query(
        'SELECT c.*, cat.name as category, u.full_name as instructor,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id=c.id AND e.status="active") as enrollment_count
         FROM courses c
         LEFT JOIN categories cat ON cat.id=c.category_id
         LEFT JOIN users u ON u.id=c.instructor_id
         ORDER BY c.created_at DESC'
    );
    Response::success($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $required = ['title','description','price'];
    foreach ($required as $f) {
        if (empty($body[$f])) Response::error("$f is required", 422);
    }
    $slug = slugify($body['title']) . '-' . uniqid();
    $db->prepare(
        'INSERT INTO courses (title,slug,description,thumbnail_url,category_id,instructor_id,level,price,currency,is_free,is_published,duration_hours)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $body['title'], $slug, $body['description'],
        $body['thumbnail_url'] ?? null,
        $body['category_id']  ?? null,
        (int)$admin['sub'],
        $body['level']    ?? 'beginner',
        (float)$body['price'],
        $body['currency'] ?? 'USD',
        !empty($body['is_free']) ? 1 : 0,
        !empty($body['is_published']) ? 1 : 0,
        $body['duration_hours'] ?? null,
    ]);
    Response::success(['id' => (int)$db->lastInsertId(), 'slug' => $slug], 'Course created', 201);
}

if ($method === 'PUT' && $cid) {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = []; $params = [];
    $map = ['title','description','thumbnail_url','category_id','level','price','currency','is_free','is_published','duration_hours'];
    foreach ($map as $f) {
        if (array_key_exists($f, $body)) {
            $fields[] = "$f=?";
            $params[] = in_array($f,['is_free','is_published']) ? (int)$body[$f] : $body[$f];
        }
    }
    if (!$fields) Response::error('Nothing to update', 422);
    $params[] = $cid;
    $db->prepare('UPDATE courses SET ' . implode(',',$fields) . ' WHERE id=?')->execute($params);

    // Recalculate total_lessons
    $db->prepare(
        'UPDATE courses c SET total_lessons=(SELECT COUNT(*) FROM lessons l WHERE l.course_id=c.id) WHERE c.id=?'
    )->execute([$cid]);

    Response::success(null, 'Course updated');
}

if ($method === 'DELETE' && $cid) {
    $db->prepare('DELETE FROM courses WHERE id=?')->execute([$cid]);
    Response::success(null, 'Course deleted');
}

Response::error('Method not allowed', 405);
