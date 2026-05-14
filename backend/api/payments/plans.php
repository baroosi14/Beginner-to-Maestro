<?php
$db   = Database::getInstance();
$stmt = $db->query('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC');
Response::success($stmt->fetchAll());
