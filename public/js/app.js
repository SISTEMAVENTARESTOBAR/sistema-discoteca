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

function initAllIcons() {
  // Helper: inject SVG with explicit size
  function sizedSvg(name, size) {
    let svg = ICONS[name] || '';
    if (svg) svg = svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
    return svg;
  }

  // Logo icons
  const setLogo = (id, size) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = sizedSvg('moon', size);
  };
  setLogo('login-logo-icon', 32);
  setLogo('logo-mini-1', 18);
  setLogo('logo-mini-2', 18);
  setLogo('logo-mini-3', 14);

  // Drawer button
  const btnDrawer = document.getElementById('btn-drawer-icon');
  if (btnDrawer) btnDrawer.innerHTML = sizedSvg('menu', 20);

  // Logout buttons
  const setLogout = (id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `${sizedSvg('logout', 16)} Cerrar sesión`;
  };
  setLogout('logout-drawer');
  setLogout('logout-sidebar');

  // Stat icons - dashboard
  const setStatIcon = (id, iconName, cls) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(iconName, 22, cls);
  };
  setStatIcon('stat-icon-1', 'dollarSign', 'icon-accent');
  setStatIcon('stat-icon-2', 'cash', 'icon-success');
  setStatIcon('stat-icon-3', 'smartphone', 'icon-info');
  setStatIcon('stat-icon-4', 'alertTriangle', 'icon-danger');
  setStatIcon('stat-icon-5', 'dollarSign', 'icon-success');
  setStatIcon('stat-icon-6', 'cash', 'icon-success');
  setStatIcon('stat-icon-7', 'smartphone', 'icon-info');

  // Alert icons
  const setAlertIcon = (id, iconName, cls) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(iconName, 16, cls);
  };
  setAlertIcon('alert-icon-anulaciones', 'alertTriangle', 'icon-warning');

  // Cierre title icon
  const cierreTitle = document.getElementById('cierre-title');
  if (cierreTitle) cierreTitle.innerHTML = `${sizedSvg('lock', 16)} Cierre de Caja`;

  // Cierre confirm button
  const btnCierre = document.getElementById('btn-confirmar-cierre');
  if (btnCierre) btnCierre.innerHTML = `${sizedSvg('check', 16)} Confirmar cierre de caja`;

  // Cart title
  const cartTitle = document.getElementById('cart-title');
  if (cartTitle) cartTitle.innerHTML = `${sizedSvg('shoppingCart', 14)} Pedido`;

  // Cart empty icon
  const cartEmpty = document.getElementById('cart-empty-icon');
  if (cartEmpty) cartEmpty.innerHTML = icon('shoppingCart', 40, 'icon-muted');

  // Payment icons
  const setPayIcon = (id, iconName) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon(iconName, 22, 'icon-accent');
  };
  setPayIcon('pay-icon-efectivo', 'cash');
  setPayIcon('pay-icon-qr', 'smartphone');
  setPayIcon('pay-icon-mixto', 'creditCard');

  // Upload icons
  const setUploadIcon = (id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = icon('upload', 28, 'icon-muted');
  };
  setUploadIcon('qr-upload-icon');
  setUploadIcon('mixto-upload-icon');

  // Modal caja title
  const modalCajaTitle = document.getElementById('modal-caja-title');
  if (modalCajaTitle && !modalCajaTitle.textContent.includes('Confirmar')) {
    modalCajaTitle.innerHTML = `${sizedSvg('cash', 16)} Confirmar Cobro`;
  }
}

// --- Inicialización al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
  initAllIcons();

  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && document.getElementById('login-screen').style.display !== 'none') {
      doLogin();
    }
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(0);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(0);
      btn.style.setProperty('--ripple-x', x + '%');
      btn.style.setProperty('--ripple-y', y + '%');
    }
  });

  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  const checkSession = setInterval(() => {
    if (DB.usuarios.length > 0) {
      clearInterval(checkSession);
      _restaurarSesion();
    }
  }, 300);
});
