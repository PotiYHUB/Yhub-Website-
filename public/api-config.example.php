<?php
/**
 * Poti Youth Hub - API Configuration File Template
 * Copy this file to "api-config.php" in your deployment and fill in your details.
 */

// 1. MySQL Database Configuration (For cPanel)
define('DB_HOST', 'localhost');
define('DB_USER', 'your_cpanel_db_username');
define('DB_PASS', 'your_cpanel_db_password');
define('DB_NAME', 'your_cpanel_db_name');

// 2. Firebase App Authentication Configuration
// Find this in your firebase-applet-config.json file (projectId)
define('FIREBASE_PROJECT_ID', 'ai-studio-a6ef0497-3dcc-4f9b-8607-33e7243aefaa');

// 3. Fallback Admin Access Token
// If Google Firebase Auth servers cannot be verified from your server, 
// copy this token and configure it in the browser or code for zero-friction admin bypass.
define('ADMIN_SECRET', 'yhub_poti_secure_cpanel_token_2026');

// 4. Local Backup Storage File (If MySQL is not configured, we write/read from this file)
define('JSON_DB_FILE', __DIR__ . '/db_cache.json');
