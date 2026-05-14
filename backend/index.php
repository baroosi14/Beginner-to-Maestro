<?php
// ============================================================
// Front Controller – routes all API requests
// ============================================================

require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/Response.php';
require_once __DIR__ . '/utils/JWT.php';
require_once __DIR__ . '/middleware/AuthMiddleware.php';

// --- CORS -------------------------------------------------------
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
$allowed = explode(',', ALLOWED_ORIGINS);
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: ' . $allowed[0]);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Simple router ----------------------------------------------
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = rtrim($uri, '/');
$method = $_SERVER['REQUEST_METHOD'];

// Strip /api prefix if present
$uri = preg_replace('#^/api#', '', $uri);

$routes = [
    // Auth
    ['POST',   '/auth/register',        'api/auth/register.php'],
    ['POST',   '/auth/login',           'api/auth/login.php'],
    ['POST',   '/auth/logout',          'api/auth/logout.php'],
    ['GET',    '/auth/me',              'api/auth/me.php'],

    // Students
    ['GET',    '/students/dashboard',   'api/students/dashboard.php'],
    ['GET',    '/students/profile',     'api/students/profile.php'],
    ['PUT',    '/students/profile',     'api/students/profile.php'],
    ['GET',    '/students/progress',    'api/students/progress.php'],

    // Courses (public + protected)
    ['GET',    '/courses',              'api/courses/index.php'],
    ['GET',    '/courses/([^/]+)',      'api/courses/detail.php'],
    ['POST',   '/courses/([^/]+)/enroll', 'api/courses/enroll.php'],

    // Lessons
    ['GET',    '/lessons/([0-9]+)',     'api/content/lesson.php'],
    ['POST',   '/lessons/([0-9]+)/progress', 'api/content/progress.php'],

    // Resources / downloads
    ['GET',    '/resources/([0-9]+)',   'api/content/resource.php'],

    // Payments
    ['POST',   '/payments/initiate',    'api/payments/initiate.php'],
    ['POST',   '/payments/verify',      'api/payments/verify.php'],
    ['GET',    '/payments/history',     'api/payments/history.php'],
    ['POST',   '/payments/webhook/paystack',    'api/payments/webhook_paystack.php'],
    ['POST',   '/payments/webhook/flutterwave', 'api/payments/webhook_flutterwave.php'],
    ['POST',   '/payments/webhook/stripe',      'api/payments/webhook_stripe.php'],
    ['POST',   '/payments/webhook/paypal',      'api/payments/webhook_paypal.php'],

    // Live classes
    ['GET',    '/live-classes',                 'api/live/index.php'],
    ['GET',    '/live-classes/([0-9]+)',         'api/live/detail.php'],
    ['POST',   '/live-classes/([0-9]+)/register','api/live/register.php'],

    // Notifications
    ['GET',    '/notifications',        'api/students/notifications.php'],
    ['POST',   '/notifications/([0-9]+)/read', 'api/students/notifications.php'],

    // Admin – students
    ['GET',    '/admin/students',               'api/admin/students.php'],
    ['GET',    '/admin/students/([0-9]+)',       'api/admin/students.php'],
    ['PATCH',  '/admin/students/([0-9]+)',       'api/admin/students.php'],
    ['DELETE', '/admin/students/([0-9]+)',       'api/admin/students.php'],

    // Admin – courses
    ['GET',    '/admin/courses',                'api/admin/courses.php'],
    ['POST',   '/admin/courses',                'api/admin/courses.php'],
    ['PUT',    '/admin/courses/([0-9]+)',        'api/admin/courses.php'],
    ['DELETE', '/admin/courses/([0-9]+)',        'api/admin/courses.php'],

    // Admin – modules & lessons
    ['POST',   '/admin/modules',                'api/admin/modules.php'],
    ['PUT',    '/admin/modules/([0-9]+)',        'api/admin/modules.php'],
    ['DELETE', '/admin/modules/([0-9]+)',        'api/admin/modules.php'],
    ['POST',   '/admin/lessons',                'api/admin/lessons.php'],
    ['PUT',    '/admin/lessons/([0-9]+)',        'api/admin/lessons.php'],
    ['DELETE', '/admin/lessons/([0-9]+)',        'api/admin/lessons.php'],

    // Admin – payments
    ['GET',    '/admin/payments',               'api/admin/payments.php'],

    // Admin – live classes
    ['GET',    '/admin/live-classes',           'api/admin/live_classes.php'],
    ['POST',   '/admin/live-classes',           'api/admin/live_classes.php'],
    ['PUT',    '/admin/live-classes/([0-9]+)',  'api/admin/live_classes.php'],
    ['DELETE', '/admin/live-classes/([0-9]+)', 'api/admin/live_classes.php'],

    // Admin – analytics
    ['GET',    '/admin/analytics',              'api/admin/analytics.php'],

    // Admin – media upload
    ['POST',   '/admin/media/upload',           'api/admin/media.php'],

    // Plans
    ['GET',    '/plans',                        'api/payments/plans.php'],
];

$matched = false;
foreach ($routes as [$routeMethod, $pattern, $file]) {
    $regex = '#^' . $pattern . '$#';
    if ($method === $routeMethod && preg_match($regex, $uri, $matches)) {
        array_shift($matches);
        $_ROUTE_PARAMS = $matches;    // available in included scripts
        $fullPath = __DIR__ . '/' . $file;
        if (!file_exists($fullPath)) {
            Response::error("Handler not found: $file", 500);
        }
        require $fullPath;
        $matched = true;
        break;
    }
}

if (!$matched) {
    Response::error('Route not found', 404);
}
