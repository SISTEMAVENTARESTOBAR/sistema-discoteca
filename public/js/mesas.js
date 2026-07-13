// ============================================================
// MESAS — Vista del Garzón — Sistema Discoteca
// ============================================================

function renderMesasGarzon() {
  if (currentUser.rol !== 'garzon' && currentUser.rol !== 'admin') {
    document.getElementById('mesas-garzon-grid').innerHTML = '<div style="padding:20px;color:red;text-align:center;">Acceso Denegado</div>';
    return;
  }
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
    const pedidosMesa = DB.pedidos.filter(p => p.mesaId === m.id && !['cobrado', 'anulado', 'entregado'].includes(p.estado));
    let estadoVirtual = 'libre';
    if (pedidosMesa.length > 0) {
      if (pedidosMesa.some(p => p.estado === 'listo')) estadoVirtual = 'listo';
      else if (pedidosMesa.some(p => p.estado === 'caja_confirmada')) estadoVirtual = 'preparando';
      else estadoVirtual = 'esperando';
    }
    const estadoLabel = { libre: 'Libre', esperando: 'Esperando caja', preparando: 'En preparación', listo: '¡Listo para retirar!' }[estadoVirtual] || estadoVirtual;
    
    // Si hay garzones involucrados en los pedidos activos
    const garzonesActivos = [...new Set(pedidosMesa.map(p => p.garzonNombre))].join(', ');
    
    return `<div class="mesa-card ${estadoVirtual}" onclick="clickMesa(${m.id})">
      <div class="mesa-dot"></div>
      <div class="mesa-num">${m.numero}</div>
      <div class="mesa-status">${estadoLabel}</div>
      ${garzonesActivos ? `<div class="mesa-garzon">${garzonesActivos}</div>` : ''}
    </div>`;
  }).join('');

  // Pedidos activos del garzón
  const misPedidos = DB.pedidos.filter(p => p.garzonId === currentUser.id && !['cobrado', 'anulado', 'entregado'].includes(p.estado));
  const pa = document.getElementById('pedidos-activos-garzon');
  if (misPedidos.length === 0) {
    pa.innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('checkCircle', 40, 'icon-success') + '</div><p>Sin pedidos activos</p></div>';
  } else {
    pa.innerHTML = misPedidos.map(p => {
      const statusBadge = { pendiente: 'badge-pending', listo: 'badge-delivered', entregado: 'badge-paid' }[p.estado] || 'badge-pending';
      const estadoLabel = { pendiente: 'Esperando caja', caja_confirmada: 'En preparación', listo: 'Listo para retirar', entregado: 'Entregado a mesa' }[p.estado] || p.estado;
      const estadoColor = { pendiente: 'var(--yellow)', caja_confirmada: 'var(--orange)', listo: 'var(--green)', entregado: 'var(--blue)' }[p.estado] || 'var(--text2)';
      const anulacionesHoy2 = DB.anulaciones.filter(a => a.garzonId === currentUser.id && a.fecha === hoy).length;
      const puedeAnular = anulacionesHoy2 < 3 && p.estado === 'pendiente';
      return `<div class="card card-sm" style="margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <strong style="font-size:16px;">Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:14px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''}</strong>
          <span style="font-size:13px;color:${estadoColor};font-weight:600;">${estadoLabel}</span>
        </div>
        <div style="font-size:14px;color:var(--text2);margin-bottom:10px;">${p.productos.map(x => `<strong>${x.qty}x</strong> ${x.nombre}`).join(' &middot; ')}</div>
        ${p.nota ? `<div style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:6px 10px;background:var(--bg2);border-radius:8px;">${icon('note', 12)} ${p.nota}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-family:'Syne',sans-serif;font-size:16px;">Bs. ${p.total}</strong>
          <div style="display:flex;gap:6px;">
            ${p.estado === 'listo' ? `<button class="btn btn-success btn-sm" style="font-size:13px;padding:10px 14px;" onclick="marcarEntregadoMesa(${p.id})">${icon('check', 14)} Entregado a mesa</button>` : ''}
            ${puedeAnular ? `<button class="btn btn-danger btn-sm" style="font-size:13px;padding:10px 14px;" onclick="initAnular(${p.id})">Anular</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');
  }

  // Pedidos disponibles para recoger en caja (sin garzón asignado)
  const pedidosCaja = DB.pedidos.filter(p => p.origen === 'caja' && p.estado === 'caja_confirmada' && !p.garzonId);
  const pc = document.getElementById('pedidos-caja-disponibles');
  if (pedidosCaja.length === 0) {
    pc.innerHTML = '';
  } else {
    pc.innerHTML = `
      <h3 style="font-size:15px;margin:16px 0 12px;color:var(--accent);">${icon('bell', 14)} Pedidos para recoger en Caja</h3>
      ${pedidosCaja.map(p => `
        <div class="card card-sm" style="margin-bottom:10px;border-left:3px solid var(--accent);">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <strong style="font-size:15px;">${p.clienteNombre ? `<span style="color:var(--accent);margin-right:8px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''}Pedido #${String(p.id).slice(-5)}</strong>
            <span style="font-size:12px;color:var(--text3);">${p.fecha} ${p.horaCreacion}</span>
          </div>
          <div style="font-size:14px;color:var(--text2);margin-bottom:10px;">${p.productos.map(x => `<strong>${x.qty}x</strong> ${x.nombre}`).join(' &middot; ')}</div>
          ${p.nota ? `<div style="font-size:12px;color:var(--text3);margin-bottom:10px;padding:6px 10px;background:var(--bg2);border-radius:8px;">${icon('note', 12)} ${p.nota}</div>` : ''}
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong style="font-family:'Syne',sans-serif;font-size:16px;">Bs. ${p.total}</strong>
            <button class="btn btn-primary btn-sm" style="font-size:13px;padding:10px 14px;" onclick="reclamarPedidoCaja(${p.id})">${icon('user', 13)} Recoger pedido</button>
          </div>
        </div>
      `).join('')}
    `;
  }
}
function clickMesa(mesaId) {
  openPedidoModal(mesaId);
}

function reclamarPedidoCaja(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  if (pedido.garzonId) {
    mostrarToast('Error', 'Este pedido ya fue reclamado por otro garzón');
    return;
  }
  pedido.garzonId = currentUser.id;
  pedido.garzonNombre = currentUser.nombre;
  pedido.estado = 'pendiente';
  pedido.horaAsignacion = getTimeStr();

  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedidoId).update({
      garzonId: currentUser.id,
      garzonNombre: currentUser.nombre,
      estado: 'pendiente',
      horaAsignacion: getTimeStr()
    }).catch(e => console.error(e));
  }

  addLog(`Reclamó pedido en caja — ${pedido.clienteNombre || 'Cliente'} — Bs.${pedido.total}`);
  mostrarToast('Pedido reclamado', `Ahora eres responsable del pedido #${String(pedidoId).slice(-5)}`);
  renderMesasGarzon();
}

function renderGarzonHistorial() {
  const hoy = getTodayStr();
  const misEntregados = DB.pedidos.filter(p => p.garzonId === currentUser.id && p.fecha === hoy && p.estado === 'entregado');
  const hist = document.getElementById('historial-garzon-list');
  if (misEntregados.length === 0) {
    hist.innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('clock', 40, 'icon-muted') + '</div><p>Aún no has entregado pedidos hoy</p></div>';
    return;
  }
  hist.innerHTML = misEntregados.reverse().map(p => `
    <div class="card card-sm" style="margin-bottom:10px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong style="font-size:15px;">Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''}</strong>
        <span style="font-size:12px;color:var(--green);">${icon('checkCircle', 12, 'icon-success')} Entregado a mesa</span>
      </div>
      <div style="font-size:14px;color:var(--text2);margin-bottom:10px;">${p.productos.map(x => `<strong>${x.qty}x</strong> ${x.nombre}`).join(' &middot; ')}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <strong style="font-family:'Syne',sans-serif;font-size:15px;">Bs. ${p.total}</strong>
        <span class="badge badge-${p.metodo}">${metodoLabel(p.metodo)}</span>
      </div>
    </div>
  `).join('');
}
