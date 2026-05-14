<?php
$db      = Database::getInstance();
$auth    = AuthMiddleware::optionalAuth();
$page    = max(1, (int) ($_GET['page'] ?? 1));
$perPage = (int) ($_GET['per_page'] ?? 12);
$perPage = min(50, $perPage);
$offset  = ($page - 1) * $perPage;

$where  = ['c.is_published = 1'];
$params = [];

if (!empty($_GET['category'])) {
    $where[] = 'cat.slug = ?';
    $params[] = $_GET['category'];
}
if (!empty($_GET['level'])) {
    $where[] = 'c.level = ?';
    $params[] = $_GET['level'];
}
if (!empty($_GET['q'])) {
    $where[] = '(c.title LIKE ? OR c.description LIKE ?)';
    $q = '%' . $_GET['q'] . '%';
    $params[] = $q;
    $params[] = $q;
}
if (isset($_GET['free'])) {
    $where[] = 'c.is_free = ?';
    $params[] = (int) $_GET['free'];
}

$whereStr = 'WHERE ' . implode(' AND ', $where);

$countStmt = $db->prepare("SELECT COUNT(*) FROM courses c LEFT JOIN categories cat ON cat.id = c.category_id $whereStr");
$countStmt->execute($params);
$total = (int) $countStmt->fetchColumn();

$params[] = $perPage;
$params[] = $offset;

$stmt = $db->prepare(
    "SELECT c.id, c.title, c.slug, c.description, c.thumbnail_url, c.level, c.price,
            c.currency, c.is_free, c.duration_hours, c.total_lessons, c.created_at,
            cat.name as category, cat.slug as category_slug,
            u.full_name as instructor
     FROM courses c
     LEFT JOIN categories cat ON cat.id = c.category_id
     LEFT JOIN users u ON u.id = c.instructor_id
     $whereStr
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute($params);
$courses = $stmt->fetchAll();

// Mark enrolled if logged in
if ($auth) {
    $uid = (int) $auth['sub'];
    $ids = array_column($courses, 'id');
    if ($ids) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $enrStmt = $db->prepare(
            "SELECT course_id FROM enrollments WHERE user_id = ? AND course_id IN ($placeholders) AND status='active'"
        );
        $enrStmt->execute([$uid, ...$ids]);
        $enrolled = array_column($enrStmt->fetchAll(), 'course_id');
        foreach ($courses as &$c) {
            $c['is_enrolled'] = in_array($c['id'], $enrolled, false);
        }
    }
}

Response::paginated($courses, $total, $page, $perPage);
