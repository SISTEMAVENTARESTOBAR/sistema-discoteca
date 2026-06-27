// ============================================================
// COCINA — Sistema Discoteca
// Panel de las cocineras
// ============================================================

function renderCocina() {
  const pedidos = DB.pedidos.filter(p => p.estado === 'caja_confirmada' && p.notificarCocina && !p.cocinaListo);
  const container = document.getElementById('cocina-pedidos');
  if (pedidos.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">✅</div><p>Sin pedidos pendientes</p></div></div>';
    return;
  }
  container.innerHTML = pedidos.map(p => {
    const comidas = p.productos.filter(pr => {
      const prod = DB.productos.find(x => x.nombre === pr.nombre);
      return prod && prod.categoria === 'Comida';
    });
    return `<div class="card" style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--green);">✅ Pago confirmado</span>
      </div>
      <div style="margin-bottom:12px;">${comidas.map(c => `<div style="padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">${c.qty}x ${c.nombre}</div>`).join('')}</div>
      ${p.nota ? `<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">📝 ${p.nota}</div>` : ''}
      <button class="btn btn-success" onclick="cocinaListo(${p.id})">✅ Listo — Entregado al garzón</button>
    </div>`;
  }).join('');
}

function cocinaListo(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  pedido.cocinaListo = true;
  pedido.cocineraNombre = currentUser.nombre;
  pedido.horacocina = getTimeStr();
  checkTodoListo(pedidoId);
  addLog(`Cocina preparó pedido Mesa ${pedido.mesaNum}`);
  renderCocina();
}

function checkTodoListo(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  if (pedido.barListo && pedido.cocinaListo) {
    pedido.estado = 'listo';
    const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
    if (mesa) mesa.estado = 'listo';
    // Notificar al garzón
    Notificaciones.notificarPedidoListo(pedido);
  }
}
