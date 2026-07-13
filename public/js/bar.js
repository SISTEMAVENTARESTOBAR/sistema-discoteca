// ============================================================
// BAR — Sistema Discoteca
// Panel del bartender
// ============================================================

function _productoEsBebida(pr) {
  const prod = DB.productos.find(x => x.id === pr.id);
  return prod && prod.categoria !== 'Comida';
}

function renderBar() {
  const pedidos = DB.pedidos.filter(p => p.estado === 'caja_confirmada' && p.notificarBar && !p.barListo);
  const container = document.getElementById('bar-pedidos');
  if (pedidos.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('checkCircle', 40, 'icon-success') + '</div><p>Sin pedidos pendientes</p></div></div>';
    return;
  }
  container.innerHTML = pedidos.map(p => {
    const bebidas = p.productos.filter(_productoEsBebida);
    return `<div class="card" style="margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <strong style="font-size:16px;">Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:14px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--green);">${icon('checkCircle', 12, 'icon-success')} Pago confirmado</span>
      </div>
      <div style="margin-bottom:14px;">${bebidas.map(b => `<div style="padding:8px 0;border-bottom:1px solid var(--border);font-size:16px;font-weight:500;">${b.qty}x <strong>${b.nombre}</strong></div>`).join('')}</div>
      ${p.nota ? `<div style="font-size:13px;color:var(--text3);margin-bottom:12px;padding:8px 10px;background:var(--bg2);border-radius:8px;">${icon('note', 13)} ${p.nota}</div>` : ''}
      <button class="btn btn-success" style="width:100%;padding:14px;font-size:15px;" onclick="barListo(${p.id})">${icon('check', 15)} Listo — Entregado al garzón</button>
    </div>`;
  }).join('');
}

function barListo(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  const updates = {
    barListo: true,
    bartenderNombre: currentUser.nombre,
    horaBar: getTimeStr()
  };
  
  // Siempre actualizar la copia local primero
  Object.assign(pedido, updates);
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedidoId).update(updates).then(() => {
      checkTodoListo(pedidoId);
    }).catch(e => console.error(e));
  } else {
    checkTodoListo(pedidoId);
  }
  
  addLog(`Bar preparó pedido Mesa ${pedido.mesaNum}`);
  renderBar();
}

function renderBarHistorial() {
  const hoy = getTodayStr();
  const entregados = DB.pedidos.filter(p => p.notificarBar && p.barListo && p.fecha === hoy);
  const container = document.getElementById('historial-bar-list');
  if (entregados.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('clock', 40, 'icon-muted') + '</div><p>Aún no has preparado bebidas hoy</p></div></div>';
    return;
  }
  container.innerHTML = entregados.reverse().map(p => {
    const bebidas = p.productos.filter(_productoEsBebida);
    return `<div class="card" style="margin-bottom:12px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:15px;">Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--text2);">${p.fecha} ${p.horaBar}</span>
      </div>
      <div style="margin-bottom:12px;">${bebidas.map(b => `<div style="padding:7px 0;border-bottom:1px solid var(--border);font-size:15px;font-weight:500;">${b.qty}x <strong>${b.nombre}</strong></div>`).join('')}</div>
      <div style="font-size:13px;color:var(--green);">${icon('checkCircle', 12, 'icon-success')} Preparado por ${p.bartenderNombre}</div>
    </div>`;
  }).join('');
}
