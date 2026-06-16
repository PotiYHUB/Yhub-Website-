<?php
/**
 * Poti Youth Hub - PHP API Helper
 * This file is automatically copied to the root of your public folder during building
 * and deployed via GitHub Actions to your production branch.
 */

// 1. Configure CORS Headers (To allow your React SPA to securely submit requests)
header("Access-Control-Allow-Origin: *"); // Adjust to your actual domain if you want stricter security
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests gracefully
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Helper function to return JSON responses
function sendResponse($status, $message, $data = null) {
    http_response_code($status);
    echo json_encode([
        "success" => $status >= 200 && $status < 300,
        "message" => $message,
        "data" => $data,
        "timestamp" => date('Y-m-d H:i:s')
    ]);
    exit();
}

// 3. Receive and parse raw JSON input (since React fetch sends JSON)
$inputRaw = file_get_contents("php://input");
$input = json_decode($inputRaw, true) ?: [];

// Get the action from query parameters or JSON body
$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : null);

if ($_SERVER['REQUEST_METHOD'] === 'GET' && !$action) {
    // Basic root check to verify the API is living and healthy
    sendResponse(200, "Poti Youth Hub API is online and fully configured.", [
        "php_version" => phpversion(),
        "server" => $_SERVER['SERVER_SOFTWARE'] ?? "Unknown"
    ]);
}

// 4. API Routing Logic
switch ($action) {
    case 'status':
        sendResponse(200, "API is active and accepting requests.", [
            "status" => "healthy"
        ]);
        break;

    case 'send_email':
        // Safe check for contact form emails
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            sendResponse(405, "Method Not Allowed. Use POST.");
        }

        $name = trim($input['name'] ?? '');
        $email = filter_var(trim($input['email'] ?? ''), FILTER_VALIDATE_EMAIL);
        $message = trim($input['message'] ?? '');

        if (empty($name) || !$email || empty($message)) {
            sendResponse(400, "Incomplete or invalid input data. Name, valid email, and message are required.");
        }

        // Email settings (Replace with your actual cPanel email if needed)
        $to = "yhub.poti@gmail.com"; 
        $subject = "ახალი შეტყობინება Poti Youth Hub-დან: " . htmlspecialchars($name);
        
        $body = "თქვენ მიიღეთ ახალი შეტყობინება ვებ-გვერდიდან:\n\n";
        $body .= "სახელი: " . htmlspecialchars($name) . "\n";
        $body .= "ელ-ფოსტა: " . htmlspecialchars($email) . "\n\n";
        $body .= "შეტყობინება:\n" . htmlspecialchars($message) . "\n";

        $headers = "From: webmaster@yhub.poti\r\n"; // Ensure this matches an allowed email domain on your hosting
        $headers .= "Reply-To: " . $email . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion();

        if (mail($to, $subject, $body, $headers)) {
            sendResponse(200, "Message sent successfully.");
        } else {
            sendResponse(500, "Failed to send the email. Ensure SMTP is configured on the hosting server.");
        }
        break;

    default:
        sendResponse(400, "Unknown API action or method requested.");
        break;
}
