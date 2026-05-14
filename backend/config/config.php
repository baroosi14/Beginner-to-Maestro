<?php
// ============================================================
// Application Configuration
// ============================================================

define('APP_NAME',    'Beginner to Maestro');
define('APP_VERSION', '1.0.0');
define('APP_ENV',     getenv('APP_ENV') ?: 'production');
define('APP_URL',     getenv('APP_URL') ?: 'https://api.beginnertomaestro.com');

// JWT
define('JWT_SECRET',     getenv('JWT_SECRET') ?: 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET');
define('JWT_EXPIRY',     (int)(getenv('JWT_EXPIRY') ?: 86400));       // 24 h
define('JWT_REFRESH',    (int)(getenv('JWT_REFRESH') ?: 604800));     // 7 days

// CORS – comma-separated allowed origins
define('ALLOWED_ORIGINS', getenv('ALLOWED_ORIGINS') ?: 'http://localhost:3000,http://localhost:19006');

// File storage
define('STORAGE_DRIVER', getenv('STORAGE_DRIVER') ?: 'local');
define('UPLOAD_DIR',     __DIR__ . '/../../storage/uploads/');
define('MAX_UPLOAD_MB',  500);

// AWS S3 (only when STORAGE_DRIVER=s3)
define('AWS_ACCESS_KEY', getenv('AWS_ACCESS_KEY_ID') ?: '');
define('AWS_SECRET_KEY', getenv('AWS_SECRET_ACCESS_KEY') ?: '');
define('AWS_REGION',     getenv('AWS_REGION') ?: 'us-east-1');
define('AWS_BUCKET',     getenv('AWS_S3_BUCKET') ?: '');

// Payment gateways
define('PAYSTACK_SECRET',      getenv('PAYSTACK_SECRET_KEY') ?: '');
define('PAYSTACK_PUBLIC',      getenv('PAYSTACK_PUBLIC_KEY') ?: '');
define('FLUTTERWAVE_SECRET',   getenv('FLUTTERWAVE_SECRET_KEY') ?: '');
define('FLUTTERWAVE_PUBLIC',   getenv('FLUTTERWAVE_PUBLIC_KEY') ?: '');
define('STRIPE_SECRET',        getenv('STRIPE_SECRET_KEY') ?: '');
define('STRIPE_PUBLIC',        getenv('STRIPE_PUBLISHABLE_KEY') ?: '');
define('STRIPE_WEBHOOK_SECRET',getenv('STRIPE_WEBHOOK_SECRET') ?: '');
define('PAYPAL_CLIENT_ID',     getenv('PAYPAL_CLIENT_ID') ?: '');
define('PAYPAL_CLIENT_SECRET', getenv('PAYPAL_CLIENT_SECRET') ?: '');
define('PAYPAL_MODE',          getenv('PAYPAL_MODE') ?: 'sandbox');  // sandbox|live

// Zoom integration
define('ZOOM_API_KEY',    getenv('ZOOM_API_KEY') ?: '');
define('ZOOM_API_SECRET', getenv('ZOOM_API_SECRET') ?: '');

// Email (SMTP)
define('MAIL_HOST',     getenv('MAIL_HOST') ?: 'smtp.mailtrap.io');
define('MAIL_PORT',     getenv('MAIL_PORT') ?: 2525);
define('MAIL_USERNAME', getenv('MAIL_USERNAME') ?: '');
define('MAIL_PASSWORD', getenv('MAIL_PASSWORD') ?: '');
define('MAIL_FROM',     getenv('MAIL_FROM') ?: 'noreply@beginnertomaestro.com');
define('MAIL_FROM_NAME',getenv('MAIL_FROM_NAME') ?: 'Beginner to Maestro');
