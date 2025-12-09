# Sistema de Reservas - Higiene Bucodental

Sistema profesional de gestión de reservas para prácticas de Higiene Bucodental con backend PHP + MySQL.

## 🎯 Características

### Vista de Usuario
- 📅 Calendario interactivo (solo viernes)
- 🕐 Selección de horarios (15:15 - 20:30, intervalos de 40 min)
- 💺 Tres sillones disponibles (rojo, azul, amarillo)
- ✉️ Validación de email (@alu.medac.es, @medac.es)
- ❌ Cancelación de citas por email
- 📱 Diseño responsive

### Panel de Administrador
- 🔐 Autenticación segura con sesiones
- 📊 Estadísticas de reservas
- ✏️ Editar cualquier cita
- 🗑️ Eliminar citas individuales o masivas
- 📥 Exportar a Excel
- 🔄 Reset de reservas por fecha o total
- 📝 Registro de auditoría

## 🏗️ Arquitectura

### Frontend
- HTML5 + CSS3 + JavaScript (ES6+)
- Bootstrap 5.3.2
- SheetJS (exportación Excel)
- Fetch API para comunicación con backend

### Backend
- PHP 7.4+ / 8.x
- MySQL 5.7+ / MariaDB
- PDO para acceso a base de datos
- API REST con JSON
- Sesiones seguras

### Base de Datos
- **users**: Administradores
- **bookings**: Reservas
- **audit_log**: Registro de cambios
- Triggers automáticos para auditoría
- Índices optimizados para rendimiento

## 📁 Estructura del Proyecto

```
Limpiezas/
├── index.html              # Interfaz principal
├── admin.html              # Panel admin standalone (legacy)
├── styles.css              # Estilos personalizados
├── app.js                  # Frontend con localStorage (legacy)
├── app-api.js              # Frontend con API (nuevo)
├── api/
│   ├── config.php          # Configuración
│   ├── database.php        # Conexión BD
│   ├── auth.php            # Autenticación
│   ├── bookings.php        # CRUD reservas
│   └── utils.php           # Funciones auxiliares
├── sql/
│   └── setup.sql           # Script de instalación
├── DEPLOYMENT.md           # Guía de despliegue
├── README.md               # Este archivo
└── INSTRUCCIONES.md        # Instrucciones originales
```

## 🚀 Instalación Rápida

### Requisitos
- XAMPP (Apache + MySQL + PHP)
- Navegador moderno

### Pasos

1. **Copiar archivos**
   ```bash
   # Copiar carpeta a htdocs
   C:\xampp\htdocs\Limpiezas\
   ```

2. **Iniciar XAMPP**
   - Iniciar Apache
   - Iniciar MySQL

3. **Crear base de datos**
   - Abrir phpMyAdmin: `http://localhost/phpmyadmin`
   - Importar `sql/setup.sql`

4. **Acceder**
   - URL: `http://localhost/Limpiezas/`
   - Admin: `admin` / `admin123`

📖 **Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas**

## 🔌 API Endpoints

### Autenticación

```http
POST /api/auth.php?action=login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

```http
GET /api/auth.php?action=check
```

```http
GET /api/auth.php?action=logout
```

### Reservas

```http
# Obtener todas las reservas
GET /api/bookings.php

# Obtener reservas de una fecha
GET /api/bookings.php?date=2025-01-10

# Crear reserva
POST /api/bookings.php
Content-Type: application/json

{
  "booking_date": "2025-01-10",
  "slot_index": 0,
  "time_slot": "15:15",
  "chair": "rojo",
  "patient_name": "Juan Pérez",
  "patient_email": "juan.perez@alu.medac.es"
}

# Actualizar reserva (requiere autenticación)
PUT /api/bookings.php
Content-Type: application/json

{
  "id": 1,
  "patient_name": "Juan Pérez García",
  "patient_email": "juan.perez@medac.es"
}

# Eliminar por ID (requiere autenticación)
DELETE /api/bookings.php?id=1

# Eliminar por email
DELETE /api/bookings.php?email=juan.perez@alu.medac.es
```

## 🔒 Seguridad

- ✅ Contraseñas hasheadas (bcrypt)
- ✅ Prepared statements (prevención SQL injection)
- ✅ Validación de inputs
- ✅ Sanitización de datos
- ✅ Sesiones seguras
- ✅ CORS configurado
- ✅ Registro de auditoría
- ✅ Validación de dominios de email

## 🛠️ Configuración

### Cambiar credenciales de BD

Editar `api/config.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'higiene_reservas');
define('DB_USER', 'root');
define('DB_PASS', 'tu_contraseña');
```

### Cambiar dominios de email permitidos

Editar `api/config.php`:

```php
define('ALLOWED_EMAIL_DOMAINS', ['alu.medac.es', 'medac.es', 'otro.es']);
```

### Cambiar horarios

Editar `api/config.php`:

```php
define('START_HOUR', 15);
define('START_MINUTE', 15);
define('END_HOUR', 20);
define('END_MINUTE', 30);
define('SLOT_DURATION', 40); // minutos
```

## 📊 Base de Datos

### Esquema Principal

```sql
-- Tabla de usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255),
    email VARCHAR(100),
    created_at TIMESTAMP
);

-- Tabla de reservas
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_date DATE,
    slot_index INT,
    time_slot VARCHAR(5),
    chair ENUM('rojo', 'azul', 'amarillo'),
    patient_name VARCHAR(100),
    patient_email VARCHAR(100),
    created_at TIMESTAMP,
    UNIQUE KEY (booking_date, slot_index, chair)
);

-- Tabla de auditoría
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'),
    table_name VARCHAR(50),
    record_id INT,
    user_id INT,
    created_at TIMESTAMP
);
```

## 🧪 Testing

### Probar API con curl

```bash
# Login
curl -X POST http://localhost/Limpiezas/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Obtener reservas
curl http://localhost/Limpiezas/api/bookings.php

# Crear reserva
curl -X POST http://localhost/Limpiezas/api/bookings.php \
  -H "Content-Type: application/json" \
  -d '{
    "booking_date": "2025-01-10",
    "slot_index": 0,
    "time_slot": "15:15",
    "chair": "rojo",
    "patient_name": "Test User",
    "patient_email": "test@alu.medac.es"
  }'
```

## 📝 Mantenimiento

### Backup automático

Crear tarea programada para ejecutar:

```bash
mysqldump -u root higiene_reservas > backup_$(date +%Y%m%d).sql
```

### Limpiar reservas antiguas

Ejecutar en phpMyAdmin:

```sql
CALL cleanup_old_bookings();
```

### Ver estadísticas

```sql
CALL get_statistics('2025-01-01', '2025-12-31');
```

## 🐛 Solución de Problemas

Ver [DEPLOYMENT.md](DEPLOYMENT.md#-solución-de-problemas) para guía completa.

## 📄 Licencia

Proyecto educativo para el módulo de Diseño de Interfaces - MEDAC

## 👨‍💻 Autor

Desarrollado para prácticas de Higiene Bucodental - Instituto MEDAC

---

**Versión:** 2.0.0 (Backend PHP + MySQL)  
**Última actualización:** Diciembre 2025
