<?php
global $_ROUTE_PARAMS;
AuthMiddleware::requireAdmin();
$db     = Database::getInstance();
$method = $_SERVER['REQUEST_METHOD'];
$sid    = isset($_ROUTE_PARAMS[0]) ? (int)$_ROUTE_PARAMS[0] : null;

if ($method === 'GET' && !$sid) {
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, (int)($_GET['per_page'] ?? 20));
    $offset  = ($page - 1) * $perPage;
    $search  = $_GET['q'] ?? '';
    $where   = ['role = "student"'];
    $params  = [];
    if ($search) {
        $where[] = '(full_name LIKE ? OR email LIKE ? OR student_id LIKE ?)';
        $s = "%$search%";
        $params = [$s,$s,$s];
    }
    $ws = 'WHERE ' . implode(' AND ', $where);
    $total = (int)$db->prepare("SELECT COUNT(*) FROM users $ws")->execute($params) ? 0 : 0;
    $cs    = $db->prepare("SELECT COUNT(*) FROM users $ws"); $cs->execute($params); $total = (int)$cs->fetchColumn();
    $stmt  = $db->prepare(
        "SELECT id, student_id, full_name, email, phone, is_active, created_at FROM users $ws ORDER BY created_at DESC LIMIT ? OFFSET ?"
    );
    $stmt->execute([...$params, $perPage, $offset]);
    Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
}

if ($method === 'GET' && $sid) {
    $stmt = $db->prepare('SELECT id, student_id, full_name, email, phone, is_active, created_at FROM users WHERE id=? AND role="student"');
    $stmt->execute([$sid]);
    $u = $stmt->fetch();
    if (!$u) Response::error('Student not found', 404);
    // Enrollment summary
    $en = $db->prepare('SELECT COUNT(*) FROM enrollments WHERE user_id=? AND status="active"');
    $en->execute([$sid]);
    $u['enrolled_courses'] = (int)$en->fetchColumn();
    Response::success($u);
}

if ($method === 'PATCH' && $sid) {
    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fields = []; $params = [];
    if (isset($body['is_active'])) { $fields[] = 'is_active=?'; $params[] = (int)$body['is_active']; }
    if (isset($body['full_name'])) { $fields[] = 'full_name=?'; $params[] = trim($body['full_name']); }
    if (!$fields) Response::error('Nothing to update', 422);
    $params[] = $sid;
    $db->prepare('UPDATE users SET ' . implode(',',$fields) . ' WHERE id=?')->execute($params);
    Response::success(null, 'Student updated');
}

if ($method === 'DELETE' && $sid) {
    $db->prepare('UPDATE users SET is_active=0 WHERE id=? AND role="student"')->execute([$sid]);
    Response::success(null, 'Student deactivated');
}

Response::error('Method not allowed', 405);
