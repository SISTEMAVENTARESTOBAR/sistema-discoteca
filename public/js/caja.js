// ============================================================
// CAJA — Sistema Discoteca
// Panel de la cajera, confirmación de cobros, cierre de caja
// ============================================================

let confirmarCajaVentaId = null;

function renderCaja() {
  const pendientes = DB.pedidos.filter(p => p.estado === 'pendiente');
  const container = document.getElementById('caja-cobros');

  if (pendientes.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">✅</div><p>Sin cobros pendientes</p></div></div>';
  } else {
    container.innerHTML = pendientes.map(p => {
      const metIcon = { efectivo: '💵', qr: '📱', mixto: '💵📱' }[p.metodo] || '';
      return `<div class="card" style="margin-bottom:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <strong style="font-size:15px;">🔔 Mesa ${p.mesaNum}</strong>
            <span style="font-size:12px;color:var(--text3);margin-left:8px;">${p.garzonNombre}</span>
          </div>
          <span class="badge badge-pending">Pendiente</span>
        </div>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;">${p.productos.map(x => `${x.qty}x ${x.nombre}`).join(', ')}</div>
        ${p.nota ? `<div style="font-size:11px;color:var(--text3);margin-bottom:8px;">📝 ${p.nota}</div>` : ''}
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
        <button class="btn btn-success" onclick="openConfirmarCaja(${p.id})">✅ Confirmar recepción</button>
      </div>`;
    }).join('');
  }

  // Resumen cierre
  const hoy = getTodayStr();
  const cobradas = DB.pedidos.filter(p => p.fecha === hoy && ['caja_confirmada', 'listo', 'entregado'].includes(p.estado));
  const totalV = cobradas.reduce((s, p) => s + p.total, 0);
  const ef = cobradas.reduce((s, p) => s + (p.efectivo || 0), 0);
  const qr = cobradas.reduce((s, p) => s + (p.qr || 0), 0);
  const anulMonto = DB.anulaciones.filter(a => a.fecha === hoy).reduce((s, a) => s + a.monto, 0);
  const cambios = cobradas.reduce((s, p) => s + (p.cambio || 0), 0);
  document.getElementById('cierre-summary-data').innerHTML = `
    <div class="cierre-row"><span>Total ventas del día</span><span>Bs. ${totalV}</span></div>
    <div class="cierre-row"><span>💵 Efectivo cobrado</span><span style="color:var(--green);">Bs. ${ef}</span></div>
    <div class="cierre-row"><span>📱 QR cobrado</span><span style="color:var(--blue);">Bs. ${qr}</span></div>
    <div class="cierre-row"><span>⚠️ Anulaciones</span><span style="color:var(--red);">Bs. ${anulMonto}</span></div>
    <div class="cierre-row"><span>Cambios devueltos</span><span>Bs. ${cambios}</span></div>
    <div class="cierre-row"><span>Efectivo neto en caja</span><span style="color:var(--green);">Bs. ${ef - cambios}</span></div>`;
}

function openConfirmarCaja(pedidoId) {
  confirmarCajaVentaId = pedidoId;
  const p = DB.pedidos.find(x => x.id === pedidoId);
  document.getElementById('modal-caja-title').textContent = `💰 Confirmar — Mesa ${p.mesaNum}`;
  document.getElementById('modal-caja-body').innerHTML = `
    <div style="text-align:center;padding:10px 0 20px;">
      <div style="font-size:32px;margin-bottom:8px;">${{ efectivo: '💵', qr: '📱', mixto: '💵📱' }[p.metodo]}</div>
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
      <span class="alert-icon">⚠️</span>
      <div class="alert-text"><strong>Al confirmar</strong><span>Se notificará al bar y cocina para preparar el pedido</span></div>
    </div>
    <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border);margin-top:16px;">
      <button class="btn btn-outline" onclick="closeModal('modal-confirmar-caja')">Cancelar</button>
      <button class="btn btn-success" onclick="ejecutarConfirmarCaja()">✅ Confirmar recepción</button>
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

  // Determinar si notificar bar y/o cocina
  const tieneBebidas = pedido.productos.some(p => {
    const prod = DB.productos.find(x => x.nombre === p.nombre);
    return prod && prod.categoria !== 'Comida';
  });
  const tieneComida = pedido.productos.some(p => {
    const prod = DB.productos.find(x => x.nombre === p.nombre);
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
    db.ref('pedidos/' + pedido.id).update(updates);
    if (mesa) db.ref('mesas/' + mesa.id).update({ estado: 'preparando' });
  } else {
    Object.assign(pedido, updates);
    if (mesa) mesa.estado = 'preparando';
  }

  // Notificar al bar y cocina
  Notificaciones.notificarPagoConfirmado(pedido);

  addLog(`Confirmó cobro Mesa ${pedido.mesaNum} — Bs.${pedido.total} — ${metodoLabel(pedido.metodo)}`);
  closeModal('modal-confirmar-caja');
  renderCaja();
}

function confirmarCierre() {
  const obs = document.getElementById('cierre-obs').value.trim();
  const hoy = getTodayStr();
  const cobradas = DB.pedidos.filter(p => p.fecha === hoy && ['caja_confirmada', 'listo', 'entregado'].includes(p.estado));
  const totalV = cobradas.reduce((s, p) => s + p.total, 0);
  const ef = cobradas.reduce((s, p) => s + (p.efectivo || 0), 0);
  const qr = cobradas.reduce((s, p) => s + (p.qr || 0), 0);
  const anulMonto = DB.anulaciones.filter(a => a.fecha === hoy).reduce((s, a) => s + a.monto, 0);
  const cambios = cobradas.reduce((s, p) => s + (p.cambio || 0), 0);
  
  const cierre = {
    fecha: hoy,
    hora: getTimeStr(),
    cajero: currentUser.nombre,
    totalVentas: totalV,
    efectivo: ef,
    qr,
    anulaciones: anulMonto,
    cambios,
    efectivoNeto: ef - cambios,
    obs
  };

  if (typeof db !== 'undefined') {
    db.ref('cierres').push(cierre);
  } else {
    DB.cierres.push(cierre);
  }
  
  addLog(`Realizó cierre de caja — Total Bs.${totalV}`);
  alert('✅ Cierre de caja confirmado y registrado');
  renderCaja();
}

function renderCajaHistorial() {
  const hoy = getTodayStr();
  const confirmados = DB.pedidos.filter(p => p.cajeraId === currentUser.id && p.fecha === hoy && ['caja_confirmada', 'listo', 'entregado'].includes(p.estado));
  const container = document.getElementById('historial-caja-list');
  if (confirmados.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">🕒</div><p>Aún no has confirmado cobros hoy</p></div></div>';
    return;
  }
  container.innerHTML = confirmados.reverse().map(p => {
    return `<div class="card" style="margin-bottom:12px; opacity:0.8;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <strong>Mesa ${p.mesaNum} — ${p.garzonNombre}</strong>
        <span style="font-size:12px;color:var(--text2);">${p.fecha} ${p.horaCaja}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="font-family:'Syne',sans-serif;">Bs. ${p.total}</strong>
        <span class="badge badge-${p.metodo}">${metodoLabel(p.metodo)}</span>
      </div>
      <div style="font-size:12px;color:var(--green);">✅ Confirmado por ${p.cajeraNombre}</div>
    </div>`;
  }).join('');
}
