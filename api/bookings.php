<?php
/**
 * API de Gestión de Reservas
 * Endpoints: GET, POST, PUT, DELETE
 */

require_once __DIR__ . '/database.php';
require_once __DIR__ . '/utils.php';

try {
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            handleGet($db);
            break;
            
        case 'POST':
            handlePost($db);
            break;
            
        case 'PUT':
            handlePut($db);
            break;
            
        case 'DELETE':
            handleDelete($db);
            break;
            
        default:
            sendError('Método no permitido', 405);
    }
} catch (Exception $e) {
    error_log("Bookings API Error: " . $e->getMessage());
    sendError('Error en el servidor: ' . $e->getMessage(), 500);
}

/**
 * GET - Obtener reservas
 * Parámetros opcionales: date, email, id
 */
function handleGet($db) {
    $date = $_GET['date'] ?? null;
    $email = $_GET['email'] ?? null;
    $id = $_GET['id'] ?? null;
    
    $sql = "SELECT id, booking_date, slot_index, time_slot, chair, patient_name, patient_email, created_at 
            FROM bookings WHERE 1=1";
    $params = [];
    
    if ($date) {
        if (!validateDate($date)) {
            sendError('Fecha inválida', 400);
        }
        $sql .= " AND booking_date = :date";
        $params[':date'] = $date;
    }
    
    if ($email) {
        $sql .= " AND patient_email = :email";
        $params[':email'] = $email;
    }
    
    if ($id) {
        $sql .= " AND id = :id";
        $params[':id'] = $id;
    }
    
    $sql .= " ORDER BY booking_date, slot_index, chair";
    
    $bookings = $db->fetchAll($sql, $params);
    
    sendResponse(true, $bookings, 'Reservas obtenidas correctamente');
}

/**
 * POST - Crear nueva reserva
 */
function handlePost($db) {
    $data = getPostData();
    requireParams($data, ['booking_date', 'slot_index', 'time_slot', 'chair', 'patient_name', 'patient_email']);
    
    // Sanitizar y validar datos
    $bookingDate = sanitizeInput($data['booking_date']);
    $slotIndex = (int)$data['slot_index'];
    $timeSlot = sanitizeInput($data['time_slot']);
    $chair = sanitizeInput($data['chair']);
    $patientName = sanitizeInput($data['patient_name']);
    $patientEmail = sanitizeInput($data['patient_email']);
    
    // Validaciones
    if (!validateDate($bookingDate)) {
        sendError('Fecha inválida', 400);
    }
    
    if (!isFriday($bookingDate)) {
        sendError('Solo se pueden hacer reservas los viernes', 400);
    }
    
    // Verificar que la fecha no sea pasada
    if (strtotime($bookingDate) < strtotime(date('Y-m-d'))) {
        sendError('No se pueden hacer reservas en fechas pasadas', 400);
    }
    
    if (!validateSlotIndex($slotIndex)) {
        sendError('Índice de horario inválido', 400);
    }
    
    if (!validateChair($chair)) {
        sendError('Sillón inválido', 400);
    }
    
    if (!validateEmail($patientEmail)) {
        sendError('Email inválido. Debe ser @alu.medac.es o @medac.es', 400);
    }
    
    // Verificar disponibilidad
    $checkSql = "SELECT id FROM bookings 
                 WHERE booking_date = :date AND slot_index = :slot AND chair = :chair";
    $existing = $db->fetchOne($checkSql, [
        ':date' => $bookingDate,
        ':slot' => $slotIndex,
        ':chair' => $chair
    ]);
    
    if ($existing) {
        sendError('Este horario y sillón ya están reservados', 409);
    }
    
    // Insertar reserva
    $insertSql = "INSERT INTO bookings (booking_date, slot_index, time_slot, chair, patient_name, patient_email, created_by) 
                  VALUES (:date, :slot, :time, :chair, :name, :email, :created_by)";
    
    $bookingId = $db->insert($insertSql, [
        ':date' => $bookingDate,
        ':slot' => $slotIndex,
        ':time' => $timeSlot,
        ':chair' => $chair,
        ':name' => $patientName,
        ':email' => $patientEmail,
        ':created_by' => getCurrentUserId()
    ]);
    
    sendResponse(true, ['id' => $bookingId], 'Reserva creada correctamente', 201);
}

/**
 * PUT - Actualizar reserva existente (solo admin)
 */
function handlePut($db) {
    requireAuth();
    
    $data = getPostData();
    requireParams($data, ['id', 'patient_name', 'patient_email']);
    
    $id = (int)$data['id'];
    $patientName = sanitizeInput($data['patient_name']);
    $patientEmail = sanitizeInput($data['patient_email']);
    
    // Validar email
    if (!validateEmail($patientEmail)) {
        sendError('Email inválido. Debe ser @alu.medac.es o @medac.es', 400);
    }
    
    // Verificar que existe
    $checkSql = "SELECT patient_name, patient_email FROM bookings WHERE id = :id";
    $existing = $db->fetchOne($checkSql, [':id' => $id]);
    
    if (!$existing) {
        sendError('Reserva no encontrada', 404);
    }
    
    // Actualizar
    $updateSql = "UPDATE bookings 
                  SET patient_name = :name, patient_email = :email 
                  WHERE id = :id";
    
    $db->update($updateSql, [
        ':name' => $patientName,
        ':email' => $patientEmail,
        ':id' => $id
    ]);
    
    sendResponse(true, null, 'Reserva actualizada correctamente');
}

/**
 * DELETE - Eliminar reserva
 * Parámetros: id (admin) o email (usuario)
 */
function handleDelete($db) {
    $id = $_GET['id'] ?? null;
    $email = $_GET['email'] ?? null;
    
    if ($id) {
        // Eliminar por ID (requiere autenticación)
        requireAuth();
        
        $deleteSql = "DELETE FROM bookings WHERE id = :id";
        $affected = $db->delete($deleteSql, [':id' => $id]);
        
        if ($affected === 0) {
            sendError('Reserva no encontrada', 404);
        }
        
        sendResponse(true, null, 'Reserva eliminada correctamente');
        
    } elseif ($email) {
        // Eliminar por email (no requiere autenticación)
        if (!validateEmail($email)) {
            sendError('Email inválido', 400);
        }
        
        $deleteSql = "DELETE FROM bookings WHERE patient_email = :email";
        $affected = $db->delete($deleteSql, [':email' => $email]);
        
        if ($affected === 0) {
            sendError('No se encontraron reservas con ese email', 404);
        }
        
        sendResponse(true, ['deleted_count' => $affected], "Se eliminaron $affected reserva(s)");
        
    } else {
        sendError('Debe proporcionar id o email', 400);
    }
}
