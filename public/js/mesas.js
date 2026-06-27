// ============================================================
// MESAS — Vista del Garzón — Sistema Discoteca
// ============================================================

function renderMesasGarzon() {
  const hoy = getTodayStr();
  const anulacionesHoy = DB.anulaciones.filter(a => a.garzonId === currentUser.id && a.fecha === hoy).length;
  const alertDiv = document.getElementById('alert-anulaciones-garzon');
  const msg = document.getElementById('anulaciones-msg');

  document.getElementById('garzon-info-header').textContent = `Bienvenido, ${currentUser.nombre} — ${formatFechaLarga(hoy)}`;

  if (anulacionesHoy > 0) {
    alertDiv.style.display = 'flex';
    msg.textContent = `${anulacionesHoy} de 3 permitidas esta noche`;
    alertDiv.className = `alert ${anulacionesHoy >= 3 ? 'alert-danger' : 'alert-warning'}`;
  } else {
    alertDiv.style.display = 'none';
  }

  const grid = document.getElementById('mesas-garzon-grid');
  grid.innerHTML = DB.mesas.map(m => {
    const pedido = DB.pedidos.find(p => p.mesaId === m.id && !['cobrado', 'anulado'].includes(p.estado));
    const esMia = m.garzonId === currentUser.id || !m.garzonId;
    const estadoLabel = { libre: 'Libre', esperando: 'Esperando caja', preparando: 'En preparación', listo: '¡Listo para retirar!', entregado: 'Entregado' }[m.estado] || m.estado;
    return `<div class="mesa-card ${m.estado}" onclick="clickMesa(${m.id})">
      <div class="mesa-dot"></div>
      <div class="mesa-num">${m.numero}</div>
      <div class="mesa-status">${estadoLabel}</div>
      ${m.garzonId && m.garzonId !== currentUser.id ? `<div class="mesa-garzon">${(DB.usuarios.find(u => u.id === m.garzonId) || {}).nombre || ''}</div>` : ''}
    </div>`;
  }).join('');

  // Pedidos activos del garzón
  const misPedidos = DB.pedidos.filter(p => p.garzonId === currentUser.id && !['cobrado', 'anulado', 'entregado'].includes(p.estado));
  const pa = document.getElementById('pedidos-activos-garzon');
  if (misPedidos.length === 0) {
    pa.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><p>Sin pedidos activos</p></div>';
  } else {
    pa.innerHTML = misPedidos.map(p => {
      const statusBadge = { pendiente: 'badge-pending', listo: 'badge-delivered', entregado: 'badge-paid' }[p.estado] || 'badge-pending';
      const estadoLabel = { pendiente: '🟡 Esperando caja', caja_confirmada: '🟠 En preparación', listo: '🟢 Listo para retirar', entregado: '🔵 Entregado a mesa' }[p.estado] || p.estado;
      const anulacionesHoy2 = DB.anulaciones.filter(a => a.garzonId === currentUser.id && a.fecha === hoy).length;
      const puedeAnular = anulacionesHoy2 < 3 && p.estado === 'pendiente';
      return `<div class="card card-sm" style="margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <strong style="font-size:14px;">Mesa ${p.mesaNum}</strong>
          <span style="font-size:12px;color:var(--text2);">${estadoLabel}</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:8px;">${p.productos.map(x => `${x.qty}x ${x.nombre}`).join(', ')}</div>
        ${p.nota ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">📝 ${p.nota}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-family:'Syne',sans-serif;">Bs. ${p.total}</strong>
          <div style="display:flex;gap:6px;">
            ${p.estado === 'listo' ? `<button class="btn btn-success btn-sm" onclick="marcarEntregadoMesa(${p.id})">✅ Entregado a mesa</button>` : ''}
            ${puedeAnular ? `<button class="btn btn-danger btn-sm" onclick="initAnular(${p.id})">Anular</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  }
}

function clickMesa(mesaId) {
  const mesa = DB.mesas.find(m => m.id === mesaId);
  if (!mesa) return;
  if (mesa.estado === 'libre') {
    openPedidoModal(mesaId);
  } else if (mesa.garzonId === currentUser.id) {
    showPage('page-mesas-garzon');
  }
}

function renderGarzonHistorial() {
  const hoy = getTodayStr();
  const misEntregados = DB.pedidos.filter(p => p.garzonId === currentUser.id && p.fecha === hoy && p.estado === 'entregado');
  const hist = document.getElementById('historial-garzon-list');
  if (misEntregados.length === 0) {
    hist.innerHTML = '<div class="empty-state"><div class="empty-icon">🕒</div><p>Aún no has entregado pedidos hoy</p></div>';
    return;
  }
  hist.innerHTML = misEntregados.reverse().map(p => `
    <div class="card card-sm" style="margin-bottom:10px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <strong style="font-size:14px;">Mesa ${p.mesaNum}</strong>
        <span style="font-size:12px;color:var(--green);">✅ Entregado a mesa</span>
      </div>
      <div style="font-size:12px;color:var(--text2);margin-bottom:8px;">${p.productos.map(x => `${x.qty}x ${x.nombre}`).join(', ')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-family:'Syne',sans-serif;">Bs. ${p.total}</strong>
        <span class="badge badge-${p.metodo}">${metodoLabel(p.metodo)}</span>
      </div>
    </div>
  `).join('');
}
