<?php
/**
 * Script de diagnóstico para verificar la configuración
 */

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Diagnóstico del Sistema de Reservas</h1>";

// 1. Verificar versión de PHP
echo "<h2>1. Versión de PHP</h2>";
echo "<p>Versión: " . phpversion() . "</p>";
echo "<p style='color: " . (version_compare(phpversion(), '7.4.0', '>=') ? 'green' : 'red') . "'>";
echo version_compare(phpversion(), '7.4.0', '>=') ? "✓ PHP versión correcta" : "✗ PHP versión muy antigua";
echo "</p>";

// 2. Verificar extensiones necesarias
echo "<h2>2. Extensiones de PHP</h2>";
$extensions = ['pdo', 'pdo_mysql', 'json', 'mbstring'];
foreach ($extensions as $ext) {
    $loaded = extension_loaded($ext);
    echo "<p style='color: " . ($loaded ? 'green' : 'red') . "'>";
    echo ($loaded ? "✓" : "✗") . " Extensión $ext: " . ($loaded ? "Cargada" : "NO CARGADA");
    echo "</p>";
}

// 3. Verificar conexión a MySQL
echo "<h2>3. Conexión a MySQL</h2>";
try {
    $pdo = new PDO("mysql:host=localhost", "root", "");
    echo "<p style='color: green'>✓ Conexión a MySQL exitosa</p>";
    
    // 4. Verificar si existe la base de datos
    echo "<h2>4. Base de Datos 'higiene_reservas'</h2>";
    $stmt = $pdo->query("SHOW DATABASES LIKE 'higiene_reservas'");
    $dbExists = $stmt->fetch();
    
    if ($dbExists) {
        echo "<p style='color: green'>✓ La base de datos 'higiene_reservas' existe</p>";
        
        // 5. Verificar tablas
        echo "<h2>5. Tablas en la Base de Datos</h2>";
        $pdo->exec("USE higiene_reservas");
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($tables) > 0) {
            echo "<p style='color: green'>✓ Tablas encontradas:</p>";
            echo "<ul>";
            foreach ($tables as $table) {
                echo "<li>$table</li>";
            }
            echo "</ul>";
            
            // Verificar estructura de tabla bookings
            if (in_array('bookings', $tables)) {
                echo "<h3>Estructura de la tabla 'bookings':</h3>";
                $stmt = $pdo->query("DESCRIBE bookings");
                $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo "<table border='1' cellpadding='5'>";
                echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th></tr>";
                foreach ($columns as $col) {
                    echo "<tr>";
                    echo "<td>{$col['Field']}</td>";
                    echo "<td>{$col['Type']}</td>";
                    echo "<td>{$col['Null']}</td>";
                    echo "<td>{$col['Key']}</td>";
                    echo "</tr>";
                }
                echo "</table>";
                
                // Contar registros
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM bookings");
                $count = $stmt->fetch();
                echo "<p>Total de reservas: <strong>{$count['count']}</strong></p>";
            }
        } else {
            echo "<p style='color: red'>✗ No se encontraron tablas. Necesitas ejecutar el script setup.sql</p>";
        }
    } else {
        echo "<p style='color: red'>✗ La base de datos 'higiene_reservas' NO existe</p>";
        echo "<p><strong>SOLUCIÓN:</strong> Necesitas crear la base de datos ejecutando:</p>";
        echo "<pre>CREATE DATABASE higiene_reservas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;</pre>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color: red'>✗ Error de conexión a MySQL: " . $e->getMessage() . "</p>";
    echo "<p><strong>SOLUCIÓN:</strong> Verifica que XAMPP esté ejecutándose y que MySQL esté activo.</p>";
}

// 6. Verificar archivos de la API
echo "<h2>6. Archivos de la API</h2>";
$apiFiles = ['config.php', 'database.php', 'utils.php', 'auth.php', 'bookings.php'];
foreach ($apiFiles as $file) {
    $exists = file_exists(__DIR__ . '/' . $file);
    echo "<p style='color: " . ($exists ? 'green' : 'red') . "'>";
    echo ($exists ? "✓" : "✗") . " $file: " . ($exists ? "Existe" : "NO EXISTE");
    echo "</p>";
}

// 7. Verificar permisos de escritura
echo "<h2>7. Permisos</h2>";
$writable = is_writable(__DIR__);
echo "<p style='color: " . ($writable ? 'green' : 'orange') . "'>";
echo ($writable ? "✓" : "⚠") . " Directorio API: " . ($writable ? "Escribible" : "Solo lectura");
echo "</p>";

echo "<hr>";
echo "<h2>Resumen</h2>";
echo "<p>Si ves errores en rojo arriba, esas son las causas del problema.</p>";
echo "<p><strong>Próximos pasos:</strong></p>";
echo "<ol>";
echo "<li>Asegúrate de que XAMPP esté ejecutándose (Apache y MySQL)</li>";
echo "<li>Si la base de datos no existe, créala desde phpMyAdmin o ejecuta setup.sql</li>";
echo "<li>Si las tablas no existen, ejecuta el script sql/setup.sql</li>";
echo "</ol>";
?>
