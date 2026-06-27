// ============================================================
// BAR — Sistema Discoteca
// Panel del bartender
// ============================================================

function renderBar() {
  const pedidos = DB.pedidos.filter(p => p.estado === 'caja_confirmada' && p.notificarBar && !p.barListo);
  const container = document.getElementById('bar-pedidos');
  if (pedidos.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">✅</div><p>Sin pedidos pendientes</p></div></div>';
    return;
  }
  container.innerHTML = pedidos.map(p => {
    const bebidas = p.productos.filter(pr => {
      const prod = DB.productos.find(x => x.nombre === pr.nombre);
      return prod && prod.categoria !== 'Comida';
    });
    return `<div class="card" style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">👤 ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--green);">✅ Pago confirmado</span>
      </div>
      <div style="margin-bottom:12px;">${bebidas.map(b => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">${b.qty}x ${b.nombre}</div>`).join('')}</div>
      ${p.nota ? `<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">📝 ${p.nota}</div>` : ''}
      <button class="btn btn-success" onclick="barListo(${p.id})">✅ Listo — Entregado al garzón</button>
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
    });
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
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">🕒</div><p>Aún no has preparado bebidas hoy</p></div></div>';
    return;
  }
  container.innerHTML = entregados.reverse().map(p => {
    const bebidas = p.productos.filter(pr => {
      const prod = DB.productos.find(x => x.nombre === pr.nombre);
      return prod && prod.categoria !== 'Comida';
    });
    return `<div class="card" style="margin-bottom:12px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">👤 ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--text2);">${p.fecha} ${p.horaBar}</span>
      </div>
      <div style="margin-bottom:12px;">${bebidas.map(b => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">${b.qty}x ${b.nombre}</div>`).join('')}</div>
      <div style="font-size:12px;color:var(--green);">✅ Preparado por ${p.bartenderNombre}</div>
    </div>`;
  }).join('');
}
