<?php
AuthMiddleware::requireAdmin();
$db      = Database::getInstance();
$page    = max(1, (int)($_GET['page'] ?? 1));
$perPage = min(100, (int)($_GET['per_page'] ?? 20));
$offset  = ($page - 1) * $perPage;
$status  = $_GET['status'] ?? '';

$where = []; $params = [];
if ($status) { $where[] = 'p.status=?'; $params[] = $status; }
$ws = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$cs = $db->prepare("SELECT COUNT(*) FROM payments p $ws"); $cs->execute($params);
$total = (int)$cs->fetchColumn();

$params[] = $perPage; $params[] = $offset;
$stmt = $db->prepare(
    "SELECT p.id, p.amount, p.currency, p.provider, p.provider_ref, p.status, p.paid_at, p.created_at,
            u.full_name as student_name, u.student_id, u.email,
            c.title as course_title
     FROM payments p
     JOIN users u ON u.id=p.user_id
     LEFT JOIN courses c ON c.id=p.course_id
     $ws
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?"
);
$stmt->execute($params);
Response::paginated($stmt->fetchAll(), $total, $page, $perPage);
