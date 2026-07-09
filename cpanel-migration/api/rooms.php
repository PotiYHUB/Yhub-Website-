<?php
/**
 * Rooms API Endpoint
 * Handles GET (fetch rooms), POST (create/update rooms), and DELETE (remove rooms)
 */

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            // Fetch all rooms ordered by their display sequence
            $stmt = $pdo->query("SELECT * FROM rooms ORDER BY `order` ASC");
            $rooms = $stmt->fetchAll();
            
            // Format array-like string representations (e.g. JSON images array)
            foreach ($rooms as &$room) {
                $room['capacity'] = (int)$room['capacity'];
                $room['hourlyPrice'] = (float)$room['hourlyPrice'];
                $room['dailyPrice'] = (float)$room['dailyPrice'];
                $room['minHours'] = (int)$room['minHours'];
                $room['isAvailable'] = (bool)$room['isAvailable'];
                $room['order'] = (int)$room['order'];
                $room['images'] = json_decode($room['images'] ?: '[]', true);
            }
            
            sendResponse($rooms);
        } catch (\PDOException $e) {
            sendResponse(["error" => "Failed to fetch rooms: " . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Safe check for administrator (In production, verify JWT auth headers)
        $input = getJsonInput();
        if (empty($input)) {
            sendResponse(["error" => "No data provided"], 400);
        }

        $id = $input['id'] ?? uniqid('room_');
        $name = $input['name'] ?? '';
        $capacity = $input['capacity'] ?? 0;
        $hourlyPrice = $input['hourlyPrice'] ?? 0.00;
        $dailyPrice = $input['dailyPrice'] ?? 0.00;
        $minHours = $input['minHours'] ?? 1;
        $images = json_encode($input['images'] ?? []);
        $description = $input['description'] ?? '';
        $isAvailable = isset($input['isAvailable']) ? ($input['isAvailable'] ? 1 : 0) : 1;
        $order = $input['order'] ?? 0;

        try {
            // Insert or replace on duplicate key
            $sql = "INSERT INTO rooms (id, name, capacity, hourlyPrice, dailyPrice, minHours, images, description, isAvailable, `order`) 
                    VALUES (:id, :name, :capacity, :hourlyPrice, :dailyPrice, :minHours, :images, :description, :isAvailable, :seq)
                    ON DUPLICATE KEY UPDATE 
                        name = VALUES(name), 
                        capacity = VALUES(capacity), 
                        hourlyPrice = VALUES(hourlyPrice), 
                        dailyPrice = VALUES(dailyPrice), 
                        minHours = VALUES(minHours), 
                        images = VALUES(images), 
                        description = VALUES(description), 
                        isAvailable = VALUES(isAvailable), 
                        `order` = VALUES(`order`)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $id,
                ':name' => $name,
                ':capacity' => $capacity,
                ':hourlyPrice' => $hourlyPrice,
                ':dailyPrice' => $dailyPrice,
                ':minHours' => $minHours,
                ':images' => $images,
                ':description' => $description,
                ':isAvailable' => $isAvailable,
                ':seq' => $order
            ]);

            sendResponse(["status" => "success", "message" => "Room saved successfully", "id" => $id]);
        } catch (\PDOException $e) {
            sendResponse(["error" => "Failed to save room: " . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $roomId = $_GET['id'] ?? null;
        if (!$roomId) {
            sendResponse(["error" => "Room ID is required"], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM rooms WHERE id = :id");
            $stmt->execute([':id' => $roomId]);
            sendResponse(["status" => "success", "message" => "Room deleted successfully"]);
        } catch (\PDOException $e) {
            sendResponse(["error" => "Failed to delete room: " . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(["error" => "Method not allowed"], 405);
        break;
}
