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

  notificarPedidoCajaDisponible(pedido) {
    const nombre = pedido.clienteNombre ? `Cliente: ${pedido.clienteNombre}` : 'Cliente mostrador';
    const data = {
      tipo: 'pedido_caja_disponible',
      mensaje: `📋 Pedido en caja — ${nombre} — Bs. ${pedido.total}`,
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

// --- Funciones UI para Notificaciones y Sincronización ---
function mostrarToast(titulo, mensaje) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<div class="toast-title">${titulo}</div><div class="toast-msg">${mensaje}</div>`;
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
  });
  
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function updateSyncStatus(connected) {
  const dot = document.getElementById('sync-dot');
  const text = document.getElementById('sync-text');
  if (dot && text) {
    if (connected) {
      dot.style.background = '#4caf50'; // verde
      text.innerText = 'Sincronizado';
    } else {
      dot.style.background = '#f44336'; // rojo
      text.innerText = 'Desconectado';
    }
  }
}

function forceSync() {
  if (typeof db !== 'undefined') {
    const text = document.getElementById('sync-text');
    if (text) text.innerText = 'Actualizando...';
    // Reconectar firebase
    firebase.database().goOffline();
    setTimeout(() => {
      firebase.database().goOnline();
    }, 500);
  }
}

// --- Audio Preload & Unlock ---
const audioGarzon = new Audio('audio/notification.wav');
const audioCajera = new Audio('audio/cajera.wav');
const audioGeneral = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

window.unlockAudioContext = function() {
  [audioGarzon, audioCajera, audioGeneral].forEach(a => {
    a.play().then(() => {
      a.pause();
      a.currentTime = 0;
    }).catch(e => {});
  });
};

function _reproducirSonidoNotif(tipo, rol) {
  try {
    if (tipo === 'pedido_listo' || rol === 'garzon') {
      audioGarzon.volume = 1.0;
      audioGarzon.play().catch(e => {});
    } else if (tipo === 'nuevo_pedido' || rol === 'cajero') {
      audioCajera.volume = 1.0;
      audioCajera.play().catch(e => {});
    } else {
      audioGeneral.volume = 1.0;
      audioGeneral.play().catch(e => {});
    }
  } catch(e) {}
}

function _escucharNotificaciones(rol, ruta) {
  db.ref('notificaciones/' + ruta).on('child_added', snap => {
    const notif = snap.val();
    if (!notif) return;
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.rol === rol) {
      Notificaciones._pendientes[rol].push(notif);
      mostrarToast('Nueva Notificación', notif.mensaje);
      _reproducirSonidoNotif(notif.tipo, rol);
    }
    snap.ref.remove().catch(e => console.error('Error limpiando notificación:', e));
  });
}

// --- Firebase Listeners para Notificaciones ---
if (typeof db !== 'undefined') {
  db.ref('.info/connected').on('value', snap => {
    updateSyncStatus(snap.val() === true);
  });

  _escucharNotificaciones('cajero', 'cajero');
  _escucharNotificaciones('bartender', 'bartender');
  _escucharNotificaciones('cocinero', 'cocinero');
  _escucharNotificaciones('garzon', 'garzon');
}
