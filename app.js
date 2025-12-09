// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================
const CONFIG = {
  ADMIN_PASSWORD: 'admin123',
  CHAIRS: ['rojo', 'azul', 'amarillo'],
  SLOT_DURATION_MIN: 40,
  START_TIME: { h: 15, m: 15 },
  END_TIME: { h: 20, m: 30 },
  STORAGE_KEY: 'bookings_v2'
};

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
const AppState = {
  currentView: 'user', // 'user' o 'admin'
  isAdminAuthenticated: false,
  selectedDate: null,
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  bookings: {} // { "2025-01-10": [{slotIndex, chair, name, email, time}] }
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

// ============================================
// GENERACIÓN DE SLOTS DE HORARIOS
// ============================================
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
// GESTIÓN DE DATOS (localStorage)
// ============================================
function loadBookings() {
  const data = localStorage.getItem(CONFIG.STORAGE_KEY);
  if (data) {
    try {
      AppState.bookings = JSON.parse(data);
    } catch (e) {
      console.error('Error loading bookings:', e);
      AppState.bookings = {};
    }
  }
}

function saveBookings() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(AppState.bookings));
}

function getBookingsForDate(dateStr) {
  return AppState.bookings[dateStr] || [];
}

function addBooking(dateStr, booking) {
  if (!AppState.bookings[dateStr]) {
    AppState.bookings[dateStr] = [];
  }
  AppState.bookings[dateStr].push(booking);
  saveBookings();
}

function removeBooking(dateStr, slotIndex, chair) {
  if (!AppState.bookings[dateStr]) return;
  AppState.bookings[dateStr] = AppState.bookings[dateStr].filter(
    b => !(b.slotIndex === slotIndex && b.chair === chair)
  );
  if (AppState.bookings[dateStr].length === 0) {
    delete AppState.bookings[dateStr];
  }
  saveBookings();
}

function updateBooking(dateStr, oldSlotIndex, oldChair, newBooking) {
  removeBooking(dateStr, oldSlotIndex, oldChair);
  addBooking(dateStr, newBooking);
}

function getAllBookings() {
  const allBookings = [];
  Object.keys(AppState.bookings).forEach(date => {
    AppState.bookings[date].forEach(booking => {
      allBookings.push({ ...booking, date });
    });
  });
  return allBookings.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.slotIndex - b.slotIndex;
  });
}

// ============================================
// NAVEGACIÓN ENTRE VISTAS
// ============================================
function switchView(view) {
  AppState.currentView = view;

  // Actualizar botones
  document.getElementById('btnUserView').classList.toggle('active', view === 'user');
  document.getElementById('btnAdminView').classList.toggle('active', view === 'admin');

  // Mostrar/ocultar vistas
  document.getElementById('userView').classList.toggle('hidden', view !== 'user');
  document.getElementById('adminView').classList.toggle('hidden', view !== 'admin');

  if (view === 'admin') {
    if (!AppState.isAdminAuthenticated) {
      showAdminLogin();
    } else {
      renderAdminPanel();
    }
  }
}

// ============================================
// AUTENTICACIÓN DE ADMINISTRADOR
// ============================================
let adminLoginModalInstance;

function showAdminLogin() {
  document.getElementById('adminPasswordInput').value = '';
  document.getElementById('adminPasswordInput').classList.remove('is-invalid');
  adminLoginModalInstance.show();
}

function attemptAdminLogin() {
  const password = document.getElementById('adminPasswordInput').value;

  if (password === CONFIG.ADMIN_PASSWORD) {
    AppState.isAdminAuthenticated = true;
    adminLoginModalInstance.hide();
    renderAdminPanel();
  } else {
    document.getElementById('adminPasswordInput').classList.add('is-invalid');
  }
}

// ============================================
// CALENDARIO
// ============================================
function renderCalendar() {
  const container = document.getElementById('calendarGrid');
  container.innerHTML = '';

  // Actualizar título del mes
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  document.getElementById('currentMonth').textContent =
    `${monthNames[AppState.currentMonth]} ${AppState.currentYear}`;

  // Primer día del mes
  const firstDay = new Date(AppState.currentYear, AppState.currentMonth, 1);
  const lastDay = new Date(AppState.currentYear, AppState.currentMonth + 1, 0);

  // Días de la semana (empezar en lunes)
  const dayHeaders = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    container.appendChild(header);
  });

  // Calcular offset (lunes = 0)
  let startOffset = firstDay.getDay() - 1;
  if (startOffset === -1) startOffset = 6; // Domingo

  // Días del mes anterior
  for (let i = 0; i < startOffset; i++) {
    const emptyDay = document.createElement('div');
    emptyDay.className = 'calendar-day other-month';
    container.appendChild(emptyDay);
  }

  // Días del mes actual
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

      // Indicador de reservas
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

function selectDate(dateStr) {
  AppState.selectedDate = dateStr;
  renderCalendar();
  renderSlots();

  // Scroll suave a los horarios
  document.getElementById('slotsSection').scrollIntoView({ behavior: 'smooth' });
}

// ============================================
// RENDERIZADO DE SLOTS (VISTA USUARIO)
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

  // Aplicar reservas a los slots
  bookings.forEach(b => {
    if (slots[b.slotIndex]) {
      slots[b.slotIndex].chairs[b.chair] = b;
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

    CONFIG.CHAIRS.forEach(chair => {
      const booking = slot.chairs[chair];
      const btn = document.createElement('button');
      btn.className = 'btn chair ' + chair;

      if (booking) {
        btn.innerHTML = `<strong>${chair.charAt(0).toUpperCase() + chair.slice(1)}</strong><br><small>${booking.name}</small>`;
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

function confirmBooking() {
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

  // Verificar disponibilidad
  const bookings = getBookingsForDate(AppState.selectedDate);
  const exists = bookings.find(b => b.slotIndex === slotIndex && b.chair === chair);

  if (exists) {
    alert('Este sillón ya está reservado. Por favor, recarga la página.');
    bookingModalInstance.hide();
    renderSlots();
    return;
  }

  const slots = generateTimeSlots();
  const booking = {
    slotIndex,
    chair,
    name,
    email,
    time: timeToStr(slots[slotIndex].start)
  };

  addBooking(AppState.selectedDate, booking);
  renderSlots();
  renderCalendar(); // Actualizar indicador de reservas
  bookingModalInstance.hide();

  alert(`¡Reserva confirmada!\n\nFecha: ${formatDateLong(AppState.selectedDate)}\nHora: ${booking.time}\nSillón: ${chair}\nPaciente: ${name}\nEmail: ${email}`);
}

// ============================================
// ELIMINAR CITA POR EMAIL
// ============================================
function deleteByEmail() {
  const email = document.getElementById('deleteEmail').value.trim();

  if (!email) {
    alert('Por favor, introduce tu email.');
    return;
  }

  if (!validateEmail(email)) {
    alert('El email debe ser del dominio @alu.medac.es o @medac.es');
    return;
  }

  let removed = false;
  const datesToUpdate = [];

  Object.keys(AppState.bookings).forEach(date => {
    const initialLength = AppState.bookings[date].length;
    AppState.bookings[date] = AppState.bookings[date].filter(b => b.email !== email);

    if (AppState.bookings[date].length < initialLength) {
      removed = true;
      datesToUpdate.push(date);
    }

    if (AppState.bookings[date].length === 0) {
      delete AppState.bookings[date];
    }
  });

  if (!removed) {
    alert('No se encontró ninguna cita asociada a ese email.');
    return;
  }

  saveBookings();
  renderSlots();
  renderCalendar();
  document.getElementById('deleteEmail').value = '';

  alert('Tu(s) cita(s) ha(n) sido eliminada(s) correctamente.');
}

// ============================================
// PANEL DE ADMINISTRADOR
// ============================================
function renderAdminPanel() {
  const allBookings = getAllBookings();
  const tbody = document.getElementById('adminTableBody');
  tbody.innerHTML = '';

  if (allBookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay reservas registradas</td></tr>';
    updateAdminStats();
    return;
  }

  allBookings.forEach((booking, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${formatDateLong(booking.date)}</strong></td>
      <td>${booking.time}</td>
      <td><span class="badge-chair ${booking.chair}">${booking.chair.charAt(0).toUpperCase() + booking.chair.slice(1)}</span></td>
      <td>${booking.name}</td>
      <td>${booking.email}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editBooking('${booking.date}', ${booking.slotIndex}, '${booking.chair}')">
          Editar
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBookingAdmin('${booking.date}', ${booking.slotIndex}, '${booking.chair}')">
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
  const totalDates = Object.keys(AppState.bookings).length;

  document.getElementById('statsTotalBookings').textContent = allBookings.length;
  document.getElementById('statsTotalDates').textContent = totalDates;
}

// ============================================
// EDITAR CITA (ADMIN)
// ============================================
let editModalInstance;
let currentEditBooking = null;

function editBooking(date, slotIndex, chair) {
  const booking = AppState.bookings[date].find(b => b.slotIndex === slotIndex && b.chair === chair);
  if (!booking) return;

  currentEditBooking = { date, slotIndex, chair };

  document.getElementById('editDate').value = date;
  document.getElementById('editTime').value = booking.time;
  document.getElementById('editChair').value = chair;
  document.getElementById('editName').value = booking.name;
  document.getElementById('editEmail').value = booking.email;

  editModalInstance.show();
}

function saveEditBooking() {
  if (!currentEditBooking) return;

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

  const { date, slotIndex, chair } = currentEditBooking;
  const booking = AppState.bookings[date].find(b => b.slotIndex === slotIndex && b.chair === chair);

  if (booking) {
    booking.name = newName;
    booking.email = newEmail;
    saveBookings();
    renderAdminPanel();
    editModalInstance.hide();
    alert('Cita actualizada correctamente.');
  }
}

// ============================================
// ELIMINAR CITA (ADMIN)
// ============================================
function deleteBookingAdmin(date, slotIndex, chair) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta cita?')) return;

  removeBooking(date, slotIndex, chair);
  renderAdminPanel();
  renderCalendar();

  if (AppState.selectedDate === date) {
    renderSlots();
  }

  alert('Cita eliminada correctamente.');
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
    Fecha: formatDateLong(b.date),
    Horario: b.time,
    Sillón: b.chair.charAt(0).toUpperCase() + b.chair.slice(1),
    Nombre: b.name,
    Email: b.email
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reservas');
  XLSX.writeFile(wb, `reservas_higiene_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ============================================
// RESET DE RESERVAS
// ============================================
function resetAllBookings() {
  if (!confirm('¿Estás seguro de que quieres eliminar TODAS las reservas? Esta acción no se puede deshacer.')) return;

  AppState.bookings = {};
  saveBookings();
  renderAdminPanel();
  renderCalendar();
  renderSlots();

  alert('Todas las reservas han sido eliminadas.');
}

function resetDateBookings() {
  const date = prompt('Introduce la fecha a resetear (formato: YYYY-MM-DD, ejemplo: 2025-01-10):');

  if (!date) return;

  if (!AppState.bookings[date]) {
    alert('No hay reservas para esa fecha.');
    return;
  }

  if (!confirm(`¿Eliminar todas las reservas del ${formatDateLong(date)}?`)) return;

  delete AppState.bookings[date];
  saveBookings();
  renderAdminPanel();
  renderCalendar();

  if (AppState.selectedDate === date) {
    renderSlots();
  }

  alert('Reservas eliminadas correctamente.');
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Cargar datos
  loadBookings();

  // Inicializar modales
  bookingModalInstance = new bootstrap.Modal(document.getElementById('bookingModal'));
  editModalInstance = new bootstrap.Modal(document.getElementById('editModal'));
  adminLoginModalInstance = new bootstrap.Modal(document.getElementById('adminLoginModal'));

  // Event listeners - Navegación
  document.getElementById('btnUserView').addEventListener('click', () => switchView('user'));
  document.getElementById('btnAdminView').addEventListener('click', () => switchView('admin'));

  // Event listeners - Calendario
  document.getElementById('btnPrevMonth').addEventListener('click', () => changeMonth(-1));
  document.getElementById('btnNextMonth').addEventListener('click', () => changeMonth(1));

  // Event listeners - Reserva
  document.getElementById('confirmBooking').addEventListener('click', confirmBooking);
  document.getElementById('btnDelete').addEventListener('click', deleteByEmail);

  // Event listeners - Admin
  document.getElementById('btnExport').addEventListener('click', exportToExcel);
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
    if (!AppState.isAdminAuthenticated) {
      switchView('user');
    }
  });

  // Renderizado inicial
  renderCalendar();
  renderSlots();
  switchView('user');
});
