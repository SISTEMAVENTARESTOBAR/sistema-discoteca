// ============================================================
// NAVEGACIÓN — Sistema Discoteca
// ============================================================

const ICONS = {
  home: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  ventas: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M12 12v-8"/><path d="M8 8l4-4 4 4"/></svg>',
  alert: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
  log: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M4 15l4-4 4 4"/><path d="M8 11v11"/></svg>',
  cierre: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  users: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  menu: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="12" x2="12" y1="2" y2="8"/></svg>',
  mesas: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  panel: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/><circle cx="12" cy="14" r="4"/><path d="M12 12v2l1.5 1.5"/></svg>',
  historial: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/><circle cx="18" cy="18" r="5"/><path d="M18 15v3l2 2"/></svg>'
};

const NAV_CONFIG = {
  admin: [
    { section: 'Principal', items: [
      { icon: ICONS.home, label: 'Dashboard', page: 'page-dashboard' },
      { icon: ICONS.ventas, label: 'Ventas', page: 'page-ventas' },
      { icon: ICONS.alert, label: 'Anulaciones', page: 'page-anulaciones' },
    ]},
    { section: 'Reportes', items: [
      { icon: ICONS.log, label: 'Log de acciones', page: 'page-log' },
      { icon: ICONS.cierre, label: 'Cierre de caja', page: 'page-cierre' },
    ]},
    { section: 'Configuración', items: [
      { icon: ICONS.users, label: 'Usuarios', page: 'page-usuarios' },
      { icon: ICONS.menu, label: 'Menú', page: 'page-menu' },
    ]},
  ],
  garzon: [
    { section: 'Trabajo', items: [
      { icon: ICONS.mesas, label: 'Mis mesas', page: 'page-mesas-garzon' },
      { icon: ICONS.historial, label: 'Historial', page: 'page-garzon-historial' },
    ]},
  ],
  bartender: [
    { section: 'Trabajo', items: [
      { icon: ICONS.panel, label: 'Panel del Bar', page: 'page-bar' },
      { icon: ICONS.historial, label: 'Historial', page: 'page-bar-historial' },
    ]},
  ],
  cajero: [
    { section: 'Trabajo', items: [
      { icon: ICONS.panel, label: 'Panel de Caja', page: 'page-caja' },
      { icon: ICONS.historial, label: 'Historial', page: 'page-caja-historial' },
    ]},
  ],
  cocinero: [
    { section: 'Trabajo', items: [
      { icon: ICONS.panel, label: 'Cocina', page: 'page-cocina' },
      { icon: ICONS.historial, label: 'Historial', page: 'page-cocina-historial' },
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
  if (pageId === 'page-bar-historial') renderBarHistorial();
  if (pageId === 'page-cocina') renderCocina();
  if (pageId === 'page-cocina-historial') renderCocinaHistorial();
  if (pageId === 'page-caja') renderCaja();
  if (pageId === 'page-caja-historial') renderCajaHistorial();
}
