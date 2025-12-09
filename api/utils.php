<?php
/**
 * Funciones Auxiliares
 * Utilidades para validación, respuestas JSON y seguridad
 */

/**
 * Enviar respuesta JSON
 */
function sendResponse($success, $data = null, $message = '', $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Enviar error JSON
 */
function sendError($message, $code = 400, $data = null) {
    sendResponse(false, $data, $message, $code);
}

/**
 * Validar email con dominios permitidos
 */
function validateEmail($email) {
    // Validar formato
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    
    // Extraer dominio
    $parts = explode('@', $email);
    if (count($parts) !== 2) {
        return false;
    }
    
    $domain = strtolower($parts[1]);
    
    // Verificar dominio permitido
    return in_array($domain, ALLOWED_EMAIL_DOMAINS);
}

/**
 * Sanitizar input
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validar fecha (formato YYYY-MM-DD)
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

/**
 * Verificar que la fecha es un viernes
 */
function isFriday($date) {
    $d = new DateTime($date);
    return $d->format('N') == 5; // 5 = Viernes
}

/**
 * Validar slot index
 */
function validateSlotIndex($index) {
    return is_numeric($index) && $index >= 0 && $index < 8; // 8 slots de 40 min
}

/**
 * Validar sillón
 */
function validateChair($chair) {
    return in_array($chair, CHAIRS);
}

/**
 * Generar hash de contraseña
 */
function hashPassword($password) {
    return password_hash($password, HASH_ALGO, ['cost' => HASH_COST]);
}

/**
 * Verificar contraseña
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
    return isset($_SESSION['user_id']) && isset($_SESSION['username']);
}

/**
 * Requerir autenticación
 */
function requireAuth() {
    if (!isAuthenticated()) {
        sendError('No autorizado. Inicia sesión primero.', 401);
    }
}

/**
 * Obtener ID del usuario actual
 */
function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

/**
 * Registrar en audit log
 */
function logAudit($action, $table, $recordId = null, $oldValues = null, $newValues = null) {
    try {
        $db = Database::getInstance();
        
        $sql = "INSERT INTO audit_log (action_type, table_name, record_id, user_id, old_values, new_values, ip_address, user_agent) 
                VALUES (:action, :table, :record_id, :user_id, :old_values, :new_values, :ip, :user_agent)";
        
        $params = [
            ':action' => $action,
            ':table' => $table,
            ':record_id' => $recordId,
            ':user_id' => getCurrentUserId(),
            ':old_values' => $oldValues ? json_encode($oldValues) : null,
            ':new_values' => $newValues ? json_encode($newValues) : null,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            ':user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ];
        
        $db->query($sql, $params);
    } catch (Exception $e) {
        error_log("Audit Log Error: " . $e->getMessage());
    }
}

/**
 * Validar y obtener parámetros POST
 */
function getPostData() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendError('JSON inválido', 400);
    }
    return $data;
}

/**
 * Validar parámetros requeridos
 */
function requireParams($data, $required) {
    $missing = [];
    foreach ($required as $param) {
        if (!isset($data[$param]) || trim($data[$param]) === '') {
            $missing[] = $param;
        }
    }
    
    if (!empty($missing)) {
        sendError('Parámetros faltantes: ' . implode(', ', $missing), 400);
    }
}

/**
 * Formatear fecha para mostrar
 */
function formatDate($date) {
    $d = new DateTime($date);
    $formatter = new IntlDateFormatter(
        'es_ES',
        IntlDateFormatter::FULL,
        IntlDateFormatter::NONE,
        'Europe/Madrid',
        IntlDateFormatter::GREGORIAN
    );
    return $formatter->format($d);
}

/**
 * Generar token CSRF
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verificar token CSRF
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
