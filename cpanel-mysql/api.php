<?php
/**
 * Poti Youth Hub - PHP MySQL REST Bridge for cPanel Deployment
 * 
 * Instructions:
 * 1. Upload this file to your cPanel hosting directory (e.g., inside public_html)
 *    alongside your built static index.html from your "dist" folder.
 * 2. In cPanel, go to "MySQL Databases" or "MySQL Database Wizard" and create a database,
 *    database user, and active password. Assign the user full privileges for the database.
 * 3. Open this file on your cPanel file manager / edit it, and fill in the DB_* constants below.
 * 4. Create an ADMIN_SECRET token below, then set VITE_ADMIN_SECRET and VITE_DATABASE_MODE=mysql
 *    in your React app environment config, and enjoy infinite quota-free database operations!
 */

// Allow CORS in development mode
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, X-Admin-Secret, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// -------------------------------------------------------------------------
// DATABASE AND SECURITY CONFIGURATION
// -------------------------------------------------------------------------
define('DB_HOST', '');        // e.g. 'localhost' or your cPanel MySQL host
define('DB_NAME', '');        // e.g. 'your_cpanel_db_name'
define('DB_USER', '');        // e.g. 'your_cpanel_db_user'
define('DB_PASS', '');        // e.g. 'your_cpanel_db_password'

// Optional: Define a secret password to lock all edit/create/delete actions.
// If set to anything other than '', write operations will require the 'X-Admin-Secret' head token.
define('ADMIN_SECRET', '');   // e.g., 'poti-youth-hub-secret-2026'

// SQLite fallback configuration:
// If MySQL configuration is incomplete, SQLite is auto-used as local file 'db.sqlite'
define('SQLITE_FALLBACK_FILE', __DIR__ . '/db.sqlite');

try {
    $useSqlite = empty(DB_HOST) || empty(DB_NAME) || empty(DB_USER);
    
    if ($useSqlite) {
        // Fallback SQLite Database
        $pdo = new PDO("sqlite:" . SQLITE_FALLBACK_FILE);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } else {
        // Primary cPanel MySQL database
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
} catch (PDOException $e) {
    sendResponse(false, null, "Database Connection Failed: " . $e->getMessage(), 500);
}

// -------------------------------------------------------------------------
// AUTO-SCHEMA BOOTSTRAP / MIGRATIONS
// -------------------------------------------------------------------------
// Runs automatic table schemas on first boot so the user doesn't have to design database tables manually.
bootstrapSchema($pdo, $useSqlite);

// -------------------------------------------------------------------------
// REQUEST AND ROUTING DISPATCH
// -------------------------------------------------------------------------
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Read raw JSON request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

// Verify admin permissions for writing actions
$writeActions = ["save_room", "delete_room", "save_question", "delete_question", "save_hub_item", "delete_hub_item", "save_settings", "save_media_item", "delete_media_item", "delete_booking", "delete_email", "save_email"];
if (in_array($action, $writeActions) && ADMIN_SECRET !== '') {
    $headerSecret = isset($_SERVER['HTTP_X_ADMIN_SECRET']) ? $_SERVER['HTTP_X_ADMIN_SECRET'] : '';
    if ($headerSecret !== ADMIN_SECRET) {
        sendResponse(false, null, "Authentication failure: Missing or invalid Admin Secret Header.", 403);
    }
}

switch ($action) {
    // ROOMS
    case 'get_rooms':
        try {
            $stmt = $pdo->query("SELECT * FROM rooms ORDER BY `order` ASC, id ASC");
            $rooms = $stmt->fetchAll();
            // Decode serialized fields
            foreach ($rooms as &$room) {
                $room['features'] = json_decode($room['features'], true) ?: [];
                $room['imageUrls'] = json_decode($room['imageUrls'], true) ?: [];
                $room['capacity'] = (int)$room['capacity'];
                $room['price'] = (float)$room['price'];
                $room['dayPrice'] = (float)$room['dayPrice'];
                $room['order'] = isset($room['order']) ? (int)$room['order'] : null;
            }
            sendResponse(true, $rooms);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_room':
        try {
            if (!$data || !isset($data['id'])) {
                sendResponse(false, null, "Invalid room data.", 400);
            }
            $stmt = $pdo->prepare("REPLACE INTO rooms (id, name, description, capacity, price, dayPrice, imageUrl, imageUrls, features, panoramaUrl, videoUrl, `order`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['name'],
                $data['description'],
                $data['capacity'],
                $data['price'],
                $data['dayPrice'],
                $data['imageUrl'],
                json_encode(isset($data['imageUrls']) ? $data['imageUrls'] : []),
                json_encode(isset($data['features']) ? $data['features'] : []),
                isset($data['panoramaUrl']) ? $data['panoramaUrl'] : null,
                isset($data['videoUrl']) ? $data['videoUrl'] : null,
                isset($data['order']) ? $data['order'] : null
            ]);
            sendResponse(true, "Room saved.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'delete_room':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) sendResponse(false, null, "Missing room ID.", 400);
            $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, "Room deleted.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    // CUSTOM QUESTIONS
    case 'get_questions':
        try {
            $stmt = $pdo->query("SELECT * FROM custom_questions ORDER BY id ASC");
            $qs = $stmt->fetchAll();
            foreach ($qs as &$q) {
                $q['options'] = json_decode($q['options'], true) ?: [];
                $q['required'] = (bool)$q['required'];
            }
            sendResponse(true, $qs);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_question':
        try {
            if (!$data || !isset($data['id'])) sendResponse(false, null, "Invalid question data.", 400);
            $stmt = $pdo->prepare("REPLACE INTO custom_questions (id, label, placeholder, required, type, options) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['label'],
                $data['placeholder'],
                $data['required'] ? 1 : 0,
                $data['type'],
                json_encode(isset($data['options']) ? $data['options'] : [])
            ]);
            sendResponse(true, "Question saved.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'delete_question':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) sendResponse(false, null, "Missing question ID.", 400);
            $stmt = $pdo->prepare("DELETE FROM custom_questions WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, "Question deleted.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    // HUB ITEMS
    case 'get_hub_items':
        try {
            $stmt = $pdo->query("SELECT * FROM hub_items ORDER BY `order` ASC, `date` DESC");
            $items = $stmt->fetchAll();
            foreach ($items as &$item) {
                $item['requirements'] = json_decode($item['requirements'], true) ?: [];
                $item['additionalImages'] = json_decode($item['additionalImages'], true) ?: [];
                $item['order'] = isset($item['order']) ? (int)$item['order'] : 0;
            }
            sendResponse(true, $items);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_hub_item':
        try {
            if (!$data || !isset($data['id'])) sendResponse(false, null, "Invalid HubItem data.", 400);
            $stmt = $pdo->prepare("REPLACE INTO hub_items (id, category, title, summary, content, `date`, coverImage, deadline, location, salaryRange, requirements, `order`, additionalImages, trainingButtonText, trainingButtonLink, customUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['category'],
                $data['title'],
                $data['summary'],
                $data['content'],
                $data['date'],
                $data['coverImage'],
                isset($data['deadline']) ? $data['deadline'] : null,
                isset($data['location']) ? $data['location'] : null,
                isset($data['salaryRange']) ? $data['salaryRange'] : null,
                json_encode(isset($data['requirements']) ? $data['requirements'] : []),
                isset($data['order']) ? (int)$data['order'] : 0,
                json_encode(isset($data['additionalImages']) ? $data['additionalImages'] : []),
                isset($data['trainingButtonText']) ? $data['trainingButtonText'] : null,
                isset($data['trainingButtonLink']) ? $data['trainingButtonLink'] : null,
                isset($data['customUrl']) ? $data['customUrl'] : null,
            ]);
            sendResponse(true, "HubItem saved.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'delete_hub_item':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) sendResponse(false, null, "Missing HubItem ID.", 400);
            $stmt = $pdo->prepare("DELETE FROM hub_items WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, "HubItem deleted.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    // BOOKING SETTINGS
    case 'get_settings':
        try {
            $stmt = $pdo->query("SELECT * FROM settings WHERE id = 'bookingSettings'");
            $set = $stmt->fetch();
            if ($set) {
                sendResponse(true, json_decode($set['settings_data'], true));
            } else {
                // Return default empty settings
                sendResponse(true, new stdClass());
            }
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_settings':
        try {
            if (!$data) sendResponse(false, null, "Invalid settings payload.", 400);
            $stmt = $pdo->prepare("REPLACE INTO settings (id, settings_data) VALUES ('bookingSettings', ?)");
            $stmt->execute([json_encode($data)]);
            sendResponse(true, "Settings updated successfully.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    // MEDIA ITEMS (GALLERY)
    case 'get_media_items':
        try {
            $stmt = $pdo->query("SELECT * FROM media_items ORDER BY `order` ASC, `date` DESC");
            $list = $stmt->fetchAll();
            foreach ($list as &$item) {
                $item['order'] = isset($item['order']) ? (int)$item['order'] : 0;
            }
            sendResponse(true, $list);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_media_item':
        try {
            if (!$data || !isset($data['id'])) sendResponse(false, null, "Invalid MediaItem data.", 400);
            $stmt = $pdo->prepare("REPLACE INTO media_items (id, type, url, caption, `date`, `order`) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['type'],
                $data['url'],
                $data['caption'],
                $data['date'],
                isset($data['order']) ? (int)$data['order'] : 0
            ]);
            sendResponse(true, "MediaItem saved.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'delete_media_item':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) sendResponse(false, null, "Missing MediaItem ID.", 400);
            $stmt = $pdo->prepare("DELETE FROM media_items WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, "MediaItem deleted.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    // BOOKINGS
    case 'get_bookings':
        try {
            $stmt = $pdo->query("SELECT * FROM bookings ORDER BY createdAt DESC");
            $bookings = $stmt->fetchAll();
            foreach ($bookings as &$b) {
                $b['numPeople'] = (int)$b['numPeople'];
                $b['totalPrice'] = (float)$b['totalPrice'];
                $b['answers'] = json_decode($b['answers'], true) ?: [];
            }
            sendResponse(true, $bookings);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_booking':
        try {
            if (!$data || !isset($data['id'])) sendResponse(false, null, "Invalid booking data.", 400);
            $stmt = $pdo->prepare("REPLACE INTO bookings (id, roomId, roomName, `date`, durationHours, numPeople, totalPrice, firstName, lastName, organization, email, phone, answers, status, invoiceNumber, adminNotes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                $data['roomId'],
                $data['roomName'],
                $data['date'],
                $data['durationHours'],
                $data['numPeople'],
                $data['totalPrice'],
                $data['firstName'],
                $data['lastName'],
                isset($data['organization']) ? $data['organization'] : null,
                $data['email'],
                $data['phone'],
                json_encode(isset($data['answers']) ? $data['answers'] : []),
                $data['status'],
                isset($data['invoiceNumber']) ? $data['invoiceNumber'] : null,
                isset($data['adminNotes']) ? $data['adminNotes'] : null,
                $data['createdAt']
            ]);
            sendResponse(true, "Booking saved.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'delete_booking':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) sendResponse(false, null, "Missing booking ID.", 400);
            $stmt = $pdo->prepare("DELETE FROM bookings WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, "Booking deleted.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    // EMAILS
    case 'get_emails':
        try {
            $stmt = $pdo->query("SELECT * FROM emails ORDER BY dateSent DESC");
            $emails = $stmt->fetchAll();
            foreach ($emails as &$email) {
                if (isset($email['isRead'])) {
                    $email['isRead'] = (bool)$email['isRead'];
                }
            }
            sendResponse(true, $emails);
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'save_email':
        try {
            if (!$data || !isset($data['id'])) sendResponse(false, null, "Invalid email payload.", 400);
            $stmt = $pdo->prepare("REPLACE INTO emails (id, bookingId, recipientEmail, subject, body, status, dateSent, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'],
                isset($data['bookingId']) ? $data['bookingId'] : null,
                $data['recipientEmail'],
                $data['subject'],
                $data['body'],
                $data['status'],
                $data['dateSent'],
                isset($data['type']) ? $data['type'] : null
            ]);
            sendResponse(true, "Email logged.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    case 'delete_email':
        try {
            $id = isset($_GET['id']) ? $_GET['id'] : '';
            if (empty($id)) sendResponse(false, null, "Missing email ID.", 400);
            $stmt = $pdo->prepare("DELETE FROM emails WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(true, "Email log deleted.");
        } catch (Exception $e) {
            sendResponse(false, null, $e->getMessage(), 500);
        }
        break;

    default:
        sendResponse(false, null, "Action Not Found: " . htmlspecialchars($action), 404);
}

// -------------------------------------------------------------------------
// REUSABLE SHELL FUNCTIONS
// -------------------------------------------------------------------------
function sendResponse($success, $data = null, $error = null, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'error' => $error
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function bootstrapSchema($pdo, $useSqlite) {
    $engine = $useSqlite ? "" : "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $textType = $useSqlite ? "TEXT" : "MEDIUMTEXT";
    
    $queries = [
        "CREATE TABLE IF NOT EXISTS rooms (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description $textType,
            capacity INT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            dayPrice DECIMAL(10,2) NOT NULL,
            imageUrl VARCHAR(500),
            imageUrls $textType,
            features $textType,
            panoramaUrl VARCHAR(500),
            videoUrl VARCHAR(500),
            `order` INT DEFAULT NULL
        ) $engine",

        "CREATE TABLE IF NOT EXISTS custom_questions (
            id VARCHAR(100) PRIMARY KEY,
            label VARCHAR(255) NOT NULL,
            placeholder VARCHAR(255),
            required INT NOT NULL DEFAULT 0,
            type VARCHAR(50) NOT NULL,
            options $textType
        ) $engine",

        "CREATE TABLE IF NOT EXISTS hub_items (
            id VARCHAR(100) PRIMARY KEY,
            category VARCHAR(100) NOT NULL,
            title VARCHAR(255) NOT NULL,
            summary $textType,
            content $textType,
            `date` VARCHAR(100) NOT NULL,
            coverImage VARCHAR(500),
            deadline VARCHAR(100),
            location VARCHAR(255),
            salaryRange VARCHAR(255),
            requirements $textType,
            `order` INT NOT NULL DEFAULT 0,
            additionalImages $textType,
            trainingButtonText VARCHAR(255),
            trainingButtonLink VARCHAR(500),
            customUrl VARCHAR(500)
        ) $engine",

        "CREATE TABLE IF NOT EXISTS settings (
            id VARCHAR(100) PRIMARY KEY,
            settings_data $textType NOT NULL
        ) $engine",

        "CREATE TABLE IF NOT EXISTS media_items (
            id VARCHAR(100) PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            url VARCHAR(500) NOT NULL,
            caption VARCHAR(255),
            `date` VARCHAR(100) NOT NULL,
            `order` INT DEFAULT 0
        ) $engine",

        "CREATE TABLE IF NOT EXISTS bookings (
            id VARCHAR(100) PRIMARY KEY,
            roomId VARCHAR(100) NOT NULL,
            roomName VARCHAR(255) NOT NULL,
            `date` VARCHAR(100) NOT NULL,
            durationHours VARCHAR(100) NOT NULL,
            numPeople INT NOT NULL,
            totalPrice DECIMAL(10,2) NOT NULL,
            firstName VARCHAR(100) NOT NULL,
            lastName VARCHAR(100) NOT NULL,
            organization VARCHAR(255),
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(100) NOT NULL,
            answers $textType,
            status VARCHAR(50) NOT NULL,
            invoiceNumber VARCHAR(100),
            adminNotes $textType,
            createdAt VARCHAR(100) NOT NULL
        ) $engine",

        "CREATE TABLE IF NOT EXISTS emails (
            id VARCHAR(100) PRIMARY KEY,
            bookingId VARCHAR(100),
            recipientEmail VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            body $textType NOT NULL,
            status VARCHAR(50) NOT NULL,
            dateSent VARCHAR(100) NOT NULL,
            type VARCHAR(100)
        ) $engine"
    ];

    foreach ($queries as $q) {
        $pdo->exec($q);
    }
}
