<?php
/**
 * Script de instalación automática de la base de datos
 * Ejecuta este archivo una sola vez para configurar todo
 */

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>";
echo "<html><head><title>Instalación - Sistema de Reservas</title>";
echo "<style>body{font-family:Arial;max-width:800px;margin:50px auto;padding:20px;}";
echo "h1{color:#333;}.success{color:green;}.error{color:red;}.warning{color:orange;}";
echo "pre{background:#f4f4f4;padding:10px;border-radius:5px;overflow-x:auto;}</style>";
echo "</head><body>";

echo "<h1>🔧 Instalación del Sistema de Reservas</h1>";

try {
    // Conectar a MySQL sin seleccionar base de datos
    echo "<h2>1. Conectando a MySQL...</h2>";
    $pdo = new PDO("mysql:host=localhost", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✓ Conexión exitosa a MySQL</p>";
    
    // Crear base de datos
    echo "<h2>2. Creando base de datos...</h2>";
    $pdo->exec("CREATE DATABASE IF NOT EXISTS higiene_reservas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "<p class='success'>✓ Base de datos 'higiene_reservas' creada</p>";
    
    // Seleccionar base de datos
    $pdo->exec("USE higiene_reservas");
    
    // Leer y ejecutar el archivo SQL
    echo "<h2>3. Ejecutando script SQL...</h2>";
    $sqlFile = __DIR__ . '/../sql/setup.sql';
    
    if (!file_exists($sqlFile)) {
        throw new Exception("No se encontró el archivo setup.sql en: $sqlFile");
    }
    
    $sql = file_get_contents($sqlFile);
    
    // Dividir el SQL en statements individuales
    // Eliminar comentarios y líneas vacías
    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
    
    // Ejecutar cada statement
    $statements = explode(';', $sql);
    $executed = 0;
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (empty($statement)) continue;
        
        try {
            $pdo->exec($statement);
            $executed++;
        } catch (PDOException $e) {
            // Ignorar errores de "ya existe" para hacer el script idempotente
            if (strpos($e->getMessage(), 'already exists') === false) {
                echo "<p class='warning'>⚠ Warning: " . htmlspecialchars($e->getMessage()) . "</p>";
            }
        }
    }
    
    echo "<p class='success'>✓ Script SQL ejecutado ($executed statements)</p>";
    
    // Verificar tablas creadas
    echo "<h2>4. Verificando instalación...</h2>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "<p class='success'>✓ Tablas creadas:</p>";
    echo "<ul>";
    foreach ($tables as $table) {
        echo "<li>$table</li>";
    }
    echo "</ul>";
    
    // Verificar usuario admin
    $stmt = $pdo->query("SELECT username, email FROM users WHERE username = 'admin'");
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        echo "<h2>5. Credenciales de Administrador</h2>";
        echo "<div style='background:#e8f5e9;padding:15px;border-radius:5px;'>";
        echo "<p><strong>Usuario:</strong> admin</p>";
        echo "<p><strong>Contraseña:</strong> admin123</p>";
        echo "<p><strong>Email:</strong> {$admin['email']}</p>";
        echo "</div>";
    }
    
    // Contar reservas
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM bookings");
    $count = $stmt->fetch();
    echo "<p>Reservas actuales: <strong>{$count['count']}</strong></p>";
    
    echo "<hr>";
    echo "<h2>✅ ¡Instalación completada exitosamente!</h2>";
    echo "<p>Ahora puedes:</p>";
    echo "<ol>";
    echo "<li>Volver a la <a href='../index.html'>página principal</a></li>";
    echo "<li>Acceder al panel de administrador con las credenciales mostradas arriba</li>";
    echo "<li>Verificar el estado del sistema en <a href='test.php'>test.php</a></li>";
    echo "</ol>";
    
    echo "<div style='background:#fff3cd;padding:15px;border-radius:5px;margin-top:20px;'>";
    echo "<p><strong>⚠️ IMPORTANTE:</strong></p>";
    echo "<ul>";
    echo "<li>Por seguridad, considera eliminar este archivo (setup.php) después de la instalación</li>";
    echo "<li>Cambia la contraseña del administrador desde el panel de control</li>";
    echo "</ul>";
    echo "</div>";
    
} catch (PDOException $e) {
    echo "<h2 class='error'>❌ Error de Base de Datos</h2>";
    echo "<p class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p><strong>Posibles soluciones:</strong></p>";
    echo "<ul>";
    echo "<li>Verifica que XAMPP esté ejecutándose</li>";
    echo "<li>Verifica que MySQL esté activo en el panel de control de XAMPP</li>";
    echo "<li>Verifica que el usuario 'root' tenga permisos</li>";
    echo "</ul>";
} catch (Exception $e) {
    echo "<h2 class='error'>❌ Error</h2>";
    echo "<p class='error'>Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "</body></html>";
?>
