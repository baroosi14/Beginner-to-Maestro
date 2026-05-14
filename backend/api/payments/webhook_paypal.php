<?php
$body  = file_get_contents('php://input');
$event = json_decode($body, true);

if (($event['event_type'] ?? '') === 'PAYMENT.CAPTURE.COMPLETED') {
    $ref = $event['resource']['supplementary_data']['related_ids']['order_id'] ?? '';
    // For PayPal, find by order_id stored in metadata
    if ($ref) {
        $db  = Database::getInstance();
        $pay = $db->prepare("SELECT * FROM payments WHERE JSON_EXTRACT(metadata,'$.paypal_order_id') = ?");
        $pay->execute([$ref]);
        $payment = $pay->fetch();
        if ($payment && $payment['status'] !== 'success') {
            $db->prepare('UPDATE payments SET status="success", paid_at=NOW() WHERE id=?')
               ->execute([$payment['id']]);
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
