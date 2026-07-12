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
  if (currentUser.rol !== 'admin') {
    document.getElementById('ventas-tbody').innerHTML = '<tr><td colspan="8" style="color:red;text-align:center;">Acceso Denegado</td></tr>';
    return;
  }
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
  let ventas = DB.ventas.filter(v => v.estado === 'cobrado');

  if (dpStartDate && dpEndDate) {
    ventas = ventas.filter(v => v.fecha >= dpStartDate && v.fecha <= dpEndDate);
  } else if (dpStartDate) {
    ventas = ventas.filter(v => v.fecha === dpStartDate);
  }

  const garzon = document.getElementById('f-garzon').value;
  if (garzon) ventas = ventas.filter(v => v.garzonId == garzon);
  const metodo = document.getElementById('f-metodo').value;
  if (metodo) ventas = ventas.filter(v => v.metodo === metodo);
  const buscar = normalizeText(document.getElementById('f-buscar').value.trim());
  if (buscar) ventas = ventas.filter(v => String(v.id).includes(buscar) || String(v.mesa).includes(buscar) || normalizeText(v.clienteNombre).includes(buscar) || normalizeText(v.garzonNombre).includes(buscar));

  document.getElementById('v-total').textContent = `Bs. ${Number(ventas.reduce((s, v) => s + v.total, 0).toFixed(2))}`;
  document.getElementById('v-efectivo').textContent = `Bs. ${Number(ventas.reduce((s, v) => s + (v.efectivo || 0), 0).toFixed(2))}`;
  document.getElementById('v-qr').textContent = `Bs. ${Number(ventas.reduce((s, v) => s + (v.qr || 0), 0).toFixed(2))}`;

  const tbody = document.getElementById('ventas-tbody');
  if (ventas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text3);padding:30px;">Sin resultados</td></tr>`;
    return;
  }
  tbody.innerHTML = [...ventas].reverse().map((v, i) => `
    <tr>
      <td style="color:var(--accent);font-weight:700;">#${i + 1}</td>
      <td>${v.fecha}<br><span style="color:var(--text3);font-size:11px;">${v.hora}</span></td>
      <td class="hide-mobile">${v.garzonNombre}</td>
      <td>Mesa ${v.mesa}</td>
      <td style="font-family:'Syne',sans-serif;font-weight:700;">Bs. ${v.total}</td>
      <td><span class="badge badge-${v.metodo}">${metodoLabel(v.metodo)}</span></td>
      <td class="hide-mobile"><span class="badge badge-paid">${icon('checkCircle', 12, 'icon-success')} Cobrado</span></td>
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

function dpPreset(preset, btnElement) {
  const hoy = new Date();
  const hoyStr = formatDateStr(hoy);
  dpActivePreset = preset;

  document.querySelectorAll('.dp-preset').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');

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
  const v = DB.ventas.find(x => x.id === id);
  if (!v) return;
  document.getElementById('modal-detalle-title').textContent = `Venta #${String(v.id).slice(-5)}`;
  document.getElementById('modal-detalle-body').innerHTML = `
    <div style="margin-bottom:16px;">
      <div class="trace-row"><span class="trace-icon">${icon('user', 14, 'icon-muted')}</span><div class="trace-info"><strong>Garzón</strong><span>${v.garzonNombre}</span></div></div>
      <div class="trace-row"><span class="trace-icon">${icon('table', 14, 'icon-muted')}</span><div class="trace-info"><strong>Mesa</strong><span>Mesa ${v.mesa}</span></div></div>
      <div class="trace-row"><span class="trace-icon">${icon('calendar', 14, 'icon-muted')}</span><div class="trace-info"><strong>Fecha y hora apertura</strong><span>${v.fecha} — ${v.hora}</span></div></div>
      <div class="trace-row"><span class="trace-icon">${icon('clock', 14, 'icon-muted')}</span><div class="trace-info"><strong>Hora de cierre</strong><span>${v.horaCierre || '—'}</span></div></div>
      ${v.bartenderNombre ? `<div class="trace-row"><span class="trace-icon">${icon('wine', 14, 'icon-info')}</span><div class="trace-info"><strong>Preparado por bar</strong><span>${v.bartenderNombre} — ${v.horaBar}</span></div></div>` : ''}
      ${(v.cocineroNombre || v.cocineraNombre) ? `<div class="trace-row"><span class="trace-icon">${icon('chefHat', 14, 'icon-warning')}</span><div class="trace-info"><strong>Preparado por cocina</strong><span>${v.cocineroNombre || v.cocineraNombre} — ${v.horaCocina || v.horacocina || ''}</span></div></div>` : ''}
      ${v.cajeraNombre ? `<div class="trace-row"><span class="trace-icon">${icon('cash', 14, 'icon-success')}</span><div class="trace-info"><strong>Confirmado por caja</strong><span>${v.cajeraNombre} — ${v.horaCaja}</span></div></div>` : ''}
    </div>
    <div class="divider"></div>
    <strong style="font-size:13px;display:block;margin-bottom:10px;">Productos</strong>
    ${v.productos.map(p => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;"><span>${p.qty}x ${p.nombre}</span><span style="color:var(--accent);">Bs. ${p.qty * p.precio}</span></div>`).join('')}
    ${v.nota ? `<div style="padding:8px 10px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--text2);margin-top:8px;">${icon('note', 12)} ${v.nota}</div>` : ''}
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
  tbody.innerHTML = [...DB.anulaciones].reverse().map((a, i) => `
    <tr>
      <td style="color:var(--red);font-weight:700;">#${i + 1}</td>
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
  if (currentUser.rol !== 'admin') {
    list.innerHTML = '<div style="padding:20px;color:red;text-align:center;">Acceso Denegado</div>';
    return;
  }
  if (DB.log.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('fileText', 40, 'icon-muted') + '</div><p>Sin registros</p></div>';
    return;
  }

  // Apply search filter
  const searchInput = document.getElementById('log-search-input');
  const searchTerms = searchInput ? normalizeText(searchInput.value).split(' ').filter(x => x) : [];
  
  let logsToRender = [...DB.log].reverse();
  
  if (searchTerms.length > 0) {
    logsToRender = logsToRender.filter(l => {
      const text = normalizeText(`${l.usuario} ${l.accion}`);
      return searchTerms.every(t => text.includes(t));
    });
  }

  if (logsToRender.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>No se encontraron resultados</p></div>';
    return;
  }
  
  const todayStr = getTodayStr();
  const groupsOrder = [];
  const groups = {};
  
  logsToRender.forEach(l => {
    const f = l.fecha || todayStr;
    if (!groups[f]) {
      groups[f] = [];
      groupsOrder.push(f);
    }
    groups[f].push(l);
  });
  
  let html = '';
  
  groupsOrder.forEach(date => {
    const isToday = date === todayStr;
    
    // Parse DD/MM/YYYY to friendly date
    const parts = date.split('/');
    let dateLabel = date;
    if (parts.length === 3) {
      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const day = parseInt(parts[0], 10);
      const month = months[parseInt(parts[1], 10) - 1];
      dateLabel = `${day} de ${month}`;
    }
    if (isToday) dateLabel = 'Hoy, ' + dateLabel;
    
    html += `
      <div class="log-date-divider" style="margin:20px 0 10px;text-align:center;color:var(--text3);font-size:12px;display:flex;align-items:center;gap:12px;">
        <div style="flex:1;height:1px;background:var(--border);"></div>
        <span style="font-weight:600;letter-spacing:1px;text-transform:uppercase;">${dateLabel}</span>
        <div style="flex:1;height:1px;background:var(--border);"></div>
      </div>
    `;
    
    html += groups[date].map(l => {
      let rName = rolLabel(l.rol);
      if (l.rol === 'cajero' || l.rol === 'caja') rName = 'Cajera';
      if (l.rol === 'bartender' || l.rol === 'bar') rName = 'Bar';
      return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:12px;color:var(--text3);min-width:40px;">${l.hora}</div>
        <div style="width:10px;height:10px;border-radius:50%;background:${rolColor(l.rol)};flex-shrink:0;"></div>
        <div style="flex:1;">
          <strong style="font-size:13px;text-transform:capitalize;">${formatShortName(l.usuario)} <span style="font-size:11px;color:var(--text3);font-weight:normal;">(${rName})</span></strong>
          <span style="font-size:12px;color:var(--text2);margin-left:6px;">${l.accion}</span>
        </div>
        <span style="font-size:11px;color:var(--text3);background:var(--bg2);padding:2px 8px;border-radius:6px;border:1px solid var(--border);">${rolLabel(l.rol)}</span>
      </div>`
    }).join('');
  });
  
  list.innerHTML = html;
}

// ============================================================
// CIERRE DE CAJA — HISTORIAL (ADMIN)
// ============================================================
function renderCierreHistorial() {
  const c = document.getElementById('cierre-historial');
  if (DB.cierres.length === 0) {
    c.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('lock', 40, 'icon-muted') + '</div><p>Sin cierres registrados aún</p></div></div>';
    return;
  }
  c.innerHTML = DB.cierres.map((ci, i) => `
    <div class="cierre-accordion" id="cierre-acc-${i}">
      <div class="cierre-header" onclick="toggleCierreAccordion(${i})">
        <span style="flex-shrink:0;">${icon('lock', 14, 'icon-muted')}</span>
        <span class="cierre-date">${ci.fecha}</span>
        <div class="cierre-summary">
          <span class="cierre-chip green">${icon('cash', 11)} Bs. ${ci.efectivo}</span>
          <span class="cierre-chip blue">${icon('smartphone', 11)} Bs. ${ci.qr}</span>
          ${ci.anulaciones > 0 ? `<span class="cierre-chip red">${icon('alertTriangle', 11)} Bs. ${ci.anulaciones}</span>` : ''}
        </div>
        <span class="cierre-amount">Bs. ${ci.totalVentas}</span>
        <span class="cierre-chevron">${icon('chevronDown', 14)}</span>
      </div>
      <div class="cierre-body">
        <div class="cierre-body-inner">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:8px;">
            <span>Cajero: ${ci.cajero}</span>
            <span>${ci.hora}</span>
          </div>
          <div class="cierre-row"><span>Total ventas</span><span>Bs. ${ci.totalVentas}</span></div>
          <div class="cierre-row"><span>${icon('cash', 13, 'icon-success')} Efectivo cobrado</span><span style="color:var(--green);">Bs. ${ci.efectivo}</span></div>
          <div class="cierre-row"><span>${icon('smartphone', 13, 'icon-info')} QR cobrado</span><span style="color:var(--blue);">Bs. ${ci.qr}</span></div>
          <div class="cierre-row"><span>${icon('alertTriangle', 13, 'icon-danger')} Anulaciones</span><span style="color:var(--red);">Bs. ${ci.anulaciones}</span></div>
          <div class="cierre-row"><span>Cambios devueltos</span><span>Bs. ${ci.cambios}</span></div>
          <div class="cierre-row"><span style="font-weight:600;color:var(--text);">Efectivo neto en caja</span><span style="color:var(--green);font-weight:700;">Bs. ${ci.efectivoNeto}</span></div>
          ${ci.obs ? `<div style="margin-top:8px;padding:8px 10px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--text2);">${icon('note', 12)} ${ci.obs}</div>` : ''}
        </div>
      </div>
    </div>`).join('');
}

function toggleCierreAccordion(index) {
  const el = document.getElementById(`cierre-acc-${index}`);
  if (el) el.classList.toggle('open');
}
