// ============================================================
// APP PRINCIPAL — Sistema Discoteca
// Punto de entrada e inicialización
// ============================================================

function initApp() {
  const ini = currentUser.nombre[0].toUpperCase();

  // Sidebar user
  document.getElementById('sb-name').textContent = currentUser.nombre;
  document.getElementById('sb-role').textContent = rolLabel(currentUser.rol);
  document.getElementById('sb-avatar').textContent = ini;

  // Mobile topbar
  document.getElementById('topbar-avatar').textContent = ini;

  // Drawer
  document.getElementById('drawer-avatar').textContent = ini;
  document.getElementById('drawer-name').textContent = currentUser.nombre;
  document.getElementById('drawer-role').textContent = rolLabel(currentUser.rol);

  buildNav();
  buildBottomNav();

  // Ir a la primera página según rol
  const firstPage = {
    admin: 'page-dashboard',
    garzon: 'page-mesas-garzon',
    bartender: 'page-bar',
    cajero: 'page-caja',
    cocinero: 'page-cocina',
  }[currentUser.rol];
  showPage(firstPage);
}

// --- Inicialización al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
  // Enter key para login rápido
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') {
      doLogin();
    }
  });

  // Cerrar modales al hacer clic en el overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  // Estado inicial: mostrar login, ocultar app
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
});
