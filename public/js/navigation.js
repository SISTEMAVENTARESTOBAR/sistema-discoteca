// ============================================================
// NAVEGACIÓN — Sistema Discoteca
// ============================================================

const NAV_CONFIG = {
  admin: [
    { section: 'Principal', items: [
      { icon: '🏠', label: 'Dashboard', page: 'page-dashboard' },
      { icon: '🧾', label: 'Ventas', page: 'page-ventas' },
      { icon: '⚠️', label: 'Anulaciones', page: 'page-anulaciones' },
    ]},
    { section: 'Reportes', items: [
      { icon: '📋', label: 'Log de acciones', page: 'page-log' },
      { icon: '🔒', label: 'Cierre de caja', page: 'page-cierre' },
    ]},
    { section: 'Configuración', items: [
      { icon: '👥', label: 'Usuarios', page: 'page-usuarios' },
      { icon: '🍺', label: 'Menú', page: 'page-menu' },
    ]},
  ],
  garzon: [
    { section: 'Trabajo', items: [
      { icon: '🪑', label: 'Mis mesas', page: 'page-mesas-garzon' },
      { icon: '🕒', label: 'Historial', page: 'page-garzon-historial' },
    ]},
  ],
  bartender: [
    { section: 'Trabajo', items: [
      { icon: '🍺', label: 'Panel del Bar', page: 'page-bar' },
    ]},
  ],
  cajero: [
    { section: 'Trabajo', items: [
      { icon: '💰', label: 'Panel de Caja', page: 'page-caja' },
    ]},
  ],
  cocinero: [
    { section: 'Trabajo', items: [
      { icon: '👨🍳', label: 'Cocina', page: 'page-cocina' },
    ]},
  ],
};

function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  const drawerNav = document.getElementById('drawer-nav');
  nav.innerHTML = '';
  drawerNav.innerHTML = '';
  const config = NAV_CONFIG[currentUser.rol] || [];
  config.forEach(section => {
    const sec = document.createElement('div');
    sec.className = 'nav-section';
    sec.innerHTML = `<div class="nav-section-label">${section.section}</div>`;
    const dsec = document.createElement('div');
    dsec.className = 'nav-section';
    dsec.innerHTML = `<div class="nav-section-label">${section.section}</div>`;
    section.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      el.dataset.page = item.page;
      el.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
      el.onclick = () => showPage(item.page);
      sec.appendChild(el);
      const del2 = document.createElement('div');
      del2.className = 'nav-item';
      del2.dataset.page = item.page;
      del2.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
      del2.onclick = () => { showPage(item.page); closeDrawer(); };
      dsec.appendChild(del2);
    });
    nav.appendChild(sec);
    drawerNav.appendChild(dsec);
  });
}

function buildBottomNav() {
  const bn = document.getElementById('bottom-nav');
  bn.innerHTML = '';
  const config = NAV_CONFIG[currentUser.rol] || [];
  const allItems = config.flatMap(s => s.items).slice(0, 5);
  allItems.forEach(item => {
    const el = document.createElement('div');
    el.className = 'bottom-nav-item';
    el.dataset.page = item.page;
    el.innerHTML = `<span class="bn-icon">${item.icon}</span><span class="bn-label">${item.label}</span>`;
    el.onclick = () => showPage(item.page);
    bn.appendChild(el);
  });
}

function openDrawer() {
  document.getElementById('mobile-drawer').classList.add('open');
  document.getElementById('drawer-overlay').classList.add('open');
}

function closeDrawer() {
  document.getElementById('mobile-drawer').classList.remove('open');
  document.getElementById('drawer-overlay').classList.remove('open');
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.bottom-nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  document.querySelectorAll(`.nav-item[data-page="${pageId}"]`).forEach(n => n.classList.add('active'));
  document.querySelectorAll(`.bottom-nav-item[data-page="${pageId}"]`).forEach(n => n.classList.add('active'));
  const mc = document.querySelector('.main-content');
  if (mc) mc.scrollTop = 0;
  renderPage(pageId);
}

function renderPage(pageId) {
  if (pageId === 'page-dashboard') renderDashboard();
  if (pageId === 'page-ventas') renderVentas();
  if (pageId === 'page-anulaciones') renderAnulaciones();
  if (pageId === 'page-log') renderLog();
  if (pageId === 'page-cierre') renderCierreHistorial();
  if (pageId === 'page-usuarios') renderUsuarios();
  if (pageId === 'page-menu') renderMenu();
  if (pageId === 'page-mesas-garzon') renderMesasGarzon();
  if (pageId === 'page-garzon-historial') renderGarzonHistorial();
  if (pageId === 'page-bar') renderBar();
  if (pageId === 'page-cocina') renderCocina();
  if (pageId === 'page-caja') renderCaja();
}
