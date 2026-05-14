<?php
$auth = AuthMiddleware::requireAuth();
$uid  = (int) $auth['sub'];
$db   = Database::getInstance();

global $_ROUTE_PARAMS;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $page    = max(1, (int) ($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;

    $total = (int) $db->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ?')
                       ->execute([$uid]) ? $db->query("SELECT FOUND_ROWS()")->fetchColumn() : 0;

    $stmt = $db->prepare(
        'SELECT id, title, body, type, is_read, data, created_at
         FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    );
    $stmt->execute([$uid, $perPage, $offset]);

    // mark all as read
    $db->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')->execute([$uid]);

    Response::success($stmt->fetchAll());
    exit;
}

// POST /notifications/:id/read
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_ROUTE_PARAMS[0])) {
    $nid = (int) $_ROUTE_PARAMS[0];
    $db->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
       ->execute([$nid, $uid]);
    Response::success(null, 'Marked as read');
}
