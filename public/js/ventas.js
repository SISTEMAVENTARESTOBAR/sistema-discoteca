// ============================================================
// VENTAS Y REPORTES — Sistema Discoteca
// Registro de ventas, anulaciones, log y cierre historial
// ============================================================

// Date picker state
let dpCurrentMonth = new Date();
let dpStartDate = null;
let dpEndDate = null;
let dpSelectingEnd = false;
let dpActivePreset = 'hoy';

function renderVentas() {
  poblarFiltroGarzon();
  // Initialize date picker to "Hoy" on first render
  if (!dpStartDate) {
    const hoy = getTodayStr();
    dpStartDate = hoy;
    dpEndDate = hoy;
    document.getElementById('dp-start').value = hoy;
    document.getElementById('dp-end').value = hoy;
  }
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
  let ventas = DB.pedidos
    .filter(p => ['caja_confirmada', 'listo', 'entregado'].includes(p.estado))
    .map(p => ({
      ...p,
      mesa: p.mesaNum,
      hora: p.horaCreacion,
      estado: 'cobrado'
    }));

  // Date range filter
  if (dpStartDate && dpEndDate) {
    ventas = ventas.filter(v => v.fecha >= dpStartDate && v.fecha <= dpEndDate);
  } else if (dpStartDate) {
    ventas = ventas.filter(v => v.fecha === dpStartDate);
  }

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
  const hoy = getTodayStr();
  dpStartDate = hoy;
  dpEndDate = hoy;
  dpActivePreset = 'hoy';
  document.getElementById('dp-start').value = hoy;
  document.getElementById('dp-end').value = hoy;
  document.getElementById('f-fecha-label').textContent = 'Hoy';
  document.getElementById('f-garzon').value = '';
  document.getElementById('f-metodo').value = '';
  document.getElementById('f-estado').value = '';
  document.getElementById('f-buscar').value = '';
  aplicarFiltros();
}

// ============================================================
// DATE PICKER FUNCTIONS
// ============================================================

function toggleDatePicker() {
  const popup = document.getElementById('date-picker-popup');
  const isVisible = popup.style.display !== 'none';
  if (isVisible) {
    closeDatePicker();
  } else {
    popup.style.display = 'block';
    document.getElementById('f-fecha-arrow').style.transform = 'rotate(180deg)';
    dpRenderCalendar();
  }
}

function closeDatePicker() {
  document.getElementById('date-picker-popup').style.display = 'none';
  document.getElementById('f-fecha-arrow').style.transform = '';
}

// Close when clicking outside
document.addEventListener('click', function(e) {
  const popup = document.getElementById('date-picker-popup');
  const btn = document.getElementById('f-fecha-btn');
  if (popup && btn && !popup.contains(e.target) && !btn.contains(e.target)) {
    if (popup.style.display !== 'none') closeDatePicker();
  }
});

function dpPreset(preset) {
  const hoy = new Date();
  const hoyStr = formatDateStr(hoy);
  dpActivePreset = preset;

  document.querySelectorAll('.dp-preset').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  switch (preset) {
    case 'hoy':
      dpStartDate = hoyStr;
      dpEndDate = hoyStr;
      document.getElementById('f-fecha-label').textContent = 'Hoy';
      break;
    case 'ayer':
      const ayer = new Date(hoy);
      ayer.setDate(ayer.getDate() - 1);
      dpStartDate = formatDateStr(ayer);
      dpEndDate = formatDateStr(ayer);
      document.getElementById('f-fecha-label').textContent = 'Ayer';
      break;
    case '7dias':
      const hace7 = new Date(hoy);
      hace7.setDate(hace7.getDate() - 7);
      dpStartDate = formatDateStr(hace7);
      dpEndDate = hoyStr;
      document.getElementById('f-fecha-label').textContent = 'Últ. 7 días';
      break;
    case '30dias':
      const hace30 = new Date(hoy);
      hace30.setDate(hace30.getDate() - 30);
      dpStartDate = formatDateStr(hace30);
      dpEndDate = hoyStr;
      document.getElementById('f-fecha-label').textContent = 'Últ. 30 días';
      break;
    case 'mes':
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      dpStartDate = formatDateStr(inicioMes);
      dpEndDate = hoyStr;
      document.getElementById('f-fecha-label').textContent = 'Este mes';
      break;
    case 'todo':
      dpStartDate = null;
      dpEndDate = null;
      document.getElementById('f-fecha-label').textContent = 'Todo';
      break;
  }

  document.getElementById('dp-start').value = dpStartDate || '';
  document.getElementById('dp-end').value = dpEndDate || '';
  dpRenderCalendar();
  aplicarFiltros();
  closeDatePicker();
}

function formatDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function dpRenderCalendar() {
  const label = document.getElementById('dp-month-label');
  label.textContent = `${MESES_ES[dpCurrentMonth.getMonth()]} ${dpCurrentMonth.getFullYear()}`;

  const grid = document.getElementById('dp-days-grid');
  grid.innerHTML = '';

  const year = dpCurrentMonth.getFullYear();
  const month = dpCurrentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay();
  if (startDow === 0) startDow = 7; // Lunes = 1
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const todayStr = formatDateStr(new Date());

  // Previous month days
  for (let i = startDow - 1; i > 0; i--) {
    const dayNum = prevDays - i + 1;
    const d = new Date(year, month - 1, dayNum);
    const dStr = formatDateStr(d);
    const btn = createDayBtn(dayNum, dStr, true, todayStr);
    grid.appendChild(btn);
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dStr = formatDateStr(d);
    const btn = createDayBtn(i, dStr, false, todayStr);
    grid.appendChild(btn);
  }

  // Next month fill
  const totalCells = grid.children.length;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    const dStr = formatDateStr(d);
    const btn = createDayBtn(i, dStr, true, todayStr);
    grid.appendChild(btn);
  }
}

function createDayBtn(dayNum, dateStr, isOtherMonth, todayStr) {
  const btn = document.createElement('button');
  btn.className = 'dp-day';
  btn.textContent = dayNum;

  if (isOtherMonth) btn.classList.add('other-month');
  if (dateStr === todayStr && !isOtherMonth) btn.classList.add('today');

  // Range highlighting
  if (dpStartDate && dpEndDate) {
    if (dateStr === dpStartDate && dateStr === dpEndDate) {
      btn.classList.add('selected');
    } else if (dateStr === dpStartDate) {
      btn.classList.add('range-start');
    } else if (dateStr === dpEndDate) {
      btn.classList.add('range-end');
    } else if (dateStr > dpStartDate && dateStr < dpEndDate) {
      btn.classList.add('in-range');
    }
  } else if (dpStartDate && dateStr === dpStartDate) {
    btn.classList.add('selected');
  }

  btn.onclick = () => dpClickDay(dateStr);
  return btn;
}

function dpClickDay(dateStr) {
  dpActivePreset = null;
  document.querySelectorAll('.dp-preset').forEach(b => b.classList.remove('active'));

  if (!dpStartDate || (dpStartDate && dpEndDate)) {
    // Start new selection
    dpStartDate = dateStr;
    dpEndDate = null;
    dpSelectingEnd = true;
  } else if (dpSelectingEnd) {
    // Set end date
    if (dateStr < dpStartDate) {
      dpEndDate = dpStartDate;
      dpStartDate = dateStr;
    } else {
      dpEndDate = dateStr;
    }
    dpSelectingEnd = false;
  }

  document.getElementById('dp-start').value = dpStartDate || '';
  document.getElementById('dp-end').value = dpEndDate || '';

  if (dpStartDate && dpEndDate) {
    updateFechaLabel();
  }

  dpRenderCalendar();
}

function dpInputChange() {
  dpStartDate = document.getElementById('dp-start').value || null;
  dpEndDate = document.getElementById('dp-end').value || null;
  dpActivePreset = null;
  document.querySelectorAll('.dp-preset').forEach(b => b.classList.remove('active'));
  if (dpStartDate) dpCurrentMonth = new Date(dpStartDate + 'T12:00:00');
  dpRenderCalendar();
}

function dpApply() {
  if (!dpStartDate) dpStartDate = getTodayStr();
  if (!dpEndDate) dpEndDate = dpStartDate;
  document.getElementById('dp-start').value = dpStartDate;
  document.getElementById('dp-end').value = dpEndDate;
  updateFechaLabel();
  aplicarFiltros();
  closeDatePicker();
}

function updateFechaLabel() {
  if (!dpStartDate && !dpEndDate) {
    document.getElementById('f-fecha-label').textContent = 'Todo';
    return;
  }
  if (dpStartDate === dpEndDate) {
    const hoy = getTodayStr();
    if (dpStartDate === hoy) {
      document.getElementById('f-fecha-label').textContent = 'Hoy';
    } else {
      const parts = dpStartDate.split('-');
      document.getElementById('f-fecha-label').textContent = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } else {
    const ps = dpStartDate.split('-');
    const pe = dpEndDate.split('-');
    document.getElementById('f-fecha-label').textContent = `${ps[2]}/${ps[1]} - ${pe[2]}/${pe[1]}`;
  }
}

function dpPrevMonth() {
  dpCurrentMonth.setMonth(dpCurrentMonth.getMonth() - 1);
  dpRenderCalendar();
}

function dpNextMonth() {
  dpCurrentMonth.setMonth(dpCurrentMonth.getMonth() + 1);
  dpRenderCalendar();
}

function verDetalleVenta(id) {
  const p = DB.pedidos.find(x => x.id === id);
  if (!p) return;
  const v = { ...p, mesa: p.mesaNum, hora: p.horaCreacion, estado: 'cobrado' };
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
