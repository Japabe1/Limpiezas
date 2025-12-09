# Guía de Despliegue - Sistema de Reservas

Esta guía te ayudará a desplegar la aplicación en XAMPP paso a paso.

## 📋 Requisitos Previos

- XAMPP instalado con:
  - Apache 2.4+
  - PHP 7.4+ o PHP 8.x
  - MySQL 5.7+ o MariaDB 10.x
- Navegador web moderno (Chrome, Firefox, Edge)

## 🚀 Pasos de Instalación

### 1. Copiar Archivos

1. Copia toda la carpeta `Limpiezas` a `C:\xampp\htdocs\`
2. La ruta final debe ser: `C:\xampp\htdocs\Limpiezas\`

### 2. Iniciar XAMPP

1. Abre el Panel de Control de XAMPP
2. Inicia **Apache** (botón Start)
3. Inicia **MySQL** (botón Start)
4. Verifica que ambos servicios muestren el fondo verde

### 3. Crear la Base de Datos

#### Opción A: Usando phpMyAdmin (Recomendado)

1. Abre tu navegador y ve a: `http://localhost/phpmyadmin`
2. Haz clic en la pestaña **"SQL"** en el menú superior
3. Abre el archivo `C:\xampp\htdocs\Limpiezas\sql\setup.sql` con un editor de texto
4. Copia TODO el contenido del archivo
5. Pégalo en el área de texto de phpMyAdmin
6. Haz clic en el botón **"Continuar"** o **"Go"**
7. Deberías ver mensajes de éxito indicando que se crearon las tablas

#### Opción B: Usando línea de comandos

```bash
cd C:\xampp\mysql\bin
mysql -u root -p < C:\xampp\htdocs\Limpiezas\sql\setup.sql
```

### 4. Verificar la Instalación de la Base de Datos

1. En phpMyAdmin, selecciona la base de datos `higiene_reservas` en el panel izquierdo
2. Deberías ver 3 tablas:
   - `users`
   - `bookings`
   - `audit_log`
3. Haz clic en la tabla `users` y verifica que existe un usuario `admin`

### 5. Configurar Credenciales (Opcional)

Si tu MySQL tiene contraseña o configuración diferente:

1. Abre el archivo `C:\xampp\htdocs\Limpiezas\api\config.php`
2. Modifica las siguientes líneas según tu configuración:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'higiene_reservas');
define('DB_USER', 'root');
define('DB_PASS', ''); // Pon tu contraseña aquí si tienes una
```

### 6. Acceder a la Aplicación

1. Abre tu navegador
2. Ve a: `http://localhost/Limpiezas/`
3. Deberías ver la página principal con el calendario

## 🔐 Credenciales de Administrador

**Usuario:** `admin`  
**Contraseña:** `admin123`

> [!IMPORTANT]
> **Cambia la contraseña por defecto** después del primer login por seguridad.

## ✅ Verificación de Funcionamiento

### Prueba de Usuario Normal

1. Selecciona un viernes en el calendario
2. Haz clic en un sillón disponible
3. Completa el formulario con:
   - Nombre: Tu nombre
   - Email: `prueba@alu.medac.es` (debe ser @alu.medac.es o @medac.es)
4. Confirma la reserva
5. Verifica que aparece en el calendario

### Prueba de Administrador

1. Haz clic en **"🔐 Modo Administrador"**
2. Introduce las credenciales:
   - Usuario: `admin`
   - Contraseña: `admin123`
3. Deberías ver el panel de administración con todas las reservas
4. Prueba editar o eliminar una reserva
5. Prueba exportar a Excel

## 🔧 Solución de Problemas

### Error: "No se puede conectar a la base de datos"

**Solución:**
1. Verifica que MySQL esté corriendo en XAMPP
2. Verifica las credenciales en `api/config.php`
3. Asegúrate de que la base de datos `higiene_reservas` existe

### Error: "404 Not Found" al acceder a la API

**Solución:**
1. Verifica que Apache esté corriendo
2. Verifica que la carpeta esté en `C:\xampp\htdocs\Limpiezas\`
3. Intenta acceder directamente a: `http://localhost/Limpiezas/api/bookings.php`

### Error: "Email inválido"

**Solución:**
- Solo se aceptan emails con dominios `@alu.medac.es` o `@medac.es`
- Verifica que estás usando uno de estos dominios

### Las reservas no se guardan

**Solución:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network" o "Red"
3. Intenta crear una reserva y mira si hay errores en las peticiones
4. Verifica que la tabla `bookings` existe en la base de datos

### Error de permisos en Windows

**Solución:**
1. Ejecuta XAMPP como Administrador
2. Verifica que la carpeta `Limpiezas` tenga permisos de lectura/escritura

## 📊 Verificar Logs

Si hay errores, puedes revisar los logs:

1. **Logs de PHP:** `C:\xampp\php\logs\php_error_log`
2. **Logs de Apache:** `C:\xampp\apache\logs\error.log`
3. **Logs de MySQL:** `C:\xampp\mysql\data\mysql_error.log`

## 🔄 Actualizar la Aplicación

Si haces cambios en el código:

1. **Cambios en HTML/CSS/JS:** Solo recarga la página (Ctrl+F5)
2. **Cambios en PHP:** No requiere reiniciar, solo recarga
3. **Cambios en la base de datos:** Ejecuta el SQL modificado en phpMyAdmin

## 🗄️ Backup de Datos

### Exportar Base de Datos

1. Ve a phpMyAdmin: `http://localhost/phpmyadmin`
2. Selecciona `higiene_reservas`
3. Haz clic en la pestaña **"Exportar"**
4. Selecciona **"Método rápido"**
5. Haz clic en **"Continuar"**
6. Se descargará un archivo `.sql` con todos tus datos

### Restaurar Base de Datos

1. En phpMyAdmin, selecciona `higiene_reservas`
2. Haz clic en la pestaña **"Importar"**
3. Selecciona el archivo `.sql` de backup
4. Haz clic en **"Continuar"**

## 🌐 Desplegar en Servidor Web Real

Para desplegar en el servidor del instituto:

1. Exporta la base de datos desde XAMPP
2. Sube todos los archivos por FTP al servidor
3. Importa la base de datos en el servidor
4. Actualiza `api/config.php` con las credenciales del servidor:
   ```php
   define('DB_HOST', 'servidor.instituto.es');
   define('DB_NAME', 'nombre_bd');
   define('DB_USER', 'usuario_bd');
   define('DB_PASS', 'contraseña_bd');
   ```
5. Asegúrate de que el servidor tenga PHP 7.4+ y MySQL

## 📞 Soporte

Si encuentras problemas:

1. Revisa esta guía completamente
2. Verifica los logs de errores
3. Consulta la documentación de XAMPP
4. Verifica que todos los servicios estén corriendo

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando correctamente en:
**http://localhost/Limpiezas/**

Disfruta de tu sistema de reservas profesional! 🚀
