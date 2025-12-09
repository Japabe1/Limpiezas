<?php
/**
 * API de Autenticación
 * Endpoints: login, logout, check
 */

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/utils.php';

// Obtener acción
$action = $_GET['action'] ?? '';

try {
    $db = Database::getInstance();
    
    switch ($action) {
        case 'login':
            handleLogin($db);
            break;
            
        case 'logout':
            handleLogout();
            break;
            
        case 'check':
            handleCheck();
            break;
            
        case 'change-password':
            handleChangePassword($db);
            break;
            
        default:
            sendError('Acción no válida', 400);
    }
} catch (Exception $e) {
    error_log("Auth API Error: " . $e->getMessage());
    sendError('Error en el servidor', 500);
}

/**
 * Manejar login
 */
function handleLogin($db) {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Método no permitido', 405);
    }
    
    $data = getPostData();
    requireParams($data, ['username', 'password']);
    
    $username = sanitizeInput($data['username']);
    $password = $data['password'];
    
    // Buscar usuario
    $sql = "SELECT id, username, password_hash, email, full_name, is_active 
            FROM users 
            WHERE username = :username";
    
    $user = $db->fetchOne($sql, [':username' => $username]);
    
    if (!$user) {
        // Delay para prevenir timing attacks
        usleep(500000); // 0.5 segundos
        sendError('Credenciales incorrectas', 401);
    }
    
    // Verificar si está activo
    if (!$user['is_active']) {
        sendError('Usuario desactivado', 403);
    }
    
    // Verificar contraseña
    if (!verifyPassword($password, $user['password_hash'])) {
        usleep(500000);
        sendError('Credenciales incorrectas', 401);
    }
    
    // Crear sesión
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['full_name'] = $user['full_name'];
    $_SESSION['login_time'] = time();
    
    // Actualizar último login
    $updateSql = "UPDATE users SET last_login = NOW() WHERE id = :id";
    $db->query($updateSql, [':id' => $user['id']]);
    
    // Registrar en audit log
    logAudit('LOGIN', 'users', $user['id']);
    
    // Respuesta
    sendResponse(true, [
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name']
        ],
        'csrf_token' => generateCSRFToken()
    ], 'Login exitoso');
}

/**
 * Manejar logout
 */
function handleLogout() {
    if (isAuthenticated()) {
        logAudit('LOGOUT', 'users', getCurrentUserId());
    }
    
    // Destruir sesión
    $_SESSION = [];
    
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    session_destroy();
    
    sendResponse(true, null, 'Logout exitoso');
}

/**
 * Verificar estado de autenticación
 */
function handleCheck() {
    if (isAuthenticated()) {
        // Verificar timeout de sesión
        if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > SESSION_LIFETIME) {
            handleLogout();
        }
        
        sendResponse(true, [
            'authenticated' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'email' => $_SESSION['email'] ?? null,
                'full_name' => $_SESSION['full_name'] ?? null
            ],
            'session_expires_in' => SESSION_LIFETIME - (time() - $_SESSION['login_time'])
        ]);
    } else {
        sendResponse(false, ['authenticated' => false], 'No autenticado');
    }
}

/**
 * Cambiar contraseña
 */
function handleChangePassword($db) {
    requireAuth();
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Método no permitido', 405);
    }
    
    $data = getPostData();
    requireParams($data, ['current_password', 'new_password']);
    
    $userId = getCurrentUserId();
    $currentPassword = $data['current_password'];
    $newPassword = $data['new_password'];
    
    // Validar longitud de nueva contraseña
    if (strlen($newPassword) < 6) {
        sendError('La nueva contraseña debe tener al menos 6 caracteres', 400);
    }
    
    // Obtener contraseña actual
    $sql = "SELECT password_hash FROM users WHERE id = :id";
    $user = $db->fetchOne($sql, [':id' => $userId]);
    
    if (!$user || !verifyPassword($currentPassword, $user['password_hash'])) {
        sendError('Contraseña actual incorrecta', 401);
    }
    
    // Actualizar contraseña
    $newHash = hashPassword($newPassword);
    $updateSql = "UPDATE users SET password_hash = :hash WHERE id = :id";
    $db->query($updateSql, [':hash' => $newHash, ':id' => $userId]);
    
    logAudit('UPDATE', 'users', $userId, null, ['password_changed' => true]);
    
    sendResponse(true, null, 'Contraseña actualizada correctamente');
}
