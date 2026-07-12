// ============================================================
// COCINA — Sistema Discoteca
// Panel de las cocineras
// ============================================================

function _productoEsComida(pr) {
  const prod = DB.productos.find(x => x.id === pr.id);
  return prod && prod.categoria === 'Comida';
}

function renderCocina() {
  const pedidos = DB.pedidos.filter(p => p.estado === 'caja_confirmada' && p.notificarCocina && !p.cocinaListo);
  const container = document.getElementById('cocina-pedidos');
  if (pedidos.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('checkCircle', 40, 'icon-success') + '</div><p>Sin pedidos pendientes</p></div></div>';
    return;
  }
  container.innerHTML = pedidos.map(p => {
    const comidas = p.productos.filter(_productoEsComida);
    return `<div class="card" style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--green);">${icon('checkCircle', 12, 'icon-success')} Pago confirmado</span>
      </div>
      <div style="margin-bottom:12px;">${comidas.map(c => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">${c.qty}x ${c.nombre}</div>`).join('')}</div>
      ${p.nota ? `<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">${icon('note', 11)} ${p.nota}</div>` : ''}
      <button class="btn btn-success" onclick="cocinaListo(${p.id})">${icon('check', 13)} Listo — Entregado al garzón</button>
    </div>`;
  }).join('');
}

function cocinaListo(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  const updates = {
    cocinaListo: true,
    cocineroNombre: currentUser.nombre,
    horaCocina: getTimeStr()
  };

  Object.assign(pedido, updates);

  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedidoId).update(updates).then(() => {
      checkTodoListo(pedidoId);
    }).catch(e => console.error(e));
  } else {
    checkTodoListo(pedidoId);
  }
  
  addLog(`Cocina preparó pedido Mesa ${pedido.mesaNum}`);
  renderCocina();
}

function renderCocinaHistorial() {
  const hoy = getTodayStr();
  const entregados = DB.pedidos.filter(p => p.notificarCocina && p.cocinaListo && p.fecha === hoy);
  const container = document.getElementById('historial-cocina-list');
  if (entregados.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('clock', 40, 'icon-muted') + '</div><p>Aún no has preparado comidas hoy</p></div></div>';
    return;
  }
  container.innerHTML = entregados.reverse().map(p => {
    const comidas = p.productos.filter(_productoEsComida);
    return `<div class="card" style="margin-bottom:12px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--text2);">${p.fecha} ${p.horaCocina || p.horacocina || ''}</span>
      </div>
      <div style="margin-bottom:12px;">${comidas.map(c => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">${c.qty}x ${c.nombre}</div>`).join('')}</div>
      <div style="font-size:12px;color:var(--green);">${icon('checkCircle', 12, 'icon-success')} Preparado por ${p.cocineroNombre || p.cocineraNombre || ''}</div>
    </div>`;
  }).join('');
}

function checkTodoListo(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  if (pedido.barListo && pedido.cocinaListo && pedido.estado !== 'listo') {
    if (typeof db !== 'undefined') {
      db.ref('pedidos/' + pedido.id).update({ estado: 'listo' }).catch(e => console.error(e));
      const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
      if (mesa) db.ref('mesas/' + mesa.id).update({ estado: 'listo' }).catch(e => console.error(e));
    } else {
      pedido.estado = 'listo';
      const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
      if (mesa) mesa.estado = 'listo';
    }
    Notificaciones.notificarPedidoListo(pedido);
  }
}
