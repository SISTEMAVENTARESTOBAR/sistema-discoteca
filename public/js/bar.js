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
        <strong>Mesa ${p.mesaNum} — ${p.garzonNombre}</strong>
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
  pedido.barListo = true;
  pedido.bartenderNombre = currentUser.nombre;
  pedido.horaBar = getTimeStr();
  checkTodoListo(pedidoId);
  addLog(`Bar preparó pedido Mesa ${pedido.mesaNum}`);
  renderBar();
}
