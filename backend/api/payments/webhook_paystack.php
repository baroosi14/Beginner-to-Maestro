<?php
// Validate signature
$body = file_get_contents('php://input');
$sig  = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';
if (hash_hmac('sha512', $body, PAYSTACK_SECRET) !== $sig) {
    http_response_code(400); exit;
}

$event = json_decode($body, true);
if (($event['event'] ?? '') !== 'charge.success') {
    http_response_code(200); echo 'ok'; exit;
}

$ref    = $event['data']['reference'] ?? '';
$status = $event['data']['status']    ?? '';

if ($ref && $status === 'success') {
    $db = Database::getInstance();
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

        $db->prepare(
            'INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,"payment")'
        )->execute([
            $payment['user_id'],
            'Payment Confirmed',
            "Payment of {$payment['currency']} {$payment['amount']} confirmed via Paystack.",
        ]);
    }
}

http_response_code(200);
echo json_encode(['received' => true]);
