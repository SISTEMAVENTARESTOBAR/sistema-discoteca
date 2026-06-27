// ============================================================
// SISTEMA DE NOTIFICACIONES — Sistema Discoteca
// Actualmente usa eventos locales.
// Será reemplazado por Firebase Realtime Database listeners.
// ============================================================

const Notificaciones = {
  // Almacén de notificaciones pendientes por rol
  _pendientes: {
    cajero: [],
    bartender: [],
    cocinero: [],
    garzon: [],
    admin: []
  },

  // Notificar a la cajera que hay un nuevo pedido pendiente de cobro
  notificarNuevoPedido(pedido) {
    this._pendientes.cajero.push({
      tipo: 'nuevo_pedido',
      mensaje: `Mesa ${pedido.mesaNum} — ${pedido.garzonNombre} — Bs. ${pedido.total}`,
      pedidoId: pedido.id,
      hora: getTimeStr()
    });
    console.log(`[NOTIFICACIÓN → CAJERO] Nuevo pedido Mesa ${pedido.mesaNum}`);
    // TODO Firebase: db.ref('notificaciones/cajero').push(data)
  },

  // Notificar al bar y/o cocina que el pago fue confirmado
  notificarPagoConfirmado(pedido) {
    if (pedido.notificarBar) {
      this._pendientes.bartender.push({
        tipo: 'preparar_bebidas',
        mensaje: `Mesa ${pedido.mesaNum} — Preparar bebidas`,
        pedidoId: pedido.id,
        hora: getTimeStr()
      });
      console.log(`[NOTIFICACIÓN → BAR] Preparar bebidas Mesa ${pedido.mesaNum}`);
    }
    if (pedido.notificarCocina) {
      this._pendientes.cocinero.push({
        tipo: 'preparar_comida',
        mensaje: `Mesa ${pedido.mesaNum} — Preparar comida`,
        pedidoId: pedido.id,
        hora: getTimeStr()
      });
      console.log(`[NOTIFICACIÓN → COCINA] Preparar comida Mesa ${pedido.mesaNum}`);
    }
    // TODO Firebase: db.ref('notificaciones/bar').push(data)
    // TODO Firebase: db.ref('notificaciones/cocina').push(data)
  },

  // Notificar al garzón que el pedido está listo para retirar
  notificarPedidoListo(pedido) {
    this._pendientes.garzon.push({
      tipo: 'pedido_listo',
      mensaje: `Mesa ${pedido.mesaNum} — ¡Listo para retirar!`,
      pedidoId: pedido.id,
      hora: getTimeStr()
    });
    console.log(`[NOTIFICACIÓN → GARZÓN] Pedido listo Mesa ${pedido.mesaNum}`);
    // TODO Firebase: db.ref('notificaciones/garzon').push(data)
  },

  // Obtener notificaciones pendientes para un rol
  obtenerPendientes(rol) {
    return this._pendientes[rol] || [];
  },

  // Limpiar notificaciones de un rol
  limpiar(rol) {
    this._pendientes[rol] = [];
  },

  // Contar pendientes para un rol
  contarPendientes(rol) {
    return (this._pendientes[rol] || []).length;
  }
};
