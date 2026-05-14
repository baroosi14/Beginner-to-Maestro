<?php
$body    = file_get_contents('php://input');
$sig     = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$secret  = STRIPE_WEBHOOK_SECRET;

// Verify Stripe webhook signature
$parts = [];
foreach (explode(',', $sig) as $part) {
    [$k,$v] = explode('=', $part, 2);
    $parts[$k] = $v;
}
$timestamp = $parts['t'] ?? '';
$expected  = hash_hmac('sha256', "$timestamp.$body", $secret);
if (!hash_equals($expected, $parts['v1'] ?? '')) {
    http_response_code(400); exit;
}

$event = json_decode($body, true);

if ($event['type'] === 'checkout.session.completed') {
    $session = $event['data']['object'];
    $ref     = $session['client_reference_id'] ?? '';
    if ($ref) {
        $db  = Database::getInstance();
        $pay = $db->prepare('SELECT * FROM payments WHERE provider_ref = ?');
        $pay->execute([$ref]);
        $payment = $pay->fetch();

        if ($payment && $payment['status'] !== 'success') {
            $db->prepare('UPDATE payments SET status="success", paid_at=NOW() WHERE provider_ref=?')
               ->execute([$ref]);
            if ($payment['course_id']) {
                $db->prepare(
                    'INSERT INTO enrollments (user_id, course_id, status) VALUES (?,?,"active")
                     ON DUPLICATE KEY UPDATE status="active"'
                )->execute([$payment['user_id'], $payment['course_id']]);
            }
        }
    }
}

http_response_code(200);
echo json_encode(['received' => true]);
