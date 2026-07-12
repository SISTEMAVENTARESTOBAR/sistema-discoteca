// ============================================================
// UTILIDADES — Sistema Discoteca
// ============================================================

function normalizeText(str) {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatShortName(fullName) {
  if (!fullName) return '';
  const words = fullName.trim().split(/\s+/);
  const formatted = words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return formatted.join(' ');
}

function getTimeStr() {
  return new Date().toTimeString().slice(0, 5);
}

function formatFechaLarga(str) {
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function metodoLabel(m) {
  return { efectivo: 'Efectivo', qr: 'QR', mixto: 'Mixto' }[m] || m;
}

function metodoIcon(m) {
  const map = { efectivo: 'cash', qr: 'smartphone', mixto: 'creditCard' };
  return icon(map[m] || 'dollarSign', 14);
}

function badgeEstado(estado) {
  const map = {
    pendiente: { icon: 'clock', label: 'Pendiente', cls: 'badge-pending' },
    caja_confirmada: { icon: 'checkCircle', label: 'Confirmado', cls: 'badge-paid' },
    listo: { icon: 'check', label: 'Listo', cls: 'badge-delivered' },
    entregado: { icon: 'check', label: 'Entregado', cls: 'badge-delivered' },
    anulado: { icon: 'xCircle', label: 'Anulado', cls: 'badge-cancelled' },
  };
  const e = map[estado] || { icon: 'clock', label: estado, cls: '' };
  return `<span class="badge ${e.cls}">${icon(e.icon, 12)} ${e.label}</span>`;
}

function getMinutesAgo(horaStr) {
  const [h, m] = horaStr.split(':').map(Number);
  const now = new Date();
  const then = new Date();
  then.setHours(h, m, 0, 0);
  return Math.floor((now - then) / 60000);
}

function addLog(accion) {
  if (typeof db !== 'undefined') {
    db.ref('log').push({
      fecha: getTodayStr(),
      hora: getTimeStr(),
      usuario: currentUser.nombre,
      rol: currentUser.rol,
      accion
    });
  } else {
    // Fallback if db is not loaded yet
    DB.log.push({
      fecha: getTodayStr(),
      hora: getTimeStr(),
      usuario: currentUser.nombre,
      rol: currentUser.rol,
      accion
    });
  }
}

function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('sys_theme', isLight ? 'light' : 'dark');
}

function rolLabel(rol) {
  return { admin: 'Administrador', garzon: 'Garzón', bartender: 'Bartender', cajero: 'Cajero', cocinero: 'Cocinero' }[rol] || rol;
}

function rolColor(rol) {
  return { admin: 'var(--accent)', garzon: 'var(--green)', bartender: 'var(--blue)', cajero: 'var(--yellow)', cocinero: 'var(--orange)' }[rol] || 'var(--text3)';
}

// --- Confirm dialog modal ---
let _confirmCallback = null;
let _promptCallback = null;

function mostrarConfirm(titulo, mensaje, callback) {
  _confirmCallback = callback;
  const modal = document.getElementById('modal-confirm-action');
  if (!modal) return;
  document.getElementById('modal-confirm-title').textContent = titulo;
  document.getElementById('modal-confirm-msg').innerHTML = mensaje;
  document.getElementById('btn-confirm-yes').onclick = () => {
    closeModal('modal-confirm-action');
    if (_confirmCallback) _confirmCallback(true);
    _confirmCallback = null;
  };
  document.getElementById('btn-confirm-no').onclick = () => {
    closeModal('modal-confirm-action');
    if (_confirmCallback) _confirmCallback(false);
    _confirmCallback = null;
  };
  openModal('modal-confirm-action');
}

function mostrarPrompt(titulo, placeholder, callback) {
  _promptCallback = callback;
  const modal = document.getElementById('modal-prompt-action');
  if (!modal) return;
  document.getElementById('modal-prompt-title').textContent = titulo;
  document.getElementById('modal-prompt-input').value = '';
  document.getElementById('modal-prompt-input').placeholder = placeholder;
  document.getElementById('btn-prompt-ok').onclick = () => {
    const val = document.getElementById('modal-prompt-input').value.trim();
    closeModal('modal-prompt-action');
    if (_promptCallback) _promptCallback(val || null);
    _promptCallback = null;
  };
  document.getElementById('btn-prompt-cancel').onclick = () => {
    closeModal('modal-prompt-action');
    if (_promptCallback) _promptCallback(null);
    _promptCallback = null;
  };
  openModal('modal-prompt-action');
  setTimeout(() => document.getElementById('modal-prompt-input').focus(), 100);
}
