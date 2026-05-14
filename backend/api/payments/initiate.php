<?php
$auth     = AuthMiddleware::requireAuth();
$uid      = (int) $auth['sub'];
$db       = Database::getInstance();
$body     = json_decode(file_get_contents('php://input'), true) ?? [];

$provider   = strtolower($body['provider']  ?? '');
$type       = $body['type']       ?? 'course';   // course | subscription
$itemId     = (int) ($body['item_id'] ?? 0);
$callbackUrl= $body['callback_url'] ?? APP_URL . '/payment/success';

$allowedProviders = ['paystack','flutterwave','stripe','paypal'];
if (!in_array($provider, $allowedProviders, true)) {
    Response::error('Invalid payment provider', 422);
}

// Resolve amount
$amount   = 0;
$currency = 'USD';
$courseId = null;
$planId   = null;

if ($type === 'course') {
    $course = $db->prepare('SELECT id, price, currency, title, is_free FROM courses WHERE id = ?');
    $course->execute([$itemId]);
    $course = $course->fetch();
    if (!$course) Response::error('Course not found', 404);
    if ($course['is_free']) Response::error('This course is free – enroll directly', 400);
    $amount   = (float) $course['price'];
    $currency = $course['currency'];
    $courseId = $course['id'];
} elseif ($type === 'subscription') {
    $plan = $db->prepare('SELECT id, price, currency FROM subscription_plans WHERE id = ? AND is_active = 1');
    $plan->execute([$itemId]);
    $plan = $plan->fetch();
    if (!$plan) Response::error('Plan not found', 404);
    $amount  = (float) $plan['price'];
    $currency= $plan['currency'];
    $planId  = $plan['id'];
}

// Fetch user
$user = $db->prepare('SELECT email, full_name FROM users WHERE id = ?');
$user->execute([$uid]);
$user = $user->fetch();

// Create pending payment record
$ref = strtoupper($provider) . '-' . uniqid('', true);
$ins = $db->prepare(
    'INSERT INTO payments (user_id, course_id, subscription_id, amount, currency, provider, provider_ref, status)
     VALUES (?,?,NULL,?,?,?,?,"pending")'
);
$ins->execute([$uid, $courseId, $amount, $currency, $provider, $ref]);

// Build provider-specific payload
$response = match ($provider) {
    'paystack'    => paystackInitiate($user, $amount, $currency, $ref, $callbackUrl),
    'flutterwave' => flutterwaveInitiate($user, $amount, $currency, $ref, $callbackUrl),
    'stripe'      => stripeInitiate($user, $amount, $currency, $ref),
    'paypal'      => paypalInitiate($user, $amount, $currency, $ref, $callbackUrl),
    default       => Response::error('Provider not supported', 400),
};

Response::success(array_merge(['reference' => $ref], $response), 'Payment initiated');

// ---------------------------------------------------------------
function paystackInitiate(array $u, float $amt, string $cur, string $ref, string $cb): array {
    $payload = json_encode([
        'email'        => $u['email'],
        'amount'       => (int) ($amt * 100),
        'currency'     => $cur,
        'reference'    => $ref,
        'callback_url' => $cb,
        'metadata'     => ['full_name' => $u['full_name']],
    ]);
    $ch = curl_init('https://api.paystack.co/transaction/initialize');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . PAYSTACK_SECRET,
        ],
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    if (!($result['status'] ?? false)) {
        Response::error('Paystack error: ' . ($result['message'] ?? 'Unknown'), 502);
    }
    return ['authorization_url' => $result['data']['authorization_url']];
}

function flutterwaveInitiate(array $u, float $amt, string $cur, string $ref, string $cb): array {
    $payload = json_encode([
        'tx_ref'          => $ref,
        'amount'          => $amt,
        'currency'        => $cur,
        'redirect_url'    => $cb,
        'customer'        => ['email' => $u['email'], 'name' => $u['full_name']],
        'customizations'  => ['title' => APP_NAME],
    ]);
    $ch = curl_init('https://api.flutterwave.com/v3/payments');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . FLUTTERWAVE_SECRET,
        ],
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    if (($result['status'] ?? '') !== 'success') {
        Response::error('Flutterwave error: ' . ($result['message'] ?? 'Unknown'), 502);
    }
    return ['authorization_url' => $result['data']['link']];
}

function stripeInitiate(array $u, float $amt, string $cur, string $ref): array {
    $params = http_build_query([
        'payment_method_types[]' => 'card',
        'line_items[0][price_data][currency]'              => strtolower($cur),
        'line_items[0][price_data][product_data][name]'    => APP_NAME . ' Course',
        'line_items[0][price_data][unit_amount]'           => (int) ($amt * 100),
        'line_items[0][quantity]'                          => 1,
        'mode'           => 'payment',
        'success_url'    => APP_URL . '/payment/success?ref=' . $ref,
        'cancel_url'     => APP_URL . '/payment/cancel',
        'client_reference_id' => $ref,
        'customer_email' => $u['email'],
    ]);
    $ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $params,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => STRIPE_SECRET . ':',
    ]);
    $result = json_decode(curl_exec($ch), true);
    curl_close($ch);
    if (isset($result['error'])) {
        Response::error('Stripe error: ' . $result['error']['message'], 502);
    }
    return ['authorization_url' => $result['url'], 'session_id' => $result['id']];
}

function paypalInitiate(array $u, float $amt, string $cur, string $ref, string $cb): array {
    $mode   = PAYPAL_MODE === 'live' ? 'api-m.paypal.com' : 'api-m.sandbox.paypal.com';
    // Get access token
    $ch = curl_init("https://$mode/v1/oauth2/token");
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERPWD        => PAYPAL_CLIENT_ID . ':' . PAYPAL_CLIENT_SECRET,
    ]);
    $token = json_decode(curl_exec($ch), true)['access_token'] ?? '';
    curl_close($ch);
    if (!$token) Response::error('PayPal auth failed', 502);

    $order = json_encode([
        'intent' => 'CAPTURE',
        'purchase_units' => [[
            'reference_id' => $ref,
            'amount'       => ['currency_code' => $cur, 'value' => number_format($amt, 2, '.', '')],
        ]],
        'application_context' => [
            'return_url' => $cb . '?ref=' . $ref,
            'cancel_url' => APP_URL . '/payment/cancel',
        ],
    ]);
    $ch2 = curl_init("https://$mode/v2/checkout/orders");
    curl_setopt_array($ch2, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $order,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            "Authorization: Bearer $token",
        ],
    ]);
    $result = json_decode(curl_exec($ch2), true);
    curl_close($ch2);
    $approveLink = collect($result['links'] ?? []); // simple iteration
    $url = '';
    foreach ($result['links'] ?? [] as $link) {
        if ($link['rel'] === 'approve') { $url = $link['href']; break; }
    }
    return ['authorization_url' => $url, 'order_id' => $result['id']];
}
