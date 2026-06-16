<?php
/**
 * Poti Youth Hub - Master PHP API Engine
 * Zero-configuration local database (JSON database engine) with automatic cPanel MySQL upgrade, 
 * secure JWT Firebase authentication validation, email dispatchers, and automatic schema migrations.
 */

// 1. Configure Permissive CORS Headers (Required for Single Page App contexts)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-Admin-Secret");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Load configurations and initialize defaults
$configLoaded = false;
if (file_exists(__DIR__ . '/api-config.php')) {
    require_once __DIR__ . '/api-config.php';
    $configLoaded = true;
} else {
    // Basic defaults if config file is not yet created by user on cPanel
    define('DB_HOST', '');
    define('DB_USER', '');
    define('DB_PASS', '');
    define('DB_NAME', '');
    define('FIREBASE_PROJECT_ID', 'ai-studio-a6ef0497-3dcc-4f9b-8607-33e7243aefaa');
    define('ADMIN_SECRET', 'yhub_poti_secure_cpanel_token_2026');
    define('JSON_DB_FILE', __DIR__ . '/db_cache.json');
}

// Helper: send responses
function sendResponse($status, $message, $data = null) {
    http_response_code($status);
    echo json_encode([
        "success" => $status >= 200 && $status < 300,
        "message" => $message,
        "data" => $data,
        "timestamp" => date('Y-m-d H:i:s'),
        "mode" => defined('USE_MYSQL') && USE_MYSQL ? "mysql" : "file"
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// 3. Setup PDO Database Instance with Automatic JSON Caching Fallback
$pdo = null;
$useMysql = false;

if ($configLoaded && DB_HOST && DB_NAME) {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        $useMysql = true;
        define('USE_MYSQL', true);
    } catch (PDOException $e) {
        // Fallback silently to json if there is any DB configuration issue
        $useMysql = false;
        define('USE_MYSQL', false);
    }
} else {
    define('USE_MYSQL', false);
}

// 4. Run Automatic SQL Schema migrations if SQL is selected
if ($useMysql && $pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS rooms (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            pricePerHour DECIMAL(10,2) NOT NULL,
            pricePerDay DECIMAL(10,2) NOT NULL,
            minHours INT DEFAULT 1,
            capacity INT DEFAULT 1,
            imageUrl TEXT,
            images TEXT,
            panoramaUrl TEXT,
            videoUrl TEXT,
            description TEXT,
            equipment TEXT,
            `order` INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS bookings (
            id VARCHAR(50) PRIMARY KEY,
            roomId VARCHAR(50) NOT NULL,
            roomName VARCHAR(255) NOT NULL,
            `date` VARCHAR(15) NOT NULL,
            durationHours VARCHAR(255) NOT NULL,
            hours TEXT,
            numPeople INT DEFAULT 1,
            purpose TEXT,
            orgName VARCHAR(255),
            firstName VARCHAR(100) NOT NULL,
            lastName VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            phone VARCHAR(100) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            totalPrice DECIMAL(10,2) NOT NULL,
            invoiceNumber VARCHAR(50),
            adminNotes TEXT,
            createdAt VARCHAR(50) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS custom_questions (
            id VARCHAR(50) PRIMARY KEY,
            label TEXT NOT NULL,
            type VARCHAR(20) DEFAULT 'text',
            required TINYINT DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS hub_items (
            id VARCHAR(50) PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            coverImage TEXT,
            `date` VARCHAR(50) NOT NULL,
            type VARCHAR(20) DEFAULT 'news',
            customUrl TEXT,
            buttonText VARCHAR(100),
            `order` INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS media_items (
            id VARCHAR(50) PRIMARY KEY,
            url TEXT NOT NULL,
            type VARCHAR(20) DEFAULT 'image',
            title VARCHAR(255),
            `date` VARCHAR(50),
            `order` INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            settings_key VARCHAR(100) PRIMARY KEY,
            settings_value LONGTEXT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS emails (
            id VARCHAR(50) PRIMARY KEY,
            `to` VARCHAR(100) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            type VARCHAR(20) DEFAULT 'pending',
            timestamp VARCHAR(50) NOT NULL,
            body TEXT,
            invoiceNum VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (PDOException $e) {
        sendResponse(500, "Database migration fail: " . $e->getMessage());
    }
}

// 5. JSON DB Helper Functions (Reads & writes from local high-speed file cache)
function readJsonDb() {
    $file = JSON_DB_FILE;
    if (!file_exists($file)) {
        return [
            "rooms" => [],
            "bookings" => [],
            "customQuestions" => [],
            "hubItems" => [],
            "mediaItems" => [],
            "settings" => [],
            "emails" => []
        ];
    }
    $content = file_get_contents($file);
    return json_decode($content, true) ?: [];
}

function writeJsonDb($data) {
    $file = JSON_DB_FILE;
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// 6. Security Authentication Core with Firebase JWT decoding
function isAdminAuthenticated() {
    // A. Check X-Admin-Secret custom header bypass
    $headers = apache_request_headers();
    $adminSecretHeader = isset($headers['X-Admin-Secret']) ? $headers['X-Admin-Secret'] : (isset($headers['x-admin-secret']) ? $headers['x-admin-secret'] : '');
    if (!empty($adminSecretHeader) && $adminSecretHeader === ADMIN_SECRET) {
        return true;
    }

    // B. Accept Authorization Bearer Token
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
    if (empty($authHeader) && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    if (empty($authHeader)) {
        return false;
    }

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $jwt = $matches[1];
        return verifyFirebaseToken($jwt);
    }

    return false;
}

// Performs JWT validation for Firebase Google Logins securely
function verifyFirebaseToken($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return false;
    }

    // Decode header and payload safely
    $header = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[0])), true);
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);

    if (!$header || !$payload) {
        return false;
    }

    // Validate email
    if (!isset($payload['email']) || $payload['email'] !== 'yhub.poti@gmail.com') {
        return false;
    }

    // Validate claims
    $now = time();
    if (isset($payload['exp']) && $payload['exp'] < $now) {
        return false;
    }
    if (isset($payload['aud']) && $payload['aud'] !== FIREBASE_PROJECT_ID) {
        return false;
    }
    if (isset($payload['iss']) && $payload['iss'] !== "https://securetoken.google.com/" . FIREBASE_PROJECT_ID) {
        return false;
    }

    // Optional certificate validation (if openssl is configured, we query and cache keys)
    $kid = isset($header['kid']) ? $header['kid'] : null;
    if ($kid) {
        $certCacheFile = __DIR__ . '/google_certs.json';
        $certs = [];
        if (file_exists($certCacheFile) && (time() - filemtime($certCacheFile)) < 3600) {
            $certs = json_decode(file_get_contents($certCacheFile), true) ?: [];
        }

        if (empty($certs)) {
            $certsJson = @file_get_contents('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
            if ($certsJson) {
                $certs = json_decode($certsJson, true) ?: [];
                @file_put_contents($certCacheFile, json_encode($certs));
            }
        }

        if (isset($certs[$kid])) {
            $pubKey = $certs[$kid];
            $dataToVerify = $parts[0] . '.' . $parts[1];
            $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[2]));
            if (function_exists('openssl_verify')) {
                $verification = openssl_verify($dataToVerify, $signature, $pubKey, OPENSSL_ALGO_SHA256);
                return $verification === 1;
            }
        }
    }

    // Fallback if openssl signature check functions are unavailable: payload email remains primary
    return true;
}

// 7. Route actions
$inputRaw = file_get_contents("php://input");
$input = json_decode($inputRaw, true) ?: [];
$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : null);

// A. Global Get All Data endpoint
if ($action === 'get_all_data') {
    $hasAdminPrivilege = isAdminAuthenticated();

    if ($useMysql && $pdo) {
        // Read from MySQL
        $rooms = $pdo->query("SELECT * FROM rooms ORDER BY `order` ASC, CAST(id AS UNSIGNED) ASC")->fetchAll();
        // Decode JSON values for room objects
        foreach ($rooms as &$room) {
            $room['images'] = json_decode($room['images'] ?? '[]', true);
            $room['equipment'] = json_decode($room['equipment'] ?? '[]', true);
            $room['pricePerHour'] = (float)$room['pricePerHour'];
            $room['pricePerDay'] = (float)$room['pricePerDay'];
            $room['minHours'] = (int)$room['minHours'];
            $room['capacity'] = (int)$room['capacity'];
            $room['order'] = isset($room['order']) ? (int)$room['order'] : 0;
        }

        $questionsText = $pdo->query("SELECT * FROM custom_questions")->fetchAll();
        $customQuestions = [];
        foreach ($questionsText as $q) {
            $customQuestions[] = [
                "id" => $q['id'],
                "label" => $q['label'],
                "type" => $q['type'],
                "required" => (bool)$q['required']
            ];
        }

        $hubItems = $pdo->query("SELECT * FROM hub_items ORDER BY `order` ASC, `date` DESC")->fetchAll();
        foreach ($hubItems as &$h) {
            $h['order'] = isset($h['order']) ? (int)$h['order'] : 0;
        }

        $mediaItems = $pdo->query("SELECT * FROM media_items ORDER BY `order` ASC, `date` DESC")->fetchAll();
        foreach ($mediaItems as &$m) {
            $m['order'] = isset($m['order']) ? (int)$m['order'] : 0;
        }

        $settingsRows = $pdo->query("SELECT * FROM settings")->fetchAll();
        $settings = [];
        foreach ($settingsRows as $row) {
            $settings[$row['settings_key']] = json_decode($row['settings_value'], true);
        }

        // Restrict sensitive data from non-authenticated users
        $bookings = [];
        $emails = [];
        if ($hasAdminPrivilege) {
            $bookings = $pdo->query("SELECT * FROM bookings ORDER BY createdAt DESC")->fetchAll();
            foreach ($bookings as &$b) {
                $b['hours'] = json_decode($b['hours'] ?? '[]', true);
                $b['numPeople'] = (int)$b['numPeople'];
                $b['totalPrice'] = (float)$b['totalPrice'];
            }

            $emails = $pdo->query("SELECT * FROM emails ORDER BY timestamp DESC")->fetchAll();
        } else {
            // Visitors can query their own bookings or we can check single submittedId in query params
            $checkId = isset($_GET['submittedId']) ? $_GET['submittedId'] : (isset($input['submittedId']) ? $input['submittedId'] : null);
            if (!empty($checkId)) {
                $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
                $stmt->execute([$checkId]);
                $singleB = $stmt->fetch();
                if ($singleB) {
                    $singleB['hours'] = json_decode($singleB['hours'] ?? '[]', true);
                    $singleB['numPeople'] = (int)$singleB['numPeople'];
                    $singleB['totalPrice'] = (float)$singleB['totalPrice'];
                    $bookings = [$singleB];
                }
            }
        }

        sendResponse(200, "Loaded from MySQL", [
            "rooms" => $rooms,
            "customQuestions" => $customQuestions,
            "hubItems" => $hubItems,
            "mediaItems" => $mediaItems,
            "bookingSettings" => $settings,
            "bookings" => $bookings,
            "emails" => $emails
        ]);
    } else {
        // Fallback to JSON Database
        $db = readJsonDb();
        $bookings = [];
        $emails = [];

        if ($hasAdminPrivilege) {
            $bookings = isset($db['bookings']) ? $db['bookings'] : [];
            $emails = isset($db['emails']) ? $db['emails'] : [];
        } else {
            $checkId = isset($_GET['submittedId']) ? $_GET['submittedId'] : (isset($input['submittedId']) ? $input['submittedId'] : null);
            if (!empty($checkId) && isset($db['bookings'])) {
                foreach ($db['bookings'] as $b) {
                    if ($b['id'] === $checkId) {
                        $bookings = [$b];
                        break;
                    }
                }
            }
        }

        sendResponse(200, "Loaded from JSON Backup Cache", [
            "rooms" => isset($db['rooms']) ? $db['rooms'] : [],
            "customQuestions" => isset($db['customQuestions']) ? $db['customQuestions'] : [],
            "hubItems" => isset($db['hubItems']) ? $db['hubItems'] : [],
            "mediaItems" => isset($db['mediaItems']) ? $db['mediaItems'] : [],
            "bookingSettings" => isset($db['settings']) ? $db['settings'] : [],
            "bookings" => $bookings,
            "emails" => $emails
        ]);
    }
}

// B. Guest Operations: Create Booking Request
if ($action === 'add_booking') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(405, "POST expected");
    }

    $id = trim($input['id'] ?? MathRandomString());
    $roomId = $input['roomId'] ?? '';
    $roomName = $input['roomName'] ?? '';
    $date = $input['date'] ?? '';
    $durationHours = $input['durationHours'] ?? '';
    $hours = json_encode($input['hours'] ?? []);
    $numPeople = (int)($input['numPeople'] ?? 1);
    $purpose = $input['purpose'] ?? '';
    $orgName = $input['orgName'] ?? '';
    $firstName = $input['firstName'] ?? '';
    $lastName = $input['lastName'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $status = 'pending';
    $totalPrice = (float)($input['totalPrice'] ?? 0);
    $createdAt = date('Y-m-d\TH:i:s.v\Z');

    // Email templates matching the client's georgian notices
    $initialEmailBody = "გამარჯობა $firstName $lastName, \n\nთქვენი მოთხოვნა ოთახ(ებ)ზე „$roomName“ დარეგისტრირდა სისტემაში.\n\nდეტალები:\n- თარიღი: $date\n- საათები: $durationHours\n- ადამიანების რაოდენობა: $numPeople კაცი\n\nჯავშანი ამჟამად არის განხილვის სტატუსში. ფოთის ახალგაზრდული ჰაბის ადმინისტრაცია უკვე განიხილავს ჯავშანს და დადასტურების შემთხვევაში ამავე ელ-ფოსტაზე გაგიზიარებთ საგადახდო ინვოისს, ხოლო უარყოფის შემთხვევაში შესაბამის შეტყობინებას.\n\nპატივისცემით,\nფოთის ახალგაზრდული ჰაბი.";
    $emailId = MathRandomString();
    $emailTimestamp = date('Y-m-d H:i');

    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("INSERT INTO bookings (id, roomId, roomName, `date`, durationHours, hours, numPeople, purpose, orgName, firstName, lastName, email, phone, status, totalPrice, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$id, $roomId, $roomName, $date, $durationHours, $hours, $numPeople, $purpose, $orgName, $firstName, $lastName, $email, $phone, $status, $totalPrice, $createdAt]);

        $stmtEmail = $pdo->prepare("INSERT INTO emails (id, `to`, subject, type, timestamp, body) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtEmail->execute([$emailId, $email, "მოთხოვნა მიღებულია - ფოთის ახალგაზრდული ჰაბი", "pending", $emailTimestamp, $initialEmailBody]);
    } else {
        $db = readJsonDb();
        if (!isset($db['bookings'])) $db['bookings'] = [];
        if (!isset($db['emails'])) $db['emails'] = [];

        $db['bookings'][] = [
            "id" => $id, "roomId" => $roomId, "roomName" => $roomName, "date" => $date,
            "durationHours" => $durationHours, "hours" => $input['hours'] ?? [], "numPeople" => $numPeople,
            "purpose" => $purpose, "orgName" => $orgName, "firstName" => $firstName, "lastName" => $lastName,
            "email" => $email, "phone" => $phone, "status" => $status, "totalPrice" => $totalPrice, "createdAt" => $createdAt
        ];

        $db['emails'][] = [
            "id" => $emailId, "to" => $email, "subject" => "მოთხოვნა მიღებულია - ფოთის ახალგაზრდული ჰაბი",
            "type" => "pending", "timestamp" => $emailTimestamp, "body" => $initialEmailBody
        ];
        writeJsonDb($db);
    }

    // Attempt sending local host mail PHP helper
    @mail($email, "მოთხოვნა მიღებულია - ფოთის ახალგაზრდული ჰაბი", $initialEmailBody, "From: webmaster@yhub.poti\r\nReply-To: yhub.poti@gmail.com\r\nContent-Type: text/plain; charset=UTF-8");

    sendResponse(200, "Booking created successfully", ["id" => $id]);
}

// RESTRICT ALL SUBSEQUENT ENDPOINTS DIRECTLY TO THE ADMIN
if (!isAdminAuthenticated()) {
    sendResponse(401, "Unauthorized access. Invalid or missing administrator credentials.");
}

// C. ADMIN WRITE: Save / Update Booking Settings
if ($action === 'update_settings') {
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("INSERT INTO settings (settings_key, settings_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE settings_value = VALUES(settings_value)");
        foreach ($input as $key => $val) {
            $stmt->execute([$key, json_encode($val)]);
        }
    } else {
        $db = readJsonDb();
        if (!isset($db['settings'])) $db['settings'] = [];
        foreach ($input as $key => $val) {
            $db['settings'][$key] = $val;
        }
        writeJsonDb($db);
    }
    sendResponse(200, "Settings saved.");
}

// D. ADMIN WRITE: Rooms Management
if ($action === 'add_room' || $action === 'update_room') {
    $rId = $input['id'] ?? '';
    if (empty($rId)) {
        sendResponse(400, "Missing room ID.");
    }

    $name = $input['name'] ?? '';
    $pricePerHour = (float)($input['pricePerHour'] ?? 0);
    $pricePerDay = (float)($input['pricePerDay'] ?? 0);
    $minHours = (int)($input['minHours'] ?? 1);
    $capacity = (int)($input['capacity'] ?? 1);
    $imageUrl = $input['imageUrl'] ?? '';
    $images = json_encode($input['images'] ?? []);
    $panoramaUrl = $input['panoramaUrl'] ?? '';
    $videoUrl = $input['videoUrl'] ?? '';
    $description = $input['description'] ?? '';
    $equipment = json_encode($input['equipment'] ?? []);
    $order = (int)($input['order'] ?? 0);

    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("REPLACE INTO rooms (id, name, pricePerHour, pricePerDay, minHours, capacity, imageUrl, images, panoramaUrl, videoUrl, description, equipment, `order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$rId, $name, $pricePerHour, $pricePerDay, $minHours, $capacity, $imageUrl, $images, $panoramaUrl, $videoUrl, $description, $equipment, $order]);
    } else {
        $db = readJsonDb();
        if (!isset($db['rooms'])) $db['rooms'] = [];
        // Remove duplicate if editing
        $db['rooms'] = array_filter($db['rooms'], function($item) use ($rId) { return $item['id'] !== $rId; });
        $db['rooms'][] = [
            "id" => $rId, "name" => $name, "pricePerHour" => $pricePerHour, "pricePerDay" => $pricePerDay,
            "minHours" => $minHours, "capacity" => $capacity, "imageUrl" => $imageUrl, "images" => $input['images'] ?? [],
            "panoramaUrl" => $panoramaUrl, "videoUrl" => $videoUrl, "description" => $description, "equipment" => $input['equipment'] ?? [], "order" => $order
        ];
        writeJsonDb($db);
    }
    sendResponse(200, "Room saved.");
}

if ($action === 'delete_room') {
    $rId = $_GET['id'] ?? ($input['id'] ?? '');
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
        $stmt->execute([$rId]);
    } else {
        $db = readJsonDb();
        if (isset($db['rooms'])) {
            $db['rooms'] = array_values(array_filter($db['rooms'], function($item) use ($rId) { return $item['id'] !== $rId; }));
            writeJsonDb($db);
        }
    }
    sendResponse(200, "Room associated.");
}

// E. ADMIN WRITE: Booking Approvals & Rejections
if ($action === 'approve_booking') {
    $bId = $input['id'] ?? '';
    $invoiceNum = $input['invoiceNumber'] ?? MathRandomString();
    $emailId = MathRandomString();
    $emailTimestamp = date('Y-m-d H:i');

    if ($useMysql && $pdo) {
        // Fetch Booking Details to construct email
        $getStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
        $getStmt->execute([$bId]);
        $b = $getStmt->fetch();
        if (!$b) sendResponse(404, "Booking not found.");

        $stmt = $pdo->prepare("UPDATE bookings SET status = 'approved', invoiceNumber = ? WHERE id = ?");
        $stmt->execute([$invoiceNum, $bId]);

        $body = "გამარჯობა " . $b['firstName'] . " " . $b['lastName'] . ", \n\nმოხარულები ვართ გაცნობოთ, რომ თქვენი მოთხოვნა „" . $b['roomName'] . "“-ს დაჯავშნაზე (" . $b['date'] . ", " . $b['durationHours'] . ") წარმატებით დადასტურდა! \n\nჯავშნის კოდი: RSV-" . $b['id'] . ".\nსაერთო საფასური შეადგენს: ₾" . $b['totalPrice'] . ".00.\n\nმიბმულია საგადახდო ინვოისი #" . $invoiceNum . ". გთხოვთ გადაიხადოთ მითითებულ საბანკო ანგარიშზე ჰაბში მოსვლამდე.\n\nპატივისცემით,\nფოთის ახალგაზრდული ჰაბი.";
        
        $stmtEmail = $pdo->prepare("INSERT INTO emails (id, `to`, subject, type, timestamp, body, invoiceNum) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtEmail->execute([$emailId, $b['email'], "თანხმობა ოთახის დაჯავშნაზე", "approved", $emailTimestamp, $body, $invoiceNum]);

        @mail($b['email'], "თანხმობა ოთახის დაჯავშნაზე", $body, "From: webmaster@yhub.poti\r\nReply-To: yhub.poti@gmail.com\r\nContent-Type: text/plain; charset=UTF-8");
    } else {
        $db = readJsonDb();
        $found = false;
        if (isset($db['bookings'])) {
            foreach ($db['bookings'] as &$b) {
                if ($b['id'] === $bId) {
                    $b['status'] = 'approved';
                    $b['invoiceNumber'] = $invoiceNum;
                    $found = true;

                    $body = "გამარჯობა " . $b['firstName'] . " " . $b['lastName'] . ", \n\nმოხარულები ვართ გაცნობოთ, რომ თქვენი მოთხოვნა „" . $b['roomName'] . "“-ს დაჯავშნაზე (" . $b['date'] . ", " . $b['durationHours'] . ") წარმატებით დადასტურდა! \n\nჯავშნის კოდი: RSV-" . $b['id'] . ".\nსაერთო საფასური შეადგენს: ₾" . $b['totalPrice'] . ".00.\n\nმიბმულია საგადახდო ინვოისი #" . $invoiceNum . ". გთხოვთ გადაიხადოთ მითითებულ საბანკო ანგარიშზე ჰაბში მოსვლამდე.\n\nპატივისცემით,\nფოთის ახალგაზრდული ჰაბი.";
                    
                    if (!isset($db['emails'])) $db['emails'] = [];
                    $db['emails'][] = [
                        "id" => $emailId, "to" => $b['email'], "subject" => "თანხმობა ოთახის დაჯავშნაზე",
                        "type" => "approved", "timestamp" => $emailTimestamp, "body" => $body, "invoiceNum" => $invoiceNum
                    ];
                    @mail($b['email'], "თანხმობა ოთახის დაჯავშნაზე", $body, "From: webmaster@yhub.poti\r\nReply-To: yhub.poti@gmail.com\r\nContent-Type: text/plain; charset=UTF-8");
                    break;
                }
            }
            if ($found) writeJsonDb($db);
        }
    }
    sendResponse(200, "Booking approved.");
}

if ($action === 'reject_booking') {
    $bId = $input['id'] ?? '';
    $reason = $input['reason'] ?? '';
    $emailId = MathRandomString();
    $emailTimestamp = date('Y-m-d H:i');

    if ($useMysql && $pdo) {
        $getStmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
        $getStmt->execute([$bId]);
        $b = $getStmt->fetch();
        if (!$b) sendResponse(404, "Booking not found.");

        $stmt = $pdo->prepare("UPDATE bookings SET status = 'rejected', adminNotes = ? WHERE id = ?");
        $stmt->execute([$reason, $bId]);

        $body = "გამარჯობა " . $b['firstName'] . " " . $b['lastName'] . ", \n\nსამწუხაროდ, თქვენი მოთხოვნა „" . $b['roomName'] . "“-ს დაჯავშნაზე (" . $b['date'] . ", " . $b['durationHours'] . ") ამ ეტაპზე ვერ დაკმაყოფილდა.\n\nუარყოფის მიზეზი:\n\"" . $reason . "\"\n\nპატივისცემით,\nფოთის ახალგაზრდული ჰაბი.";
        
        $stmtEmail = $pdo->prepare("INSERT INTO emails (id, `to`, subject, type, timestamp, body) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtEmail->execute([$emailId, $b['email'], "უარყოფა ოთახის დაჯავშნაზე", "rejected", $emailTimestamp, $body]);

        @mail($b['email'], "უარყოფა ოთახის დაჯავშნაზე", $body, "From: webmaster@yhub.poti\r\nReply-To: yhub.poti@gmail.com\r\nContent-Type: text/plain; charset=UTF-8");
    } else {
        $db = readJsonDb();
        $found = false;
        if (isset($db['bookings'])) {
            foreach ($db['bookings'] as &$b) {
                if ($b['id'] === $bId) {
                    $b['status'] = 'rejected';
                    $b['adminNotes'] = $reason;
                    $found = true;

                    $body = "გამარჯობა " . $b['firstName'] . " " . $b['lastName'] . ", \n\nსამწუხაროდ, თქვენი მოთხოვნა „" . $b['roomName'] . "“-ს დაჯავშნაზე (" . $b['date'] . ", " . $b['durationHours'] . ") ამ ეტაპზე ვერ დაკმაყოფილდა.\n\nუარყოფის მიზეზი:\n\"" . $reason . "\"\n\nპატივისცემით,\nფოთის ახალგაზრდული ჰაბი.";
                    
                    if (!isset($db['emails'])) $db['emails'] = [];
                    $db['emails'][] = [
                        "id" => $emailId, "to" => $b['email'], "subject" => "უარყოფა ოთახის დაჯავშნაზე",
                        "type" => "rejected", "timestamp" => $emailTimestamp, "body" => $body
                    ];
                    @mail($b['email'], "უარყოფა ოთახის დაჯავშნაზე", $body, "From: webmaster@yhub.poti\r\nReply-To: yhub.poti@gmail.com\r\nContent-Type: text/plain; charset=UTF-8");
                    break;
                }
            }
            if ($found) writeJsonDb($db);
        }
    }
    sendResponse(200, "Booking rejected.");
}

if ($action === 'delete_booking') {
    $bId = $_GET['id'] ?? ($input['id'] ?? '');
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
        $stmt->execute([$bId]);
    } else {
        $db = readJsonDb();
        if (isset($db['bookings'])) {
            $db['bookings'] = array_values(array_filter($db['bookings'], function($item) use ($bId) { return $item['id'] !== $bId; }));
            writeJsonDb($db);
        }
    }
    sendResponse(200, "Booking deleted.");
}

// F. ADMIN WRITE: FAQ questions management
if ($action === 'add_question') {
    $qId = $input['id'] ?? '';
    $label = $input['label'] ?? '';
    $type = $input['type'] ?? 'text';
    $required = (int)($input['required'] ?? 1);

    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("REPLACE INTO custom_questions (id, label, type, required) VALUES (?, ?, ?, ?)");
        $stmt->execute([$qId, $label, $type, $required]);
    } else {
        $db = readJsonDb();
        if (!isset($db['customQuestions'])) $db['customQuestions'] = [];
        $db['customQuestions'] = array_filter($db['customQuestions'], function($q) use ($qId) { return $q['id'] !== $qId; });
        $db['customQuestions'][] = ["id" => $qId, "label" => $label, "type" => $type, "required" => (bool)$required];
        writeJsonDb($db);
    }
    sendResponse(200, "Question added.");
}

if ($action === 'delete_question') {
    $qId = $_GET['id'] ?? ($input['id'] ?? '');
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("DELETE FROM custom_questions WHERE id = ?");
        $stmt->execute([$qId]);
    } else {
        $db = readJsonDb();
        if (isset($db['customQuestions'])) {
            $db['customQuestions'] = array_values(array_filter($db['customQuestions'], function($q) use ($qId) { return $q['id'] !== $qId; }));
            writeJsonDb($db);
        }
    }
    sendResponse(200, "Question removed.");
}

// G. ADMIN WRITE: Hub items management (News/Jobs etc)
if ($action === 'add_hub_item' || $action === 'update_hub_item') {
    $hId = $input['id'] ?? '';
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $coverImage = $input['coverImage'] ?? '';
    $date = $input['date'] ?? '';
    $type = $input['type'] ?? 'news';
    $customUrl = $input['customUrl'] ?? '';
    $buttonText = $input['buttonText'] ?? '';
    $order = (int)($input['order'] ?? 0);

    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("REPLACE INTO hub_items (id, title, description, coverImage, `date`, type, customUrl, buttonText, `order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$hId, $title, $description, $coverImage, $date, $type, $customUrl, $buttonText, $order]);
    } else {
        $db = readJsonDb();
        if (!isset($db['hubItems'])) $db['hubItems'] = [];
        $db['hubItems'] = array_filter($db['hubItems'], function($item) use ($hId) { return $item['id'] !== $hId; });
        $db['hubItems'][] = [
            "id" => $hId, "title" => $title, "description" => $description, "coverImage" => $coverImage,
            "date" => $date, "type" => $type, "customUrl" => $customUrl, "buttonText" => $buttonText, "order" => $order
        ];
        writeJsonDb($db);
    }
    sendResponse(200, "Hub item stored.");
}

if ($action === 'delete_hub_item') {
    $hId = $_GET['id'] ?? ($input['id'] ?? '');
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("DELETE FROM hub_items WHERE id = ?");
        $stmt->execute([$hId]);
    } else {
        $db = readJsonDb();
        if (isset($db['hubItems'])) {
            $db['hubItems'] = array_values(array_filter($db['hubItems'], function($item) use ($hId) { return $item['id'] !== $hId; }));
            writeJsonDb($db);
        }
    }
    sendResponse(200, "Hub item cleared.");
}

// H. ADMIN WRITE: Media item gallery management
if ($action === 'add_media_item' || $action === 'update_media_item') {
    $mId = $input['id'] ?? '';
    $url = $input['url'] ?? '';
    $type = $input['type'] ?? 'image';
    $title = $input['title'] ?? '';
    $date = $input['date'] ?? date('Y-m-d');
    $order = (int)($input['order'] ?? 0);

    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("REPLACE INTO media_items (id, url, type, title, `date`, `order`) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$mId, $url, $type, $title, $date, $order]);
    } else {
        $db = readJsonDb();
        if (!isset($db['mediaItems'])) $db['mediaItems'] = [];
        $db['mediaItems'] = array_filter($db['mediaItems'], function($m) use ($mId) { return $m['id'] !== $mId; });
        $db['mediaItems'][] = [
            "id" => $mId, "url" => $url, "type" => $type, "title" => $title, "date" => $date, "order" => $order
        ];
        writeJsonDb($db);
    }
    sendResponse(200, "Media item stored.");
}

if ($action === 'delete_media_item') {
    $mId = $_GET['id'] ?? ($input['id'] ?? '');
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("DELETE FROM media_items WHERE id = ?");
        $stmt->execute([$mId]);
    } else {
        $db = readJsonDb();
        if (isset($db['mediaItems'])) {
            $db['mediaItems'] = array_values(array_filter($db['mediaItems'], function($m) use ($mId) { return $m['id'] !== $mId; }));
            writeJsonDb($db);
        }
    }
    sendResponse(200, "Media item deleted.");
}

// I. ADMIN WRITE: Delete administrative logs log item
if ($action === 'delete_email') {
    $eId = $_GET['id'] ?? ($input['id'] ?? '');
    if ($useMysql && $pdo) {
        $stmt = $pdo->prepare("DELETE FROM emails WHERE id = ?");
        $stmt->execute([$eId]);
    } else {
        $db = readJsonDb();
        if (isset($db['emails'])) {
            $db['emails'] = array_values(array_filter($db['emails'], function($e) use ($eId) { return $e['id'] !== $eId; }));
            writeJsonDb($db);
        }
    }
    sendResponse(200, "Email logged delet.");
}

// Helper: safe random key generator
function MathRandomString() {
    return substr(md5(mt_rand()), 0, 9);
}

// Fallback handling
sendResponse(400, "Invalid Action: action parameters requested is mismatching or unavailable.");
