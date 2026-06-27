// ============================================================
// VENTAS Y REPORTES — Sistema Discoteca
// Registro de ventas, anulaciones, log y cierre historial
// ============================================================

function renderVentas() {
  poblarFiltroGarzon();
  aplicarFiltros();
}

function poblarFiltroGarzon() {
  const sel = document.getElementById('f-garzon');
  const current = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  DB.usuarios.filter(u => u.rol === 'garzon').forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.nombre;
    sel.appendChild(opt);
  });
  sel.value = current;
}

function aplicarFiltros() {
  let ventas = [...DB.ventas];
  const hoy = getTodayStr();
  const fecha = document.getElementById('f-fecha').value;
  if (fecha === 'hoy') ventas = ventas.filter(v => v.fecha === hoy);
  const garzon = document.getElementById('f-garzon').value;
  if (garzon) ventas = ventas.filter(v => v.garzonId == garzon);
  const metodo = document.getElementById('f-metodo').value;
  if (metodo) ventas = ventas.filter(v => v.metodo === metodo);
  const estado = document.getElementById('f-estado').value;
  if (estado) ventas = ventas.filter(v => v.estado === estado);
  const buscar = document.getElementById('f-buscar').value.trim().toLowerCase();
  if (buscar) ventas = ventas.filter(v => String(v.id).includes(buscar) || String(v.mesa).includes(buscar));

  const cobradas = ventas.filter(v => v.estado === 'cobrado');
  document.getElementById('v-total').textContent = `Bs. ${cobradas.reduce((s, v) => s + v.total, 0)}`;
  document.getElementById('v-efectivo').textContent = `Bs. ${cobradas.reduce((s, v) => s + (v.efectivo || 0), 0)}`;
  document.getElementById('v-qr').textContent = `Bs. ${cobradas.reduce((s, v) => s + (v.qr || 0), 0)}`;

  const tbody = document.getElementById('ventas-tbody');
  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:30px;">Sin resultados</td></tr>`;
    return;
  }
  tbody.innerHTML = [...ventas].reverse().map(v => `
    <tr>
      <td style="color:var(--accent);font-weight:700;">#${String(v.id).padStart(4, '0')}</td>
      <td>${v.fecha}<br><span style="color:var(--text3);font-size:11px;">${v.hora}</span></td>
      <td class="hide-mobile">${v.garzonNombre}</td>
      <td>Mesa ${v.mesa}</td>
      <td style="font-family:'Syne',sans-serif;font-weight:700;">Bs. ${v.total}</td>
      <td><span class="badge badge-${v.metodo}">${metodoLabel(v.metodo)}</span></td>
      <td class="hide-mobile"><span class="badge badge-${v.estado === 'cobrado' ? 'paid' : 'cancelled'}">${v.estado === 'cobrado' ? '✅ Cobrado' : '❌ Anulado'}</span></td>
      <td><button class="btn btn-outline btn-sm" onclick="verDetalleVenta(${v.id})">Ver →</button></td>
    </tr>`).join('');
}

function limpiarFiltros() {
  document.getElementById('f-fecha').value = 'hoy';
  document.getElementById('f-garzon').value = '';
  document.getElementById('f-metodo').value = '';
  document.getElementById('f-estado').value = '';
  document.getElementById('f-buscar').value = '';
  aplicarFiltros();
}

function verDetalleVenta(id) {
  const v = DB.ventas.find(x => x.id === id);
  if (!v) return;
  document.getElementById('modal-detalle-title').textContent = `Venta #${String(v.id).padStart(4, '0')}`;
  document.getElementById('modal-detalle-body').innerHTML = `
    <div style="margin-bottom:16px;">
      <div class="trace-row"><span class="trace-icon">👤</span><div class="trace-info"><strong>Garzón</strong><span>${v.garzonNombre}</span></div></div>
      <div class="trace-row"><span class="trace-icon">🪑</span><div class="trace-info"><strong>Mesa</strong><span>Mesa ${v.mesa}</span></div></div>
      <div class="trace-row"><span class="trace-icon">📅</span><div class="trace-info"><strong>Fecha y hora apertura</strong><span>${v.fecha} — ${v.hora}</span></div></div>
      <div class="trace-row"><span class="trace-icon">🕙</span><div class="trace-info"><strong>Hora de cierre</strong><span>${v.horaCierre || '—'}</span></div></div>
      ${v.bartenderNombre ? `<div class="trace-row"><span class="trace-icon">🍺</span><div class="trace-info"><strong>Preparado por bar</strong><span>${v.bartenderNombre} — ${v.horaBar}</span></div></div>` : ''}
      ${v.cocineraNombre ? `<div class="trace-row"><span class="trace-icon">👨🍳</span><div class="trace-info"><strong>Preparado por cocina</strong><span>${v.cocineraNombre} — ${v.horacocina}</span></div></div>` : ''}
      ${v.cajeraNombre ? `<div class="trace-row"><span class="trace-icon">💰</span><div class="trace-info"><strong>Confirmado por caja</strong><span>${v.cajeraNombre} — ${v.horaCaja}</span></div></div>` : ''}
    </div>
    <div class="divider"></div>
    <strong style="font-size:13px;display:block;margin-bottom:10px;">Productos</strong>
    ${v.productos.map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${p.qty}x ${p.nombre}</span><span style="color:var(--accent);">Bs. ${p.qty * p.precio}</span></div>`).join('')}
    ${v.nota ? `<div style="padding:8px 10px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--text2);margin-top:8px;">📝 ${v.nota}</div>` : ''}
    <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:16px;font-weight:700;font-family:'Syne',sans-serif;">
      <span>TOTAL</span><span>Bs. ${v.total}</span>
    </div>
    <div class="divider"></div>
    <strong style="font-size:13px;display:block;margin-bottom:10px;">Pago</strong>
    <div style="font-size:13px;">
      <div style="display:flex;justify-content:space-between;padding:5px 0;"><span style="color:var(--text2);">Método</span><span><span class="badge badge-${v.metodo}">${metodoLabel(v.metodo)}</span></span></div>
      ${v.efectivo ? `<div style="display:flex;justify-content:space-between;padding:5px 0;"><span style="color:var(--text2);">Efectivo recibido</span><span>Bs. ${v.efectivo}</span></div>` : ''}
      ${v.qr ? `<div style="display:flex;justify-content:space-between;padding:5px 0;"><span style="color:var(--text2);">QR recibido</span><span>Bs. ${v.qr}</span></div>` : ''}
      ${v.cambio ? `<div style="display:flex;justify-content:space-between;padding:5px 0;"><span style="color:var(--text2);">Cambio devuelto</span><span style="color:var(--green);">Bs. ${v.cambio}</span></div>` : ''}
      ${v.comprobante ? `<div style="margin-top:10px;"><strong style="font-size:12px;color:var(--text2);">Comprobante QR:</strong><br><img src="${v.comprobante}" style="max-width:100%;max-height:150px;border-radius:8px;margin-top:6px;border:1px solid var(--border);"></div>` : ''}
    </div>`;
  openModal('modal-venta-detalle');
}

// ============================================================
// ANULACIONES (vista admin)
// ============================================================
function renderAnulaciones() {
  const tbody = document.getElementById('anulaciones-tbody');
  if (DB.anulaciones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:30px;">Sin anulaciones</td></tr>`;
    return;
  }
  tbody.innerHTML = [...DB.anulaciones].reverse().map(a => `
    <tr>
      <td style="color:var(--red);font-weight:700;">#${String(a.id).padStart(4, '0')}</td>
      <td>${a.fecha}<br><span style="color:var(--text3);font-size:11px;">${a.hora}</span></td>
      <td>${a.garzonNombre}</td>
      <td>Mesa ${a.mesa}</td>
      <td>Bs. ${a.monto}</td>
      <td style="color:var(--text2);">${a.motivo}</td>
    </tr>`).join('');
}

// ============================================================
// LOG DE ACCIONES
// ============================================================
function renderLog() {
  const list = document.getElementById('log-list');
  if (DB.log.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><p>Sin registros</p></div>';
    return;
  }
  list.innerHTML = [...DB.log].reverse().map(l => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="font-size:12px;color:var(--text3);min-width:50px;">${l.hora}</div>
      <div style="width:8px;height:8px;border-radius:50%;background:${rolColor(l.rol)};flex-shrink:0;"></div>
      <div style="flex:1;">
        <strong style="font-size:13px;">${l.usuario}</strong>
        <span style="font-size:12px;color:var(--text2);margin-left:6px;">${l.accion}</span>
      </div>
      <span style="font-size:11px;color:var(--text3);background:var(--bg2);padding:2px 8px;border-radius:6px;">${rolLabel(l.rol)}</span>
    </div>`).join('');
}

// ============================================================
// CIERRE DE CAJA — HISTORIAL (ADMIN)
// ============================================================
function renderCierreHistorial() {
  const c = document.getElementById('cierre-historial');
  if (DB.cierres.length === 0) {
    c.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">🔒</div><p>Sin cierres registrados aún</p></div></div>';
    return;
  }
  c.innerHTML = DB.cierres.map(ci => `
    <div class="card" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <h3 style="font-size:16px;">🔒 Cierre — ${ci.fecha}</h3>
        <span style="font-size:12px;color:var(--text2);">Cajero: ${ci.cajero} — ${ci.hora}</span>
      </div>
      <div class="cierre-summary">
        <div class="cierre-row"><span>Total ventas</span><span>Bs. ${ci.totalVentas}</span></div>
        <div class="cierre-row"><span>Efectivo cobrado</span><span style="color:var(--green);">Bs. ${ci.efectivo}</span></div>
        <div class="cierre-row"><span>QR cobrado</span><span style="color:var(--blue);">Bs. ${ci.qr}</span></div>
        <div class="cierre-row"><span>Anulaciones</span><span style="color:var(--red);">Bs. ${ci.anulaciones}</span></div>
        <div class="cierre-row"><span>Cambios devueltos</span><span>Bs. ${ci.cambios}</span></div>
        <div class="cierre-row"><span>Efectivo neto en caja</span><span style="color:var(--green);">Bs. ${ci.efectivoNeto}</span></div>
      </div>
      ${ci.obs ? `<p style="font-size:13px;color:var(--text2);padding:10px;background:var(--bg2);border-radius:8px;">📝 ${ci.obs}</p>` : ''}
    </div>`).join('');
}
