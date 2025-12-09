-- ============================================
-- Base de Datos: Sistema de Reservas de Higiene Bucodental
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS higiene_reservas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE higiene_reservas;

-- ============================================
-- Tabla: users (Administradores)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario administrador por defecto
-- Password: admin123 (hasheado con PASSWORD_DEFAULT de PHP)
INSERT INTO users (username, password_hash, email, full_name) VALUES
('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@medac.es', 'Administrador');

-- ============================================
-- Tabla: bookings (Reservas)
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_date DATE NOT NULL,
    slot_index INT NOT NULL,
    time_slot VARCHAR(5) NOT NULL,
    chair ENUM('rojo', 'azul', 'amarillo') NOT NULL,
    patient_name VARCHAR(100) NOT NULL,
    patient_email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NULL,
    
    -- Constraints
    UNIQUE KEY unique_booking (booking_date, slot_index, chair),
    
    -- Indexes para búsquedas rápidas
    INDEX idx_date (booking_date),
    INDEX idx_email (patient_email),
    INDEX idx_date_time (booking_date, slot_index),
    INDEX idx_chair (chair),
    
    -- Foreign key
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: audit_log (Registro de auditoría)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    user_id INT,
    old_values TEXT,
    new_values TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_action (action_type),
    INDEX idx_table (table_name),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at),
    
    -- Foreign key
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Vista: bookings_summary (Vista de resumen)
-- ============================================
CREATE OR REPLACE VIEW bookings_summary AS
SELECT 
    booking_date,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN chair = 'rojo' THEN 1 END) as rojo_count,
    COUNT(CASE WHEN chair = 'azul' THEN 1 END) as azul_count,
    COUNT(CASE WHEN chair = 'amarillo' THEN 1 END) as amarillo_count
FROM bookings
GROUP BY booking_date
ORDER BY booking_date;

-- ============================================
-- Procedimientos almacenados
-- ============================================

-- Procedimiento para limpiar reservas antiguas (más de 6 meses)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_old_bookings()
BEGIN
    DELETE FROM bookings 
    WHERE booking_date < DATE_SUB(CURDATE(), INTERVAL 6 MONTH);
END //
DELIMITER ;

-- Procedimiento para obtener estadísticas
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS get_statistics(IN start_date DATE, IN end_date DATE)
BEGIN
    SELECT 
        COUNT(*) as total_bookings,
        COUNT(DISTINCT booking_date) as total_dates,
        COUNT(DISTINCT patient_email) as unique_patients,
        chair,
        COUNT(*) as chair_count
    FROM bookings
    WHERE booking_date BETWEEN start_date AND end_date
    GROUP BY chair
    
    UNION ALL
    
    SELECT 
        COUNT(*) as total_bookings,
        COUNT(DISTINCT booking_date) as total_dates,
        COUNT(DISTINCT patient_email) as unique_patients,
        'TOTAL' as chair,
        COUNT(*) as chair_count
    FROM bookings
    WHERE booking_date BETWEEN start_date AND end_date;
END //
DELIMITER ;

-- ============================================
-- Triggers para auditoría
-- ============================================

-- Trigger para auditar creación de reservas
DELIMITER //
CREATE TRIGGER IF NOT EXISTS audit_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action_type, table_name, record_id, new_values)
    VALUES (
        'CREATE',
        'bookings',
        NEW.id,
        JSON_OBJECT(
            'booking_date', NEW.booking_date,
            'slot_index', NEW.slot_index,
            'time_slot', NEW.time_slot,
            'chair', NEW.chair,
            'patient_name', NEW.patient_name,
            'patient_email', NEW.patient_email
        )
    );
END //
DELIMITER ;

-- Trigger para auditar actualización de reservas
DELIMITER //
CREATE TRIGGER IF NOT EXISTS audit_booking_update
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action_type, table_name, record_id, old_values, new_values)
    VALUES (
        'UPDATE',
        'bookings',
        NEW.id,
        JSON_OBJECT(
            'patient_name', OLD.patient_name,
            'patient_email', OLD.patient_email
        ),
        JSON_OBJECT(
            'patient_name', NEW.patient_name,
            'patient_email', NEW.patient_email
        )
    );
END //
DELIMITER ;

-- Trigger para auditar eliminación de reservas
DELIMITER //
CREATE TRIGGER IF NOT EXISTS audit_booking_delete
BEFORE DELETE ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO audit_log (action_type, table_name, record_id, old_values)
    VALUES (
        'DELETE',
        'bookings',
        OLD.id,
        JSON_OBJECT(
            'booking_date', OLD.booking_date,
            'slot_index', OLD.slot_index,
            'time_slot', OLD.time_slot,
            'chair', OLD.chair,
            'patient_name', OLD.patient_name,
            'patient_email', OLD.patient_email
        )
    );
END //
DELIMITER ;

-- ============================================
-- Datos de ejemplo (opcional - comentado)
-- ============================================
/*
INSERT INTO bookings (booking_date, slot_index, time_slot, chair, patient_name, patient_email) VALUES
('2025-01-10', 0, '15:15', 'rojo', 'Juan Pérez', 'juan.perez@alu.medac.es'),
('2025-01-10', 0, '15:15', 'azul', 'María García', 'maria.garcia@alu.medac.es'),
('2025-01-10', 1, '15:55', 'amarillo', 'Pedro López', 'pedro.lopez@medac.es');
*/

-- ============================================
-- Verificación de la instalación
-- ============================================
SELECT 'Database setup completed successfully!' as status;
SELECT COUNT(*) as admin_users FROM users;
SELECT 'Tables created:' as info;
SHOW TABLES;
