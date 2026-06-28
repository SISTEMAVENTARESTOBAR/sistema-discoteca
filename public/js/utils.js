// ============================================================
// UTILIDADES — Sistema Discoteca
// ============================================================

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getTimeStr() {
  return new Date().toTimeString().slice(0, 5);
}

function formatFechaLarga(str) {
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function metodoLabel(m) {
  return { efectivo: '💵 Efectivo', qr: '📱 QR', mixto: '💵📱 Mixto' }[m] || m;
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
      hora: getTimeStr(),
      usuario: currentUser.nombre,
      rol: currentUser.rol,
      accion
    });
  } else {
    // Fallback if db is not loaded yet
    DB.log.push({
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
