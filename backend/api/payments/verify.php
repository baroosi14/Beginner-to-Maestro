<?php
$auth     = AuthMiddleware::requireAuth();
$uid      = (int) $auth['sub'];
$db       = Database::getInstance();
$body     = json_decode(file_get_contents('php://input'), true) ?? [];

$ref      = $body['reference'] ?? '';
$provider = strtolower($body['provider'] ?? '');

if (!$ref || !$provider) Response::error('reference and provider required', 422);

$payment = $db->prepare(
    'SELECT * FROM payments WHERE provider_ref = ? AND user_id = ?'
);
$payment->execute([$ref, $uid]);
$payment = $payment->fetch();
if (!$payment) Response::error('Payment not found', 404);
if ($payment['status'] === 'success') Response::success(['verified' => true], 'Already verified');

$verified = match ($provider) {
    'paystack'    => verifyPaystack($ref),
    'flutterwave' => verifyFlutterwave($ref),
    'stripe'      => verifyStripe($ref),
    default       => false,
};

if (!$verified) Response::error('Payment verification failed', 402);

// Mark payment success
$db->prepare(
    'UPDATE payments SET status="success", paid_at=NOW() WHERE provider_ref=?'
)->execute([$ref]);

// Enroll user in course if applicable
if ($payment['course_id']) {
    $db->prepare(
        'INSERT INTO enrollments (user_id, course_id, status) VALUES (?,?,"active")
         ON DUPLICATE KEY UPDATE status="active"'
    )->execute([$uid, $payment['course_id']]);
}

// Notification
$db->prepare(
    'INSERT INTO notifications (user_id, title, body, type) VALUES (?,?,?,"payment")'
)->execute([$uid, 'Payment Successful', "Your payment of {$payment['currency']} {$payment['amount']} was received."]);

Response::success(['verified' => true, 'enrolled' => (bool) $payment['course_id']], 'Payment verified');

function verifyPaystack(string $ref): bool {
    $ch = curl_init("https://api.paystack.co/transaction/verify/$ref");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . PAYSTACK_SECRET],
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return ($result['data']['status'] ?? '') === 'success';
}

function verifyFlutterwave(string $ref): bool {
    $ch = curl_init("https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=$ref");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . FLUTTERWAVE_SECRET],
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return ($result['data']['status'] ?? '') === 'successful';
}

function verifyStripe(string $sessionId): bool {
    $ch = curl_init("https://api.stripe.com/v1/checkout/sessions/$sessionId");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => STRIPE_SECRET . ':',
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return ($result['payment_status'] ?? '') === 'paid';
}
