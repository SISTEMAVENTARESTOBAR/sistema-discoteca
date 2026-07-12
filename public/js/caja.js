// ============================================================
// CAJA — Sistema Discoteca
// Panel de la cajera, confirmación de cobros, cierre de caja
// ============================================================

let confirmarCajaVentaId = null;

function openPedidoCaja() {
  isCajaMode = true;
  cajaModeCliente = null;
  openPedidoModal(null);
  document.getElementById('modal-pedido-title').textContent = 'Nuevo Pedido en Caja';
}

function renderCaja() {
  if (currentUser.rol !== 'cajero' && currentUser.rol !== 'admin') {
    document.getElementById('caja-cobros').innerHTML = '<div style="padding:20px;color:red;text-align:center;">Acceso Denegado</div>';
    return;
  }

  const pendientes = DB.pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'esperando_pago');
  const container = document.getElementById('caja-cobros');

  if (pendientes.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('checkCircle', 40, 'icon-success') + '</div><p>Sin cobros pendientes</p></div></div>';
  } else {
    container.innerHTML = pendientes.map(p => {
      const metIcon = metodoIcon(p.metodo);
      return `<div class="card" style="margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <strong style="font-size:15px;">${icon('bell', 14)} Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:14px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''}</strong>
            <span style="font-size:12px;color:var(--text3);margin-left:8px;">${p.garzonNombre}</span>
          </div>
          <span class="badge badge-pending">Pendiente</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;">${p.productos.map(x => `${x.qty}x ${x.nombre}`).join(', ')}</div>
        ${p.nota ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">${icon('note', 11)} ${p.nota}</div>` : ''}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:10px;">
          <span style="color:var(--text2);">Total</span>
          <strong style="font-family:'Syne',sans-serif;font-size:20px;">Bs. ${p.total}</strong>
        </div>
        <div style="font-size:13px;margin-bottom:12px;">
          ${metIcon} <span class="badge badge-${p.metodo}">${metodoLabel(p.metodo)}</span>
          ${p.efectivo ? `<span style="margin-left:8px;color:var(--text2);">Efectivo: Bs. ${p.efectivo}</span>` : ''}
          ${p.qr ? `<span style="margin-left:8px;color:var(--text2);">QR: Bs. ${p.qr}</span>` : ''}
          ${p.cambio > 0 ? `<span style="margin-left:8px;color:var(--green);">Cambio: Bs. ${p.cambio}</span>` : ''}
        </div>
        ${p.comprobante ? `<div style="margin-bottom:10px;"><img src="${p.comprobante}" style="max-height:80px;border-radius:6px;border:1px solid var(--border);"></div>` : ''}
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline" style="color:var(--red);border-color:var(--red);flex:1;" onclick="rechazarPedidoCaja(${p.id})">${icon('xCircle', 13)} Rechazar</button>
          <button class="btn btn-success" style="flex:2;" onclick="openConfirmarCaja(${p.id})">${icon('checkCircle', 13)} Confirmar recepción</button>
        </div>
      </div>`;
    }).join('');
  }

  // Resumen cierre
  const hoy = getTodayStr();
  const cobradas = DB.pedidos.filter(p => p.fecha === hoy && ['caja_confirmada', 'listo', 'entregado'].includes(p.estado));
  const totalV = Number(cobradas.reduce((s, p) => s + p.total, 0).toFixed(2));
  const ef = Number(cobradas.reduce((s, p) => s + (p.efectivo || 0), 0).toFixed(2));
  const qr = Number(cobradas.reduce((s, p) => s + (p.qr || 0), 0).toFixed(2));
  const anulMonto = Number(DB.anulaciones.filter(a => a.fecha === hoy).reduce((s, a) => s + a.monto, 0).toFixed(2));
  const cambios = Number(cobradas.reduce((s, p) => s + (p.cambio || 0), 0).toFixed(2));
  document.getElementById('cierre-summary-data').innerHTML = `
    <div class="cierre-row"><span>Total ventas del día</span><span>Bs. ${totalV}</span></div>
    <div class="cierre-row"><span>${icon('cash', 14)} Efectivo cobrado</span><span style="color:var(--green);">Bs. ${ef}</span></div>
    <div class="cierre-row"><span>${icon('smartphone', 14)} QR cobrado</span><span style="color:var(--blue);">Bs. ${qr}</span></div>
    <div class="cierre-row"><span>${icon('alertTriangle', 14)} Anulaciones</span><span style="color:var(--red);">Bs. ${anulMonto}</span></div>
    <div class="cierre-row"><span>Cambios devueltos</span><span>Bs. ${cambios}</span></div>
    <div class="cierre-row"><span>Efectivo neto en caja</span><span style="color:var(--green);">Bs. ${Number((ef - cambios).toFixed(2))}</span></div>`;
}

// ============================================================
// PEDIDO EN CAJA (Para llevar / Takeaway)
// ============================================================

let cajaPedidoMode = false;

function openPedidoCaja() {
  cajaPedidoMode = true;
  cart = [];
  selectedPayMethod = null;
  qrFileData = null;
  mixtoFileData = null;

  document.getElementById('modal-pedido-title').textContent = 'Pedido en Caja — Para Llevar';
  document.getElementById('pedido-cliente').value = '';
  document.getElementById('pedido-nota').value = '';
  document.getElementById('monto-recibido').value = '';
  document.getElementById('mixto-efectivo').value = '';
  document.getElementById('mixto-qr').value = '';
  document.getElementById('qr-preview').style.display = 'none';
  document.getElementById('mixto-preview').style.display = 'none';
  document.getElementById('qr-upload-area').classList.remove('has-file');
  document.getElementById('mixto-upload-area').classList.remove('has-file');
  ['pay-efectivo', 'pay-qr', 'pay-mixto'].forEach(id => document.getElementById(id).classList.remove('selected'));
  ['pago-efectivo-fields', 'pago-qr-fields', 'pago-mixto-fields'].forEach(id => document.getElementById(id).style.display = 'none');

  activeCategory = null;
  buildProductGridCaja();
  renderCart();
  updateConfirmBtn();
  openModal('modal-pedido');
}

function buildProductGridCaja() {
  const cats = [...new Set(DB.productos.filter(p => p.activo).map(p => p.categoria))];
  if (cats.length === 0) {
    document.getElementById('cat-pills').innerHTML = '';
    document.getElementById('product-grid').innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('package', 40, 'icon-muted') + '</div><p>No hay productos disponibles</p></div>';
    return;
  }
  if (!activeCategory) activeCategory = cats[0];

  const pills = document.getElementById('cat-pills');
  pills.innerHTML = cats.map(c => `<button class="cat-pill ${c === activeCategory ? 'active' : ''}" onclick="setActiveCat('${c}')">${c}</button>`).join('');

  const productos = DB.productos.filter(p => p.activo && p.categoria === activeCategory);
  const grid = document.getElementById('product-grid');
  grid.innerHTML = productos.map(p => `
    <div class="product-item" onclick="addToCart(${p.id})">
      <div>
        <div class="pname">${p.nombre}</div>
        <div class="pprice">Bs. ${p.precio}</div>
      </div>
      <span style="font-size:18px;color:var(--accent);">+</span>
    </div>`).join('');
}

function openConfirmarCaja(pedidoId) {
  confirmarCajaVentaId = pedidoId;
  const p = DB.pedidos.find(x => x.id === pedidoId);
  document.getElementById('modal-caja-title').textContent = `Confirmar — Mesa ${p.mesaNum}`;
  document.getElementById('modal-caja-body').innerHTML = `
      <div style="text-align:center;padding:10px 0 20px;">
      <div style="font-size:32px;margin-bottom:8px;color:var(--accent);">${metodoIcon(p.metodo)}</div>
      <div style="font-family:'Syne',sans-serif;font-size:36px;font-weight:800;letter-spacing:-1px;">Bs. ${p.total}</div>
      <div style="color:var(--text2);font-size:13px;margin-top:4px;">${metodoLabel(p.metodo)} — ${p.garzonNombre}</div>
    </div>
    <div class="form-group">
      <label>¿Diste cambio?</label>
      <select id="caja-cambio-sel" onchange="toggleCajaCambio()">
        <option value="no">No hubo cambio</option>
        <option value="si">Sí, di cambio</option>
      </select>
    </div>
    <div id="caja-cambio-field" style="display:none;" class="form-group">
      <label>Monto del cambio (Bs.)</label>
      <input type="number" id="caja-cambio-monto" placeholder="0">
    </div>
    <div class="alert alert-warning" style="margin-top:12px;">
      <span class="alert-icon">${icon('alertTriangle', 16, 'icon-warning')}</span>
      <div class="alert-text"><strong>Al confirmar</strong><span>Se notificará al bar y cocina para preparar el pedido</span></div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border);margin-top:16px;">
      <button class="btn btn-outline" onclick="closeModal('modal-confirmar-caja')">Cancelar</button>
      <button class="btn btn-success" onclick="ejecutarConfirmarCaja()">Confirmar recepción</button>
    </div>`;
  openModal('modal-confirmar-caja');
}

function toggleCajaCambio() {
  const sel = document.getElementById('caja-cambio-sel');
  document.getElementById('caja-cambio-field').style.display = sel.value === 'si' ? 'block' : 'none';
}

function ejecutarConfirmarCaja() {
  const pedido = DB.pedidos.find(p => p.id === confirmarCajaVentaId);
  if (!pedido) return;
  const hora = getTimeStr();
  const sel = document.getElementById('caja-cambio-sel');
  let cambioReal = 0;
  if (sel && sel.value === 'si') {
    cambioReal = parseFloat(document.getElementById('caja-cambio-monto').value) || 0;
  }
  pedido.estado = 'caja_confirmada';
  pedido.cajeraId = currentUser.id;
  pedido.cajeraNombre = currentUser.nombre;
  pedido.horaCaja = hora;
  pedido.cambio = cambioReal;

  const tieneBebidas = pedido.productos.some(p => {
    const prod = DB.productos.find(x => x.id === p.id);
    return prod && prod.categoria !== 'Comida';
  });
  const tieneComida = pedido.productos.some(p => {
    const prod = DB.productos.find(x => x.id === p.id);
    return prod && prod.categoria === 'Comida';
  });
  
  const updates = {
    estado: 'caja_confirmada',
    cajeraId: currentUser.id,
    cajeraNombre: currentUser.nombre,
    horaCaja: hora,
    cambio: cambioReal,
    notificarBar: tieneBebidas,
    notificarCocina: tieneComida,
    barListo: !tieneBebidas,
    cocinaListo: !tieneComida
  };

  const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedido.id).update(updates).catch(e => console.error('Error actualizando pedido:', e));
    if (mesa) db.ref('mesas/' + mesa.id).update({ estado: 'preparando' }).catch(e => console.error(e));
  } else {
    Object.assign(pedido, updates);
    if (mesa) mesa.estado = 'preparando';
  }

  Notificaciones.notificarPagoConfirmado(pedido);

  addLog(`Confirmó cobro Mesa ${pedido.mesaNum} — Bs.${pedido.total} — ${metodoLabel(pedido.metodo)}`);
  closeModal('modal-confirmar-caja');
  renderCaja();
}

function confirmarCierre() {
  mostrarConfirm('Cierre de Caja', '¿Estás seguro de que deseas confirmar el cierre de caja de hoy?<br><strong>Esta acción no se puede deshacer.</strong>', ok => {
    if (!ok) return;
    const obs = document.getElementById('cierre-obs').value.trim();
    const hoy = getTodayStr();
    const cobradas = DB.pedidos.filter(p => p.fecha === hoy && ['caja_confirmada', 'listo', 'entregado'].includes(p.estado));
    const totalV = Number(cobradas.reduce((s, p) => s + p.total, 0).toFixed(2));
    const ef = Number(cobradas.reduce((s, p) => s + (p.efectivo || 0), 0).toFixed(2));
    const qr = Number(cobradas.reduce((s, p) => s + (p.qr || 0), 0).toFixed(2));
    const anulMonto = Number(DB.anulaciones.filter(a => a.fecha === hoy).reduce((s, a) => s + a.monto, 0).toFixed(2));
    const cambios = Number(cobradas.reduce((s, p) => s + (p.cambio || 0), 0).toFixed(2));
    const cierre = {
      fecha: hoy, hora: getTimeStr(), cajero: currentUser.nombre,
      totalVentas: totalV, efectivo: ef, qr,
      anulaciones: anulMonto, cambios, efectivoNeto: ef - cambios, obs
    };
    if (typeof db !== 'undefined') {
      db.ref('cierres').push(cierre).catch(e => console.error('Error guardando cierre:', e));
    } else {
      DB.cierres.push(cierre);
    }
    addLog(`Realizó cierre de caja — Total Bs.${totalV}`);
    mostrarToast('Cierre de Caja', 'Cierre de caja confirmado y registrado');
    renderCaja();
  });
}

function renderCajaHistorial() {
  const hoy = getTodayStr();
  const confirmados = DB.pedidos.filter(p => p.cajeraId === currentUser.id && p.fecha === hoy && ['caja_confirmada', 'listo', 'entregado'].includes(p.estado));
  const container = document.getElementById('historial-caja-list');
  if (confirmados.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('clock', 40, 'icon-muted') + '</div><p>Aún no has confirmado cobros hoy</p></div></div>';
    return;
  }
  container.innerHTML = confirmados.reverse().map(p => {
    return `<div class="card" style="margin-bottom:12px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} ${p.clienteNombre ? `<span style="color:var(--accent);font-size:13px;margin-left:4px;">${icon('user', 12)} ${p.clienteNombre}</span>` : ''} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--text2);">${p.fecha} ${p.horaCaja}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="font-family:'Syne',sans-serif;">Bs. ${p.total}</strong>
        <span class="badge badge-${p.metodo}">${metodoLabel(p.metodo)}</span>
      </div>
      <div style="font-size:12px;color:var(--green);">${icon('checkCircle', 12, 'icon-success')} Confirmado por ${p.cajeraNombre}</div>
    </div>`;
  }).join('');
}

function rechazarPedidoCaja(pedidoId) {
  if (currentUser.rol !== 'cajero' && currentUser.rol !== 'admin') { mostrarToast('Acceso', 'Acceso denegado'); return; }
  mostrarPrompt('Motivo del Rechazo', 'Explica por qué se rechaza este pedido...', motivo => {
    if (!motivo) return;
    const pedido = DB.pedidos.find(p => p.id === pedidoId);
    if (!pedido) return;
    const hoy = getTodayStr();
    const hora = getTimeStr();
    const anulacionId = Date.now();
    const anulacion = {
      id: anulacionId, mesa: pedido.mesaNum,
      garzonId: pedido.garzonId, garzonNombre: pedido.garzonNombre,
      fecha: hoy, hora, monto: pedido.total,
      motivo: 'Caja Rechazó: ' + motivo
    };
    const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
    if (typeof db !== 'undefined') {
      db.ref('pedidos/' + pedido.id).update({ estado: 'anulado' }).catch(e => console.error(e));
      db.ref('anulaciones/' + anulacionId).set(anulacion).catch(e => console.error(e));
      if (mesa) db.ref('mesas/' + mesa.id).update({ estado: 'libre' }).catch(e => console.error(e));
    } else {
      pedido.estado = 'anulado';
      DB.anulaciones.push(anulacion);
      if (mesa) mesa.estado = 'libre';
    }
    addLog(`Caja rechazó pedido Mesa ${pedido.mesaNum} — Motivo: ${motivo}`);
    renderCaja();
  });
}
