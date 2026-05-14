<?php
class Database {
    private static ?PDO $instance = null;

    private function __construct() {}

    public static function getInstance(): PDO {
        if (self::$instance === null) {
            $host   = getenv('DB_HOST')     ?: '127.0.0.1';
            $port   = getenv('DB_PORT')     ?: '3306';
            $db     = getenv('DB_DATABASE') ?: 'beginner_to_maestro';
            $user   = getenv('DB_USERNAME') ?: 'root';
            $pass   = getenv('DB_PASSWORD') ?: '';

            $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
            ];
            self::$instance = new PDO($dsn, $user, $pass, $options);
        }
        return self::$instance;
    }
}
