// ============================================================
// BASE DE DATOS LOCAL Y FIREBASE — Sistema Discoteca
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCoozeW_RZEFYvYluDmTPA9og_jM2GYhOY",
  authDomain: "sistemarestobar-20d50.firebaseapp.com",
  databaseURL: "https://sistemarestobar-20d50-default-rtdb.firebaseio.com",
  projectId: "sistemarestobar-20d50",
  storageBucket: "sistemarestobar-20d50.firebasestorage.app",
  messagingSenderId: "827397542128",
  appId: "1:827397542128:web:0b02fe2a257b9cbad33235",
  measurementId: "G-B70YRH6F29"
};

// Initialize Firebase (Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const DB = {
  usuarios: [],
  productos: [],
  mesas: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    numero: i + 1,
    estado: 'libre',
    garzonId: null,
    pedidoId: null
  })), // default fallbacks
  pedidos: [],
  ventas: [],
  anulaciones: [],
  log: [],
  cierres: [],
  nextPedidoId: 1,
  nextVentaId: 1,
};

// --- Firebase Listeners ---
db.ref('usuarios').on('value', snap => {
  DB.usuarios = snap.val() ? Object.values(snap.val()) : [];
  if (typeof renderUsuarios === 'function' && document.getElementById('page-usuarios').classList.contains('active')) renderUsuarios();
});

db.ref('productos').on('value', snap => {
  DB.productos = snap.val() ? Object.values(snap.val()) : [];
  if (typeof renderMenu === 'function' && document.getElementById('page-menu').classList.contains('active')) renderMenu();
});

db.ref('mesas').on('value', snap => {
  if (snap.val()) DB.mesas = Object.values(snap.val());
  if (typeof renderMesasGarzon === 'function' && document.getElementById('page-mesas-garzon').classList.contains('active')) renderMesasGarzon();
});

db.ref('pedidos').on('value', snap => {
  DB.pedidos = snap.val() ? Object.values(snap.val()) : [];
  const nextId = Math.max(0, ...DB.pedidos.map(p => p.id)) + 1;
  DB.nextPedidoId = nextId;
  
  // Re-render active pages that depend on orders
  if (document.getElementById('page-mesas-garzon')?.classList.contains('active')) renderMesasGarzon();
  if (document.getElementById('page-caja')?.classList.contains('active')) renderCaja();
  if (document.getElementById('page-bar')?.classList.contains('active')) renderBar();
  if (document.getElementById('page-cocina')?.classList.contains('active')) renderCocina();
});

db.ref('ventas').on('value', snap => {
  DB.ventas = snap.val() ? Object.values(snap.val()) : [];
  const nextId = Math.max(0, ...DB.ventas.map(v => v.id)) + 1;
  DB.nextVentaId = nextId;
  if (document.getElementById('page-ventas')?.classList.contains('active')) renderVentas();
  if (document.getElementById('page-dashboard')?.classList.contains('active')) renderDashboard();
});

db.ref('anulaciones').on('value', snap => {
  DB.anulaciones = snap.val() ? Object.values(snap.val()) : [];
  if (document.getElementById('page-anulaciones')?.classList.contains('active')) renderAnulaciones();
});

db.ref('log').on('value', snap => {
  DB.log = snap.val() ? Object.values(snap.val()) : [];
  if (document.getElementById('page-log')?.classList.contains('active')) renderLog();
});

db.ref('cierres').on('value', snap => {
  DB.cierres = snap.val() ? Object.values(snap.val()) : [];
  if (document.getElementById('page-cierre')?.classList.contains('active')) renderCierreHistorial();
});

// Helper for initial population if DB is empty
db.ref('/').once('value', snap => {
  if (!snap.val()) {
    console.log("DB vacía, inicializando datos demo...");
    const initData = {
      usuarios: {
        "1": { id: 1, nombre: 'Administrador', usuario: 'admin', pass: 'admin123', rol: 'admin', activo: true },
        "2": { id: 2, nombre: 'Carlos Mamani', usuario: 'carlos', pass: '1234', rol: 'garzon', activo: true },
        "4": { id: 4, nombre: 'Juan Flores', usuario: 'juan', pass: '1234', rol: 'bartender', activo: true },
        "5": { id: 5, nombre: 'María López', usuario: 'maria', pass: '1234', rol: 'cajero', activo: true },
        "6": { id: 6, nombre: 'Roberto Chura', usuario: 'roberto', pass: '1234', rol: 'cocinero', activo: true }
      },
      productos: {
        "1": { id: 1, nombre: 'Paceña botella', precio: 15, categoria: 'Cervezas', activo: true },
        "10": { id: 10, nombre: 'Cubalibre', precio: 35, categoria: 'Tragos', activo: true },
        "13": { id: 13, nombre: 'Hamburguesa', precio: 35, categoria: 'Comida', activo: true }
      },
      mesas: DB.mesas.reduce((acc, m) => { acc[m.id] = m; return acc; }, {})
    };
    db.ref('/').set(initData);
  }
});
