<?php
/**
 * Poti Youth Hub - Database Connector (cPanel PHP API)
 * Database Credentials configured from secure cPanel parameters
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = '127.0.0.1'; // or 'localhost', standard for cPanel
$db   = 'potihub_db';
$user = 'potihub_user';
$pass = '+St,zGNQKIII.PO&';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     http_response_code(500);
     echo json_encode([
         "status" => "error",
         "message" => "Database Connection Failed: " . $e->getMessage()
     ]);
     exit();
}

/**
 * Send JSON response and exit
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Read raw JSON request payload
 */
function getJsonInput() {
    $raw = file_get_contents("php://input");
    return json_decode($raw, true);
}
