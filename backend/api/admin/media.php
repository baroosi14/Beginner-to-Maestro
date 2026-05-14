<?php
$auth = AuthMiddleware::requireAdmin();
$db   = Database::getInstance();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);
if (empty($_FILES['file'])) Response::error('No file uploaded', 422);

$file    = $_FILES['file'];
$maxSize = MAX_UPLOAD_MB * 1024 * 1024;

if ($file['error'] !== UPLOAD_ERR_OK) Response::error('Upload error code ' . $file['error'], 422);
if ($file['size'] > $maxSize) Response::error('File exceeds ' . MAX_UPLOAD_MB . 'MB limit', 413);

$allowed = ['video/mp4','video/webm','audio/mpeg','audio/mp4','application/pdf','image/jpeg','image/png','image/webp'];
$finfo   = new finfo(FILEINFO_MIME_TYPE);
$mime    = $finfo->file($file['tmp_name']);
if (!in_array($mime, $allowed, true)) Response::error("File type $mime is not allowed", 415);

if (STORAGE_DRIVER === 's3') {
    // Upload to S3 using AWS SDK or presigned POST
    // For brevity, generate pre-signed upload URL approach:
    Response::error('S3 upload: use presigned URL flow', 501);
}

// Local storage
$dir  = UPLOAD_DIR . date('Y/m/');
if (!is_dir($dir)) mkdir($dir, 0755, true);
$ext  = pathinfo($file['name'], PATHINFO_EXTENSION);
$name = bin2hex(random_bytes(16)) . '.' . strtolower($ext);
$dest = $dir . $name;

if (!move_uploaded_file($file['tmp_name'], $dest)) Response::error('Failed to save file', 500);

$relativePath = 'uploads/' . date('Y/m/') . $name;
$db->prepare(
    'INSERT INTO media (uploader_id, file_name, file_path, file_type, file_size, disk) VALUES (?,?,?,?,?,"local")'
)->execute([(int)$auth['sub'], $file['name'], $relativePath, $mime, $file['size']]);

Response::success([
    'id'   => (int)$db->lastInsertId(),
    'url'  => APP_URL . '/' . $relativePath,
    'path' => $relativePath,
    'name' => $file['name'],
    'size' => $file['size'],
    'mime' => $mime,
], 'File uploaded', 201);
