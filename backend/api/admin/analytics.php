<?php
AuthMiddleware::requireAdmin();
$db = Database::getInstance();

// Overview stats
$totalStudents  = (int)$db->query('SELECT COUNT(*) FROM users WHERE role="student"')->fetchColumn();
$activeStudents = (int)$db->query('SELECT COUNT(DISTINCT user_id) FROM enrollments WHERE status="active"')->fetchColumn();
$totalCourses   = (int)$db->query('SELECT COUNT(*) FROM courses WHERE is_published=1')->fetchColumn();
$totalRevenue   = (float)$db->query('SELECT COALESCE(SUM(amount),0) FROM payments WHERE status="success"')->fetchColumn();
$totalPayments  = (int)$db->query('SELECT COUNT(*) FROM payments WHERE status="success"')->fetchColumn();
$totalEnrollments = (int)$db->query('SELECT COUNT(*) FROM enrollments WHERE status="active"')->fetchColumn();
$upcomingClasses  = (int)$db->query('SELECT COUNT(*) FROM live_classes WHERE status="scheduled" AND scheduled_at>=NOW()')->fetchColumn();

// Revenue by month (last 12 months)
$revByMonth = $db->query(
    'SELECT DATE_FORMAT(paid_at, "%Y-%m") as month, SUM(amount) as revenue, COUNT(*) as count
     FROM payments WHERE status="success" AND paid_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month'
)->fetchAll();

// Enrollments by month
$enrByMonth = $db->query(
    'SELECT DATE_FORMAT(enrolled_at, "%Y-%m") as month, COUNT(*) as count
     FROM enrollments WHERE enrolled_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month'
)->fetchAll();

// Top courses by enrollment
$topCourses = $db->query(
    'SELECT c.title, c.slug, COUNT(e.id) as enrollments, c.price
     FROM courses c LEFT JOIN enrollments e ON e.course_id=c.id AND e.status="active"
     GROUP BY c.id ORDER BY enrollments DESC LIMIT 5'
)->fetchAll();

// Revenue by provider
$revByProvider = $db->query(
    'SELECT provider, SUM(amount) as revenue, COUNT(*) as count
     FROM payments WHERE status="success" GROUP BY provider'
)->fetchAll();

// New registrations last 30 days
$newStudents = $db->query(
    'SELECT DATE(created_at) as date, COUNT(*) as count
     FROM users WHERE role="student" AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY date ORDER BY date'
)->fetchAll();

Response::success([
    'overview' => [
        'total_students'    => $totalStudents,
        'active_students'   => $activeStudents,
        'total_courses'     => $totalCourses,
        'total_revenue'     => $totalRevenue,
        'total_payments'    => $totalPayments,
        'total_enrollments' => $totalEnrollments,
        'upcoming_classes'  => $upcomingClasses,
    ],
    'revenue_by_month'   => $revByMonth,
    'enrollments_by_month'=> $enrByMonth,
    'top_courses'        => $topCourses,
    'revenue_by_provider'=> $revByProvider,
    'new_students_30d'   => $newStudents,
]);
