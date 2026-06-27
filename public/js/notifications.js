// ============================================================
// SISTEMA DE NOTIFICACIONES Y FIREBASE — Sistema Discoteca
// ============================================================

const Notificaciones = {
  _pendientes: { cajero: [], bartender: [], cocinero: [], garzon: [], admin: [] },

  notificarNuevoPedido(pedido) {
    const data = {
      tipo: 'nuevo_pedido',
      mensaje: `Mesa ${pedido.mesaNum} — ${pedido.garzonNombre} — Bs. ${pedido.total}`,
      pedidoId: pedido.id,
      hora: getTimeStr()
    };
    if (typeof db !== 'undefined') db.ref('notificaciones/cajero').push(data);
    else this._pendientes.cajero.push(data);
  },

  notificarPagoConfirmado(pedido) {
    if (pedido.notificarBar) {
      const data = {
        tipo: 'preparar_bebidas',
        mensaje: `Mesa ${pedido.mesaNum} — Preparar bebidas`,
        pedidoId: pedido.id,
        hora: getTimeStr()
      };
      if (typeof db !== 'undefined') db.ref('notificaciones/bartender').push(data);
      else this._pendientes.bartender.push(data);
    }
    if (pedido.notificarCocina) {
      const data = {
        tipo: 'preparar_comida',
        mensaje: `Mesa ${pedido.mesaNum} — Preparar comida`,
        pedidoId: pedido.id,
        hora: getTimeStr()
      };
      if (typeof db !== 'undefined') db.ref('notificaciones/cocinero').push(data);
      else this._pendientes.cocinero.push(data);
    }
  },

  notificarPedidoListo(pedido) {
    const data = {
      tipo: 'pedido_listo',
      mensaje: `Mesa ${pedido.mesaNum} — ¡Listo para retirar!`,
      pedidoId: pedido.id,
      hora: getTimeStr()
    };
    if (typeof db !== 'undefined') db.ref('notificaciones/garzon').push(data);
    else this._pendientes.garzon.push(data);
  },

  obtenerPendientes(rol) {
    return this._pendientes[rol] || [];
  },

  limpiar(rol) {
    if (typeof db !== 'undefined') db.ref('notificaciones/' + rol).remove();
    this._pendientes[rol] = [];
  },

  contarPendientes(rol) {
    return (this._pendientes[rol] || []).length;
  }
};

// --- Firebase Listeners para Notificaciones ---
if (typeof db !== 'undefined') {
  db.ref('notificaciones').on('value', snap => {
    const data = snap.val() || {};
    Notificaciones._pendientes = {
      cajero: data.cajero ? Object.values(data.cajero) : [],
      bartender: data.bartender ? Object.values(data.bartender) : [],
      cocinero: data.cocinero ? Object.values(data.cocinero) : [],
      garzon: data.garzon ? Object.values(data.garzon) : [],
      admin: data.admin ? Object.values(data.admin) : []
    };
    
    // Actualizar badges UI
    if (typeof renderNotificationBadge === 'function') {
      if (currentUser && currentUser.rol) renderNotificationBadge(currentUser.rol);
    }
  });
}
