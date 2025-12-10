// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================
const CONFIG = {
    API_BASE_URL: '/Limpiezas/api',  // Ajustar según la ruta en el servidor
    CHAIRS: ['rojo', 'azul', 'amarillo'],
    SLOT_DURATION_MIN: 40,
    START_TIME: { h: 15, m: 15 },
    END_TIME: { h: 20, m: 30 }
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const AppState = {
    currentView: 'user',
    isAdminAuthenticated: false,
    selectedDate: null,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    bookings: [],
    loading: false
};

// ============================================
// UTILIDADES
// ============================================
function minutes(h, m) {
    return h * 60 + m;
}

function timeToStr(t) {
    return String(t.h).padStart(2, '0') + ':' + String(t.m).padStart(2, '0');
}

function dateToStr(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function strToDate(str) {
    const [year, month, day] = str.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function isFriday(date) {
    return date.getDay() === 5;
}

function formatDateLong(dateStr) {
    const date = strToDate(dateStr);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;

    const domain = email.split('@')[1].toLowerCase();
    return domain === 'alu.medac.es' || domain === 'medac.es';
}

function generateTimeSlots() {
    const slots = [];
    let curMin = minutes(CONFIG.START_TIME.h, CONFIG.START_TIME.m);
    const endMin = minutes(CONFIG.END_TIME.h, CONFIG.END_TIME.m);

    while (curMin + CONFIG.SLOT_DURATION_MIN <= endMin) {
        const h = Math.floor(curMin / 60);
        const m = curMin % 60;
        slots.push({
            start: { h, m },
            chairs: { rojo: null, azul: null, amarillo: null }
        });
        curMin += CONFIG.SLOT_DURATION_MIN;
    }

    return slots;
}

// ============================================
// API CALLS
// ============================================
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Error en la petición');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadBookings(date = null) {
    try {
        AppState.loading = true;
        const url = date ? `bookings.php?date=${date}` : 'bookings.php';
        const response = await apiCall(url);
        AppState.bookings = response.data || [];
        return AppState.bookings;
    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Error al cargar las reservas: ' + error.message);
        return [];
    } finally {
        AppState.loading = false;
    }
}

async function createBooking(bookingData) {
    try {
        const response = await apiCall('bookings.php', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });
        return response;
    } catch (error) {
        throw error;
    }
}

async function updateBooking(id, bookingData) {
    try {
        const response = await apiCall('bookings.php', {
            method: 'PUT',
            body: JSON.stringify({ id, ...bookingData })
        });
        return response;
    } catch (error) {
        throw error;
    }
}

async function deleteBooking(id = null, email = null) {
    try {
        const url = id ? `bookings.php?id=${id}` : `bookings.php?email=${encodeURIComponent(email)}`;
        const response = await apiCall(url, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        throw error;
    }
}

async function login(username, password) {
    try {
        const response = await apiCall('auth.php?action=login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        return response;
    } catch (error) {
        throw error;
    }
}

async function logout() {
    try {
        const response = await apiCall('auth.php?action=logout');
        return response;
    } catch (error) {
        throw error;
    }
}

async function checkAuth() {
    try {
        const response = await apiCall('auth.php?action=check');
        return response.data.authenticated;
    } catch (error) {
        return false;
    }
}

function getBookingsForDate(dateStr) {
    return AppState.bookings.filter(b => b.booking_date === dateStr);
}

function getAllBookings() {
    return AppState.bookings.sort((a, b) => {
        if (a.booking_date !== b.booking_date) return a.booking_date.localeCompare(b.booking_date);
        return a.slot_index - b.slot_index;
    });
}

// ============================================
// NAVEGACIÓN ENTRE VISTAS
// ============================================
function switchView(view) {
    AppState.currentView = view;

    document.getElementById('userView').classList.toggle('hidden', view !== 'user');
    document.getElementById('adminView').classList.toggle('hidden', view !== 'admin');

    if (view === 'admin') {
        renderAdminPanel();
    }
}

function updateUIForAuthState() {
    const isAuthenticated = AppState.isAdminAuthenticated;

    // Mostrar/ocultar botones de login/logout
    document.getElementById('btnLogin').classList.toggle('hidden', isAuthenticated);
    document.getElementById('btnLogout').classList.toggle('hidden', !isAuthenticated);

    // Mostrar/ocultar info de usuario
    document.getElementById('userInfo').classList.toggle('hidden', !isAuthenticated);

    if (isAuthenticated) {
        // Mostrar nombre de usuario (puedes obtenerlo del estado si lo guardas)
        document.getElementById('loggedUsername').textContent = 'Administrador';
    }
}

// ============================================
// AUTENTICACIÓN DE ADMINISTRADOR
// ============================================
let adminLoginModalInstance;

function showAdminLogin() {
    document.getElementById('adminPasswordInput').value = '';
    document.getElementById('adminLoginUsername').value = '';
    document.getElementById('adminPasswordInput').classList.remove('is-invalid');
    document.getElementById('adminLoginUsername').classList.remove('is-invalid');
    adminLoginModalInstance.show();
}

async function attemptAdminLogin() {
    const username = document.getElementById('adminLoginUsername').value.trim();
    const password = document.getElementById('adminPasswordInput').value;

    if (!username || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }

    try {
        const response = await login(username, password);
        AppState.isAdminAuthenticated = true;
        adminLoginModalInstance.hide();

        // Actualizar UI
        updateUIForAuthState();

        // Cargar todas las reservas y cambiar a vista admin
        await loadBookings();
        switchView('admin');
    } catch (error) {
        document.getElementById('adminPasswordInput').classList.add('is-invalid');
        document.getElementById('adminLoginUsername').classList.add('is-invalid');
    }
}

async function handleLogout() {
    try {
        await logout();
        AppState.isAdminAuthenticated = false;

        // Actualizar UI
        updateUIForAuthState();

        // Volver a vista de usuario
        switchView('user');
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// CALENDARIO
// ============================================
function renderCalendar() {
    const container = document.getElementById('calendarGrid');
    container.innerHTML = '';

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('currentMonth').textContent =
        `${monthNames[AppState.currentMonth]} ${AppState.currentYear}`;

    const firstDay = new Date(AppState.currentYear, AppState.currentMonth, 1);
    const lastDay = new Date(AppState.currentYear, AppState.currentMonth + 1, 0);

    const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        container.appendChild(header);
    });

    let startOffset = firstDay.getDay() - 1;
    if (startOffset === -1) startOffset = 6;

    for (let i = 0; i < startOffset; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        container.appendChild(emptyDay);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(AppState.currentYear, AppState.currentMonth, day);
        const dateStr = dateToStr(date);
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const friday = isFriday(date);
        const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

        if (friday && !isPast) {
            dayElement.classList.add('friday');
            if (AppState.selectedDate === dateStr) {
                dayElement.classList.add('selected');
            }
            dayElement.onclick = () => selectDate(dateStr);

            if (getBookingsForDate(dateStr).length > 0) {
                dayElement.style.position = 'relative';
                dayElement.classList.add('has-bookings');
            }
        } else {
            dayElement.classList.add('disabled');
        }

        container.appendChild(dayElement);
    }
}

function changeMonth(delta) {
    AppState.currentMonth += delta;
    if (AppState.currentMonth > 11) {
        AppState.currentMonth = 0;
        AppState.currentYear++;
    } else if (AppState.currentMonth < 0) {
        AppState.currentMonth = 11;
        AppState.currentYear--;
    }
    renderCalendar();
}

async function selectDate(dateStr) {
    AppState.selectedDate = dateStr;
    renderCalendar();

    // Cargar reservas de esta fecha
    await loadBookings(dateStr);
    renderSlots();

    document.getElementById('slotsSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// RENDERIZADO DE SLOTS
// ============================================
function renderSlots() {
    const container = document.getElementById('slotsContainer');

    if (!AppState.selectedDate) {
        container.innerHTML = '<div class="alert alert-info-custom">Selecciona un viernes en el calendario para ver los horarios disponibles.</div>';
        document.getElementById('selectedDateDisplay').textContent = 'Ninguna fecha seleccionada';
        return;
    }

    document.getElementById('selectedDateDisplay').textContent = formatDateLong(AppState.selectedDate);

    const slots = generateTimeSlots();
    const bookings = getBookingsForDate(AppState.selectedDate);

    bookings.forEach(b => {
        if (slots[b.slot_index]) {
            slots[b.slot_index].chairs[b.chair] = b;
        }
    });

    container.innerHTML = '';

    slots.forEach((slot, index) => {
        const slotCard = document.createElement('div');
        slotCard.className = 'slot-card fade-in';

        const timeDiv = document.createElement('div');
        timeDiv.className = 'slot-time';
        timeDiv.textContent = timeToStr(slot.start);

        const durationDiv = document.createElement('div');
        durationDiv.className = 'slot-duration';
        durationDiv.textContent = `Duración: ${CONFIG.SLOT_DURATION_MIN} minutos`;

        const chairsDiv = document.createElement('div');
        chairsDiv.className = 'chairs-container';

        // Mapeo de nombres de sillones a clases CSS de colores
        const chairColorClass = {
            'rojo': 'red',
            'azul': 'blue',
            'amarillo': 'yellow'
        };

        CONFIG.CHAIRS.forEach(chair => {
            const booking = slot.chairs[chair];
            const btn = document.createElement('button');
            btn.className = 'btn chair ' + chairColorClass[chair];

            if (booking) {
                btn.innerHTML = `<strong>${chair.charAt(0).toUpperCase() + chair.slice(1)}</strong><br><small>${booking.patient_name}</small>`;
                btn.disabled = true;
            } else {
                btn.innerHTML = `<strong>${chair.charAt(0).toUpperCase() + chair.slice(1)}</strong><br><small>Disponible</small>`;
                btn.onclick = () => openBookingModal(index, chair);
            }

            chairsDiv.appendChild(btn);
        });

        slotCard.appendChild(timeDiv);
        slotCard.appendChild(durationDiv);
        slotCard.appendChild(chairsDiv);
        container.appendChild(slotCard);
    });

    updateSummary();
}

function updateSummary() {
    if (!AppState.selectedDate) return;

    const slots = generateTimeSlots();
    const bookings = getBookingsForDate(AppState.selectedDate);
    const total = slots.length * CONFIG.CHAIRS.length;
    const taken = bookings.length;
    const available = total - taken;

    document.getElementById('summaryTotal').textContent = total;
    document.getElementById('summaryTaken').textContent = taken;
    document.getElementById('summaryAvailable').textContent = available;
}

// ============================================
// MODAL DE RESERVA
// ============================================
let bookingModalInstance;

function openBookingModal(slotIndex, chair) {
    const slots = generateTimeSlots();
    document.getElementById('formSlotIndex').value = slotIndex;
    document.getElementById('formTime').value = timeToStr(slots[slotIndex].start);
    document.getElementById('formChair').value = chair;
    document.getElementById('formName').value = '';
    document.getElementById('formEmail').value = '';

    bookingModalInstance.show();
}

async function confirmBooking() {
    const slotIndex = parseInt(document.getElementById('formSlotIndex').value, 10);
    const chair = document.getElementById('formChair').value;
    const name = document.getElementById('formName').value.trim();
    const email = document.getElementById('formEmail').value.trim();

    if (!name) {
        alert('Por favor, introduce el nombre del paciente.');
        return;
    }

    if (!email) {
        alert('Por favor, introduce el email.');
        return;
    }

    if (!validateEmail(email)) {
        alert('El email debe ser del dominio @alu.medac.es o @medac.es');
        return;
    }

    const slots = generateTimeSlots();
    const bookingData = {
        booking_date: AppState.selectedDate,
        slot_index: slotIndex,
        time_slot: timeToStr(slots[slotIndex].start),
        chair: chair,
        patient_name: name,
        patient_email: email
    };

    try {
        await createBooking(bookingData);
        await loadBookings(AppState.selectedDate);
        renderSlots();
        renderCalendar();
        bookingModalInstance.hide();

        alert(`¡Reserva confirmada!\n\nFecha: ${formatDateLong(AppState.selectedDate)}\nHora: ${bookingData.time_slot}\nSillón: ${chair}\nPaciente: ${name}\nEmail: ${email}`);
    } catch (error) {
        alert('Error al crear la reserva: ' + error.message);
    }
}

// ============================================
// ELIMINAR CITA POR EMAIL
// ============================================
async function deleteByEmail() {
    const email = document.getElementById('deleteEmail').value.trim();

    if (!email) {
        alert('Por favor, introduce tu email.');
        return;
    }

    if (!validateEmail(email)) {
        alert('El email debe ser del dominio @alu.medac.es o @medac.es');
        return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar todas tus reservas?')) {
        return;
    }

    try {
        const response = await deleteBooking(null, email);
        await loadBookings(AppState.selectedDate);
        renderSlots();
        renderCalendar();
        document.getElementById('deleteEmail').value = '';

        alert(response.message || 'Reserva(s) eliminada(s) correctamente');
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

// ============================================
// PANEL DE ADMINISTRADOR
// ============================================
async function renderAdminPanel() {
    await loadBookings(); // Cargar todas las reservas

    const allBookings = getAllBookings();
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '';

    if (allBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay reservas registradas</td></tr>';
        updateAdminStats();
        return;
    }

    // Mapeo de nombres de sillones a clases CSS de colores
    const chairColorClass = {
        'rojo': 'red',
        'azul': 'blue',
        'amarillo': 'yellow'
    };

    allBookings.forEach((booking) => {
        const tr = document.createElement('tr');
        const colorClass = chairColorClass[booking.chair] || booking.chair;
        tr.innerHTML = `
      <td><strong>${formatDateLong(booking.booking_date)}</strong></td>
      <td>${booking.time_slot}</td>
      <td><span class="badge-chair ${colorClass}">${booking.chair.charAt(0).toUpperCase() + booking.chair.slice(1)}</span></td>
      <td>${booking.patient_name}</td>
      <td>${booking.patient_email}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editBooking(${booking.id})">
          Editar
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBookingAdmin(${booking.id})">
          Eliminar
        </button>
      </td>
    `;
        tbody.appendChild(tr);
    });

    updateAdminStats();
}

function updateAdminStats() {
    const allBookings = getAllBookings();
    const uniqueDates = [...new Set(allBookings.map(b => b.booking_date))].length;

    document.getElementById('statsTotalBookings').textContent = allBookings.length;
    document.getElementById('statsTotalDates').textContent = uniqueDates;
}

// ============================================
// EDITAR CITA (ADMIN)
// ============================================
let editModalInstance;
let currentEditBookingId = null;

async function editBooking(id) {
    const booking = AppState.bookings.find(b => b.id === id);
    if (!booking) return;

    currentEditBookingId = id;

    document.getElementById('editDate').value = booking.booking_date;
    document.getElementById('editTime').value = booking.time_slot;
    document.getElementById('editChair').value = booking.chair;
    document.getElementById('editName').value = booking.patient_name;
    document.getElementById('editEmail').value = booking.patient_email;

    editModalInstance.show();
}

async function saveEditBooking() {
    if (!currentEditBookingId) return;

    const newName = document.getElementById('editName').value.trim();
    const newEmail = document.getElementById('editEmail').value.trim();

    if (!newName || !newEmail) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    if (!validateEmail(newEmail)) {
        alert('El email debe ser del dominio @alu.medac.es o @medac.es');
        return;
    }

    try {
        await updateBooking(currentEditBookingId, {
            patient_name: newName,
            patient_email: newEmail
        });

        await loadBookings();
        renderAdminPanel();
        editModalInstance.hide();
        alert('Cita actualizada correctamente.');
    } catch (error) {
        alert('Error al actualizar: ' + error.message);
    }
}

// ============================================
// ELIMINAR CITA (ADMIN)
// ============================================
async function deleteBookingAdmin(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) return;

    try {
        await deleteBooking(id);
        await loadBookings();
        renderAdminPanel();
        renderCalendar();

        if (AppState.selectedDate) {
            await loadBookings(AppState.selectedDate);
            renderSlots();
        }

        alert('Cita eliminada correctamente.');
    } catch (error) {
        alert('Error al eliminar: ' + error.message);
    }
}

// ============================================
// EXPORTAR A EXCEL
// ============================================
function exportToExcel() {
    const allBookings = getAllBookings();

    if (allBookings.length === 0) {
        alert('No hay reservas para exportar.');
        return;
    }

    const rows = allBookings.map(b => ({
        Fecha: formatDateLong(b.booking_date),
        Horario: b.time_slot,
        Sillón: b.chair.charAt(0).toUpperCase() + b.chair.slice(1),
        Nombre: b.patient_name,
        Email: b.patient_email
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
    XLSX.writeFile(wb, `reservas_higiene_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ============================================
// EXPORTAR A PDF (PRÓXIMO VIERNES)
// ============================================
function getNextFriday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;

    // Si es viernes (dayOfWeek === 5), daysUntilFriday será 0
    // Si queremos el viernes actual si es viernes, o el próximo si no lo es
    if (daysUntilFriday === 0) {
        // Es viernes hoy, usar hoy
        const now = new Date();
        if (now.getHours() >= 21) {
            // Si ya pasaron las 21:00, usar el próximo viernes
            daysUntilFriday = 7;
        }
    }

    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    return dateToStr(nextFriday);
}

async function exportNextFridayToPDF() {
    try {
        // Obtener el próximo viernes
        const nextFriday = getNextFriday();

        // Cargar reservas de esa fecha
        await loadBookings(nextFriday);
        const bookings = getBookingsForDate(nextFriday);

        if (bookings.length === 0) {
            alert(`No hay reservas para el próximo viernes (${formatDateLong(nextFriday)})`);
            return;
        }

        // Inicializar jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Configuración
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = 20;

        // ============================================
        // ENCABEZADO
        // ============================================
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(33, 37, 41); // Color oscuro
        doc.text('Sistema de Reservas', pageWidth / 2, yPos, { align: 'center' });
        yPos += 8;

        doc.setFontSize(16);
        doc.setTextColor(108, 117, 125); // Color gris
        doc.text('Higiene Bucodental - Prácticas DAVANTE', pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;

        // ============================================
        // INFORMACIÓN DE LA FECHA
        // ============================================
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text(`Reservas para: ${formatDateLong(nextFriday)}`, margin, yPos);
        yPos += 10;

        // ============================================
        // RESUMEN DE OCUPACIÓN
        // ============================================
        const slots = generateTimeSlots();
        const totalPlaces = slots.length * CONFIG.CHAIRS.length;
        const occupied = bookings.length;
        const available = totalPlaces - occupied;

        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(108, 117, 125);
        doc.text(`Total de plazas: ${totalPlaces} | Ocupadas: ${occupied} | Disponibles: ${available}`, margin, yPos);
        yPos += 15;

        // ============================================
        // TABLA DE RESERVAS
        // ============================================
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(33, 37, 41);

        // Anchos de columnas
        const colWidths = [35, 30, 55, 60];
        const headers = ['Horario', 'Sillón', 'Paciente', 'Email'];
        let xPos = margin;

        // Encabezados de tabla
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
        });

        yPos += 2;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        // Ordenar reservas por slot_index
        const sortedBookings = [...bookings].sort((a, b) => a.slot_index - b.slot_index);

        // Datos de la tabla
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);

        sortedBookings.forEach((booking, index) => {
            // Verificar si necesitamos una nueva página
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = 20;

                // Repetir encabezados en nueva página
                doc.setFont(undefined, 'bold');
                doc.setFontSize(10);
                xPos = margin;
                headers.forEach((header, i) => {
                    doc.text(header, xPos, yPos);
                    xPos += colWidths[i];
                });
                yPos += 2;
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 6;
                doc.setFont(undefined, 'normal');
                doc.setFontSize(9);
            }

            xPos = margin;

            // Alternar color de fondo para filas
            if (index % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(margin - 2, yPos - 5, pageWidth - 2 * margin + 4, 7, 'F');
            }

            // Horario
            doc.setTextColor(33, 37, 41);
            doc.text(booking.time_slot, xPos, yPos);
            xPos += colWidths[0];

            // Sillón con color
            const chairColors = {
                rojo: [220, 53, 69],
                azul: [13, 110, 253],
                amarillo: [255, 193, 7]
            };
            const chairText = booking.chair.charAt(0).toUpperCase() + booking.chair.slice(1);
            doc.setTextColor(...chairColors[booking.chair]);
            doc.text(`● ${chairText}`, xPos, yPos);
            xPos += colWidths[1];

            // Paciente
            doc.setTextColor(33, 37, 41);
            doc.text(booking.patient_name, xPos, yPos);
            xPos += colWidths[2];

            // Email
            doc.setTextColor(108, 117, 125);
            doc.text(booking.patient_email, xPos, yPos);

            yPos += 7;
        });

        // ============================================
        // PIE DE PÁGINA
        // ============================================
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);

            // Línea superior del pie
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

            // Texto del pie
            const footerText = `Generado el ${new Date().toLocaleString('es-ES')} - Página ${i} de ${pageCount}`;
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // ============================================
        // DESCARGAR PDF
        // ============================================
        const fileName = `reservas_${nextFriday}.pdf`;
        doc.save(fileName);

        alert(`✅ PDF generado correctamente\n\nArchivo: ${fileName}\nReservas incluidas: ${bookings.length}`);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}


// ============================================
// RESET DE RESERVAS
// ============================================
async function resetAllBookings() {
    if (!confirm('¿Estás seguro de que quieres eliminar TODAS las reservas? Esta acción no se puede deshacer.')) return;

    try {
        // Eliminar todas las reservas una por una
        const allBookings = getAllBookings();
        for (const booking of allBookings) {
            await deleteBooking(booking.id);
        }

        await loadBookings();
        renderAdminPanel();
        renderCalendar();
        renderSlots();

        alert('Todas las reservas han sido eliminadas.');
    } catch (error) {
        alert('Error al eliminar reservas: ' + error.message);
    }
}

async function resetDateBookings() {
    const date = prompt('Introduce la fecha a resetear (formato: YYYY-MM-DD, ejemplo: 2025-01-10):');

    if (!date) return;

    try {
        await loadBookings(date);
        const bookingsToDelete = getBookingsForDate(date);

        if (bookingsToDelete.length === 0) {
            alert('No hay reservas para esa fecha.');
            return;
        }

        if (!confirm(`¿Eliminar todas las reservas del ${formatDateLong(date)}?`)) return;

        for (const booking of bookingsToDelete) {
            await deleteBooking(booking.id);
        }

        await loadBookings();
        renderAdminPanel();
        renderCalendar();

        if (AppState.selectedDate === date) {
            await loadBookings(date);
            renderSlots();
        }

        alert('Reservas eliminadas correctamente.');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar modales
    bookingModalInstance = new bootstrap.Modal(document.getElementById('bookingModal'));
    editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));
    adminLoginModalInstance = new bootstrap.Modal(document.getElementById('adminLoginModal'));

    // Event listeners - Navegación y Autenticación
    document.getElementById('btnLogin').addEventListener('click', showAdminLogin);
    document.getElementById('btnLogout').addEventListener('click', handleLogout);

    // Event listeners - Calendario
    document.getElementById('btnPrevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('btnNextMonth').addEventListener('click', () => changeMonth(1));

    // Event listeners - Reserva
    document.getElementById('confirmBooking').addEventListener('click', confirmBooking);
    document.getElementById('btnDelete').addEventListener('click', deleteByEmail);

    // Event listeners - Admin
    document.getElementById('btnExport').addEventListener('click', exportToExcel);
    document.getElementById('btnExportPDF').addEventListener('click', exportNextFridayToPDF);
    document.getElementById('btnResetAll').addEventListener('click', resetAllBookings);
    document.getElementById('btnResetDate').addEventListener('click', resetDateBookings);
    document.getElementById('saveEditBooking').addEventListener('click', saveEditBooking);

    // Event listeners - Admin Login
    document.getElementById('btnAdminLogin').addEventListener('click', attemptAdminLogin);
    document.getElementById('adminPasswordInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptAdminLogin();
    });

    // Event listener - Modal close
    document.getElementById('adminLoginModal').addEventListener('hidden.bs.modal', () => {
        // No hacer nada especial al cerrar el modal
    });

    // Cargar reservas iniciales
    await loadBookings();

    // Renderizado inicial
    renderCalendar();
    renderSlots();

    // Inicializar UI de autenticación
    updateUIForAuthState();

    // Vista inicial siempre es usuario
    switchView('user');
});
