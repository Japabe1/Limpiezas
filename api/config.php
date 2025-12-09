<?php
/**
 * Configuración de la Base de Datos
 * Sistema de Reservas - Higiene Bucodental
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'higiene_reservas');
define('DB_USER', 'root');
define('DB_PASS', ''); // Por defecto XAMPP no tiene contraseña

// Configuración de la aplicación
define('APP_NAME', 'Sistema de Reservas - Higiene Bucodental');
define('APP_VERSION', '2.0.0');
define('TIMEZONE', 'Europe/Madrid');

// Configuración de sesiones
define('SESSION_LIFETIME', 3600); // 1 hora en segundos
define('SESSION_NAME', 'HIGIENE_SESSION');

// Configuración de seguridad
define('HASH_ALGO', PASSWORD_DEFAULT);
define('HASH_COST', 10);

// Dominios de email permitidos
define('ALLOWED_EMAIL_DOMAINS', ['alu.medac.es', 'medac.es']);

// Configuración de horarios
define('START_HOUR', 15);
define('START_MINUTE', 15);
define('END_HOUR', 20);
define('END_MINUTE', 30);
define('SLOT_DURATION', 40); // minutos

// Sillones disponibles
define('CHAIRS', ['rojo', 'azul', 'amarillo']);

// Configuración de zona horaria
date_default_timezone_set(TIMEZONE);

// Configuración de errores (cambiar en producción)
if ($_SERVER['SERVER_NAME'] === 'localhost') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php-errors.log');
}

// Headers CORS para desarrollo local
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Iniciar sesión
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
}
