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

// --- Funciones UI para Notificaciones y Sincronización ---
function mostrarToast(titulo, mensaje) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<div class="toast-title">🔔 ${titulo}</div><div class="toast-msg">${mensaje}</div>`;
  container.appendChild(toast);
  
  // Animar entrada
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  
  // Remover después de 4 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
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

// --- Firebase Listeners para Notificaciones ---
if (typeof db !== 'undefined') {
  // Listener de conexión
  db.ref('.info/connected').on('value', snap => {
    updateSyncStatus(snap.val() === true);
  });

  db.ref('notificaciones').on('value', snap => {
    const data = snap.val() || {};
    
    const prevCajero = Notificaciones._pendientes.cajero.length;
    const prevBartender = Notificaciones._pendientes.bartender.length;
    const prevCocinero = Notificaciones._pendientes.cocinero.length;
    const prevGarzon = Notificaciones._pendientes.garzon.length;

    Notificaciones._pendientes = {
      cajero: data.cajero ? Object.values(data.cajero) : [],
      bartender: data.bartender ? Object.values(data.bartender) : [],
      cocinero: data.cocinero ? Object.values(data.cocinero) : [],
      garzon: data.garzon ? Object.values(data.garzon) : [],
      admin: data.admin ? Object.values(data.admin) : []
    };
    
    // Si hay un usuario logueado, chequear si hay notificaciones nuevas para su rol
    if (typeof currentUser !== 'undefined' && currentUser) {
      const rol = currentUser.rol;
      const arr = Notificaciones._pendientes[rol] || [];
      let prevCount = 0;
      if (rol === 'cajero') prevCount = prevCajero;
      else if (rol === 'bartender') prevCount = prevBartender;
      else if (rol === 'cocinero') prevCount = prevCocinero;
      else if (rol === 'garzon') prevCount = prevGarzon;

      if (arr.length > prevCount) {
        // Mostrar toast del último elemento
        const lastNotif = arr[arr.length - 1];
        mostrarToast("Nueva Notificación", lastNotif.mensaje);
        
        // Intentar reproducir sonido de notificación si es posible
        try {
          let audioSrc = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
          
          // Usar el sonido personalizado cuando el pedido está listo para el garzón
          if (lastNotif.tipo === 'pedido_listo' || rol === 'garzon') {
            audioSrc = 'audio/notification.wav';
          }
          
          const audio = new Audio(audioSrc);
          audio.volume = 1.0;
          audio.play().catch(e => console.log('Autoplay prevent:', e));
        } catch(e) {}
      }
      
      // Actualizar badges UI
      if (typeof renderNotificationBadge === 'function') {
        renderNotificationBadge(rol);
      }
    }
  });
}
