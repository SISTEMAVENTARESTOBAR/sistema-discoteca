// ============================================================
// BASE DE DATOS LOCAL — Sistema Discoteca
// Este archivo será reemplazado por Firebase Firestore/Realtime DB
// ============================================================

const DB = {
  usuarios: [
    { id: 1, nombre: 'Administrador', usuario: 'admin', pass: 'admin123', rol: 'admin', activo: true },
    { id: 2, nombre: 'Carlos Mamani', usuario: 'carlos', pass: '1234', rol: 'garzon', activo: true },
    { id: 3, nombre: 'Ana Quispe', usuario: 'ana', pass: '1234', rol: 'garzon', activo: true },
    { id: 4, nombre: 'Juan Flores', usuario: 'juan', pass: '1234', rol: 'bartender', activo: true },
    { id: 5, nombre: 'María López', usuario: 'maria', pass: '1234', rol: 'cajero', activo: true },
    { id: 6, nombre: 'Roberto Chura', usuario: 'roberto', pass: '1234', rol: 'cocinero', activo: true },
  ],
  productos: [
    { id: 1, nombre: 'Paceña botella', precio: 15, categoria: 'Cervezas', activo: true },
    { id: 2, nombre: 'Paceña Macanuda', precio: 18, categoria: 'Cervezas', activo: true },
    { id: 3, nombre: 'Huari botella', precio: 15, categoria: 'Cervezas', activo: true },
    { id: 4, nombre: 'Huari lata', precio: 12, categoria: 'Cervezas', activo: true },
    { id: 5, nombre: 'Coca-Cola 3L', precio: 25, categoria: 'Bebidas', activo: true },
    { id: 6, nombre: 'Coca-Cola 2L', precio: 18, categoria: 'Bebidas', activo: true },
    { id: 7, nombre: 'Monster 500ml', precio: 15, categoria: 'Bebidas', activo: true },
    { id: 8, nombre: 'Power 500ml', precio: 12, categoria: 'Bebidas', activo: true },
    { id: 9, nombre: 'Agua mineral', precio: 8, categoria: 'Bebidas', activo: true },
    { id: 10, nombre: 'Cubalibre', precio: 35, categoria: 'Tragos', activo: true },
    { id: 11, nombre: 'Vodka con jugo', precio: 35, categoria: 'Tragos', activo: true },
    { id: 12, nombre: 'Shot de tequila', precio: 20, categoria: 'Tragos', activo: true },
    { id: 13, nombre: 'Hamburguesa', precio: 35, categoria: 'Comida', activo: true },
    { id: 14, nombre: 'Papas fritas', precio: 25, categoria: 'Comida', activo: true },
    { id: 15, nombre: 'Anticucho', precio: 30, categoria: 'Comida', activo: true },
    { id: 16, nombre: 'Salteña', precio: 8, categoria: 'Comida', activo: true },
  ],
  mesas: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    numero: i + 1,
    estado: 'libre',
    garzonId: null,
    pedidoId: null
  })),
  pedidos: [],
  ventas: [],
  anulaciones: [],
  log: [],
  cierres: [],
  nextPedidoId: 1,
  nextVentaId: 1,
};

// --- Datos demo de prueba ---
DB.ventas = [
  { id: 1, mesa: 5, garzonId: 2, garzonNombre: 'Carlos Mamani', fecha: '2025-05-10', hora: '21:35', horaCierre: '21:55', productos: [{ nombre: 'Paceña botella', qty: 2, precio: 15 }, { nombre: 'Papas fritas', qty: 1, precio: 25 }], nota: '', total: 55, metodo: 'mixto', efectivo: 30, qr: 25, comprobante: null, cajeraId: 5, cajeraNombre: 'María López', horaCaja: '21:57', cambio: 0, bartenderNombre: 'Juan Flores', horaBar: '21:42', cocineraNombre: null, horacocina: null, estado: 'cobrado' },
  { id: 2, mesa: 2, garzonId: 3, garzonNombre: 'Ana Quispe', fecha: '2025-05-10', hora: '21:10', horaCierre: '21:40', productos: [{ nombre: 'Cubalibre', qty: 3, precio: 35 }], nota: 'con hielo', total: 105, metodo: 'qr', efectivo: 0, qr: 105, comprobante: null, cajeraId: 5, cajeraNombre: 'María López', horaCaja: '21:42', cambio: 0, bartenderNombre: 'Juan Flores', horaBar: '21:20', cocineraNombre: null, horacocina: null, estado: 'cobrado' },
  { id: 3, mesa: 1, garzonId: 2, garzonNombre: 'Carlos Mamani', fecha: '2025-05-10', hora: '20:50', horaCierre: '21:05', productos: [{ nombre: 'Huari lata', qty: 2, precio: 12 }, { nombre: 'Anticucho', qty: 1, precio: 30 }], nota: '', total: 54, metodo: 'efectivo', efectivo: 54, qr: 0, comprobante: null, cajeraId: 5, cajeraNombre: 'María López', horaCaja: '21:07', cambio: 6, bartenderNombre: 'Juan Flores', horaBar: '21:00', cocineraNombre: 'Roberto Chura', horacocina: '21:02', estado: 'cobrado' },
];
DB.nextVentaId = 4;
DB.anulaciones = [
  { id: 1, mesa: 3, garzonId: 2, garzonNombre: 'Carlos Mamani', fecha: '2025-05-10', hora: '22:11', monto: 60, motivo: 'El cliente se fue sin pagar' }
];
DB.log = [
  { hora: '20:50', usuario: 'Carlos Mamani', rol: 'garzon', accion: 'Abrió Mesa 1 y registró pedido' },
  { hora: '21:07', usuario: 'María López', rol: 'cajero', accion: 'Confirmó cobro Mesa 1 — Bs.54 efectivo' },
  { hora: '21:10', usuario: 'Ana Quispe', rol: 'garzon', accion: 'Abrió Mesa 2 y registró pedido' },
  { hora: '21:35', usuario: 'Carlos Mamani', rol: 'garzon', accion: 'Abrió Mesa 5 y registró pedido' },
];
