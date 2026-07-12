// ============================================================
// CAJA — Sistema Discoteca
// Panel de la cajera, confirmación de cobros, cierre de caja POR TURNOS
// ============================================================

let confirmarCajaVentaId = null;

// ============================================================
// TURNOS (Cierre de caja por turnos)
// ============================================================

async function abrirTurno() {
  const hoy = getTodayStr();
  const hora = getTimeStr();
  
  // Verificar si ya hay turno abierto hoy
  const turnoAbierto = DB.turnos.find(t => t.fecha === hoy && t.estado === 'abierto');
  if (turnoAbierto) {
    mostrarToast('Turno ya abierto', `Hay un turno abierto desde ${turnoAbierto.horaApertura}`);
    return;
  }
  
  mostrarPrompt('Apertura de Turno', 'Fondo inicial en caja (Bs.)', async (fondo) => {
    if (fondo === null) return;
    const fondoInicial = parseFloat(fondo) || 0;
    
    const turno = {
      id: Date.now().toString(),
      fecha: hoy,
      horaApertura: hora,
      fondoInicial,
      cajeroId: currentUser.id,
      cajeroNombre: currentUser.nombre,
      estado: 'abierto',
      creadoEn: Date.now()
    };
    
    if (typeof db !== 'undefined') {
      await db.ref('turnos/' + turno.id).set(turno);
    } else {
      DB.turnos.push(turno);
    }
    DB.currentTurnoId = turno.id;
    
    addLog(`Abrió turno — Fondo inicial: Bs. ${fondoInicial}`);
    mostrarToast('Turno abierto', `Fondo inicial: Bs. ${fondoInicial}`);
    renderCaja();
  });
}

async function cerrarTurno() {
  const turno = DB.turnos.find(t => t.id === DB.currentTurnoId);
  if (!turno) {
    mostrarToast('Error', 'No hay turno abierto para cerrar');
    return;
  }
  
  // Verificar pedidos pendientes antes de cerrar
  const pendientes = DB.pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'esperando_pago');
  if (pendientes.length > 0) {
    mostrarConfirm('Cerrar Turno',
      `${icon('alertTriangle', 16, 'icon-warning')} <strong>${pendientes.length} pedido${pendientes.length !== 1 ? 's' : ''} pendiente${pendientes.length !== 1 ? 's' : ''}</strong>
      <br><span style="font-size:13px;color:var(--text2);">Se asignarán al próximo turno. ¿Cerrar de todas formas?</span>`,
      ok => { if (ok) mostrarModalCierreTurno(turno); }
    );
  } else {
    mostrarModalCierreTurno(turno);
  }
}

function mostrarModalCierreTurno(turno) {
  const hoy = getTodayStr();
  const hora = getTimeStr();
  
  const ventasTurno = DB.ventas.filter(v => 
    v.fecha === hoy && 
    v.hora >= turno.horaApertura && 
    v.hora <= hora &&
    v.estado === 'cobrado'
  );
  
  const totalVentas = Number(ventasTurno.reduce((s, v) => s + v.total, 0).toFixed(2));
  const efectivoSistema = Number(ventasTurno.reduce((s, v) => s + (v.efectivo || 0), 0).toFixed(2));
  const qrSistema = Number(ventasTurno.reduce((s, v) => s + (v.qr || 0), 0).toFixed(2));
  const cambios = Number(ventasTurno.reduce((s, v) => s + (v.cambio || 0), 0).toFixed(2));
  const efectivoNetoSistema = Number((efectivoSistema - cambios).toFixed(2));
  
  document.getElementById('modal-caja-title').textContent = `Cerrar Turno`;
  document.getElementById('modal-caja-body').innerHTML = `
    <div style="text-align:center;padding:12px 0 20px;">
      <div style="font-size:24px;margin-bottom:6px;color:var(--accent);">${icon('lock', 24)}</div>
      <div style="font-size:13px;color:var(--text2);">Cajero: <strong>${turno.cajeroNombre}</strong></div>
      <div style="font-size:12px;color:var(--text3);margin-top:2px;">${turno.fecha} — ${turno.horaApertura} a ${hora}</div>
    </div>
    
    <div style="background:var(--bg2);border-radius:14px;padding:20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text2);">Total ventas</span>
        <span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--text);">Bs. ${totalVentas}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text2);display:flex;align-items:center;gap:6px;">${icon('cash', 14, 'icon-success')} Efectivo</span>
        <span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--green);">Bs. ${efectivoSistema}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text2);display:flex;align-items:center;gap:6px;">${icon('smartphone', 14, 'icon-info')} QR</span>
        <span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--blue);">Bs. ${qrSistema}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text2);">Cambios devueltos</span>
        <span style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--red);">Bs. ${cambios}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0 4px;">
        <span style="font-size:14px;font-weight:600;color:var(--text);">Efectivo neto (sistema)</span>
        <span style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--green);">Bs. ${efectivoNetoSistema}</span>
      </div>
    </div>
    
    <div style="font-size:12px;font-weight:600;color:var(--text2);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">Arqueo de caja</div>
    <div class="form-group">
      <label>Efectivo contado en caja (Bs.)</label>
      <input type="number" id="cierre-efectivo-contado" placeholder="0" step="0.01" oninput="calcDiferencia()">
    </div>
    <div class="form-group">
      <label>QR contado (Bs.)</label>
      <input type="number" id="cierre-qr-contado" placeholder="0" step="0.01" oninput="calcDiferencia()">
    </div>
    <div id="diferencia-display" style="padding:14px 16px;background:var(--bg2);border-radius:12px;display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <span style="font-size:13px;color:var(--text2);">Diferencia:</span>
      <strong id="diferencia-val" style="font-family:'Syne',sans-serif;font-size:18px;font-weight:700;color:var(--green);">Bs. 0</strong>
    </div>
    <div class="form-group">
      <label>Observaciones</label>
      <textarea id="cierre-obs" rows="2" placeholder="Diferencias, novedades..."></textarea>
    </div>
    <div class="modal-footer" style="padding:16px 0 0;border-top:1px solid var(--border);margin-top:16px;">
      <button class="btn btn-outline" onclick="closeModal('modal-confirmar-caja')">Cancelar</button>
      <button class="btn btn-success" onclick="confirmarCierreTurno('${turno.id}', ${totalVentas}, ${efectivoSistema}, ${qrSistema}, ${cambios}, ${efectivoNetoSistema})">Confirmar cierre</button>
    </div>`;
  openModal('modal-confirmar-caja');
}

function calcDiferencia() {
  const turno = DB.turnos.find(t => t.id === DB.currentTurnoId);
  if (!turno) return;
  
  const ventasTurno = DB.ventas.filter(v => 
    v.fecha === turno.fecha && 
    v.hora >= turno.horaApertura && 
    v.hora <= getTimeStr() &&
    v.estado === 'cobrado'
  );
  const efectivoSistema = ventasTurno.reduce((s, v) => s + (v.efectivo || 0), 0);
  const cambios = ventasTurno.reduce((s, v) => s + (v.cambio || 0), 0);
  const efectivoNetoSistema = efectivoSistema - cambios;
  
  const contado = parseFloat(document.getElementById('cierre-efectivo-contado').value) || 0;
  const diff = Number((contado - efectivoNetoSistema).toFixed(2));
  
  const el = document.getElementById('diferencia-val');
  el.textContent = `Bs. ${diff >= 0 ? '+' : ''}${diff}`;
  el.style.color = diff === 0 ? 'var(--green)' : (diff > 0 ? 'var(--blue)' : 'var(--red)');
  el.style.fontFamily = "'Syne',sans-serif";
  el.style.fontSize = '18px';
  el.style.fontWeight = '700';
}

async function confirmarCierreTurno(turnoId, totalVentas, efectivoSistema, qrSistema, cambios, efectivoNetoSistema) {
  const efectivoContado = parseFloat(document.getElementById('cierre-efectivo-contado').value) || 0;
  const qrContado = parseFloat(document.getElementById('cierre-qr-contado').value) || 0;
  const obs = document.getElementById('cierre-obs').value.trim();
  const hoy = getTodayStr();
  const hora = getTimeStr();
  const diferenciaEfectivo = Number((efectivoContado - efectivoNetoSistema).toFixed(2));
  
  const cierre = {
    estado: 'cerrado',
    horaCierre: hora,
    efectivoContado,
    qrContado,
    totalVentas,
    efectivoSistema,
    qrSistema,
    cambios,
    efectivoNetoSistema,
    diferenciaEfectivo,
    observaciones: obs,
    cerradoPor: currentUser.id,
    cerradoPorNombre: currentUser.nombre,
    cerradoEn: Date.now()
  };
  
  if (typeof db !== 'undefined') {
    await db.ref('turnos/' + turnoId).update(cierre);
    await db.ref('cierres').push({ ...cierre, tipo: 'turno', fechaCierre: hoy, turnoId });
  } else {
    const idx = DB.turnos.findIndex(t => t.id === turnoId);
    if (idx !== -1) DB.turnos[idx] = { ...DB.turnos[idx], ...cierre };
    DB.cierres.push({ ...cierre, tipo: 'turno', fechaCierre: hoy, turnoId });
  }
  
  DB.currentTurnoId = null;
  addLog(`Cerró turno — Total: Bs. ${totalVentas} | Diff: Bs. ${diferenciaEfectivo}`);
  mostrarToast('Turno cerrado', `Total: Bs. ${totalVentas} | Diff efectivo: Bs. ${diferenciaEfectivo}`);
  closeModal('modal-confirmar-caja');
  renderCaja();
}

function renderTurnosHistorial() {
  const container = document.getElementById('cierre-historial');
  if (!container) return;
  
  const turnosCerrados = DB.turnos.filter(t => t.estado === 'cerrado').sort((a, b) => b.creadoEn - a.creadoEn);
  
  if (turnosCerrados.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('lock', 40, 'icon-muted') + '</div><p>Sin turnos cerrados aún</p></div></div>';
    return;
  }
  
  container.innerHTML = turnosCerrados.map(t => `
    <div class="cierre-accordion" id="turno-acc-${t.id}">
      <div class="cierre-header" onclick="toggleCierreAccordion('turno-acc-${t.id}')">
        <span style="flex-shrink:0;">${icon('lock', 14, 'icon-muted')}</span>
        <span class="cierre-date">${t.fecha} ${t.horaApertura} - ${t.horaCierre}</span>
        <div class="cierre-summary">
          <span class="cierre-chip green">${icon('cash', 11)} Bs. ${t.efectivoSistema || 0}</span>
          <span class="cierre-chip blue">${icon('smartphone', 11)} Bs. ${t.qrSistema || 0}</span>
          ${t.diferenciaEfectivo !== 0 ? `<span class="cierre-chip ${t.diferenciaEfectivo > 0 ? 'blue' : 'red'}">${icon('alertTriangle', 11)} ${t.diferenciaEfectivo > 0 ? '+' : ''}Bs. ${t.diferenciaEfectivo}</span>` : ''}
        </div>
        <span class="cierre-amount">Bs. ${t.totalVentas || 0}</span>
        <span class="cierre-chevron">${icon('chevronDown', 14)}</span>
      </div>
      <div class="cierre-body">
        <div class="cierre-body-inner">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-bottom:8px;">
            <span>Cajero: ${t.cajeroNombre}</span>
            <span>${t.cerradoPorNombre || ''}</span>
          </div>
          <div class="cierre-row"><span>Fondo inicial</span><span>Bs. ${t.fondoInicial || 0}</span></div>
          <div class="cierre-row"><span>Total ventas</span><span>Bs. ${t.totalVentas || 0}</span></div>
          <div class="cierre-row"><span>${icon('cash', 13, 'icon-success')} Efectivo (sistema)</span><span style="color:var(--green);">Bs. ${t.efectivoSistema || 0}</span></div>
          <div class="cierre-row"><span>${icon('smartphone', 13, 'icon-info')} QR (sistema)</span><span style="color:var(--blue);">Bs. ${t.qrSistema || 0}</span></div>
          <div class="cierre-row"><span>Cambios devueltos</span><span>Bs. ${t.cambios || 0}</span></div>
          <div class="cierre-row"><span style="font-weight:600;">Efectivo neto (sistema)</span><span style="color:var(--green);font-weight:700;">Bs. ${t.efectivoNetoSistema || 0}</span></div>
          <div class="cierre-row"><span>Efectivo contado</span><span style="color:${(t.diferenciaEfectivo || 0) >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700;">Bs. ${t.efectivoContado || 0}</span></div>
          <div class="cierre-row"><span>QR contado</span><span style="color:var(--blue);font-weight:700;">Bs. ${t.qrContado || 0}</span></div>
          <div class="cierre-row"><span style="font-weight:600;color:var(--text);">Diferencia</span><span style="color:${(t.diferenciaEfectivo || 0) >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700;">Bs. ${(t.diferenciaEfectivo || 0) >= 0 ? '+' : ''}${t.diferenciaEfectivo || 0}</span></div>
          ${t.observaciones ? `<div style="margin-top:8px;padding:8px 10px;background:var(--bg2);border-radius:8px;font-size:12px;color:var(--text2);">${icon('note', 12)} ${t.observaciones}</div>` : ''}
        </div>
      </div>
    </div>`).join('');
}

// ============================================================
// CAJA - Panel de cobros pendientes
// ============================================================

function renderCaja() {
  if (currentUser.rol !== 'cajero' && currentUser.rol !== 'admin') {
    document.getElementById('caja-cobros').innerHTML = '<div style="padding:20px;color:red;text-align:center;">Acceso Denegado</div>';
    return;
  }

  const pendientes = DB.pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'esperando_pago');
  const container = document.getElementById('caja-cobros');
  const hoy = getTodayStr();
  const turnoActivo = DB.turnos.find(t => t.fecha === hoy && t.estado === 'abierto');

  if (pendientes.length === 0) {
    container.innerHTML = '<div class="card"><div class="empty-state"><div class="empty-icon">' + icon('checkCircle', 40, 'icon-success') + '</div><p>Sin cobros pendientes</p></div></div>';
  } else {
    // Banner si hay pendientes pero no hay turno activo
    let banner = '';
    if (!turnoActivo) {
      banner = `
        <div style="background:rgba(244,67,54,0.12);border:1px solid rgba(244,67,54,0.3);border-radius:12px;padding:16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(244,67,54,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--red);">${icon('alertTriangle', 18, 'icon-danger')}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;color:var(--red);">${pendientes.length} pedido${pendientes.length !== 1 ? 's' : ''} pendiente${pendientes.length !== 1 ? 's' : ''}</div>
            <div style="font-size:12px;color:var(--text2);margin-top:2px;">Abre un turno para confirmar los cobros. Mientras tanto, los pedidos se acumulan aquí.</div>
          </div>
        </div>`;
    }
    container.innerHTML = banner + pendientes.map(p => {
      const metIcon = metodoIcon(p.metodo);
      const puedeConfirmar = !!turnoActivo;
      return `<div class="card" style="margin-bottom:12px;${!puedeConfirmar ? 'opacity:0.7;' : ''}">
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
          ${puedeConfirmar
            ? `<button class="btn btn-success" style="flex:2;" onclick="openConfirmarCaja(${p.id})">${icon('checkCircle', 13)} Confirmar recepción</button>`
            : `<button class="btn btn-outline" style="flex:2;color:var(--text3);border-color:var(--border);cursor:not-allowed;" onclick="mostrarToast('Sin turno', 'Debes abrir un turno para confirmar pedidos')">${icon('lock', 13)} Abrir turno primero</button>`
          }
        </div>
      </div>`;
    }).join('');
  }

  // Resumen del turno actual
  renderResumenTurnoActual();
  
  // Actualizar botón turno
  updateTurnoButton();
  
  // Historial de turnos (abajo)
  renderTurnosHistorial();
}

function updateTurnoButton() {
  const btnTurno = document.getElementById('btn-turno-content');
  if (!btnTurno) return;
  
  const hoy = getTodayStr();
  const turnoAbierto = DB.turnos.find(t => t.fecha === hoy && t.estado === 'abierto');
  
  if (turnoAbierto) {
    btnTurno.className = 'btn btn-danger';
    btnTurno.innerHTML = `${icon('lock', 16)} Cerrar Turno`;
    btnTurno.style.padding = '12px 32px';
    btnTurno.style.fontSize = '14px';
  }
}

function renderResumenTurnoActual() {
  const container = document.getElementById('cierre-summary-data');
  if (!container) return;
  
  const hoy = getTodayStr();
  const turno = DB.turnos.find(t => t.fecha === hoy && t.estado === 'abierto');
  
  if (!turno) {
    container.innerHTML = `
      <div style="text-align:center;padding:30px 20px;">
        <div style="font-size:13px;color:var(--text3);margin-bottom:16px;">No hay turno abierto</div>
        <button class="btn btn-primary" id="btn-turno-content" onclick="toggleTurno()" style="padding:12px 32px;font-size:14px;">
          ${icon('lock', 16, 'icon-success')} Abrir Turno
        </button>
        <div style="font-size:11px;color:var(--text3);margin-top:10px;">Haz clic para comenzar tu turno</div>
      </div>`;
    return;
  }
  
  const cobradas = DB.pedidos.filter(p => 
    p.fecha === hoy && 
    p.horaCreacion >= turno.horaApertura &&
    ['caja_confirmada', 'listo', 'entregado'].includes(p.estado)
  );
  const totalV = Number(cobradas.reduce((s, p) => s + p.total, 0).toFixed(2));
  const ef = Number(cobradas.reduce((s, p) => s + (p.efectivo || 0), 0).toFixed(2));
  const qr = Number(cobradas.reduce((s, p) => s + (p.qr || 0), 0).toFixed(2));
  const anulMonto = Number(DB.anulaciones.filter(a => a.fecha === hoy && a.hora >= turno.horaApertura).reduce((s, a) => s + a.monto, 0).toFixed(2));
  const cambios = Number(cobradas.reduce((s, p) => s + (p.cambio || 0), 0).toFixed(2));
  
  container.innerHTML = `
    <div class="cierre-row"><span>Turno: ${turno.fecha} ${turno.horaApertura} - ${getTimeStr()}</span></div>
    <div class="cierre-row"><span>Cajero: ${turno.cajeroNombre}</span></div>
    <div class="cierre-row"><span>Fondo inicial</span><span>Bs. ${turno.fondoInicial || 0}</span></div>
    <div class="cierre-row"><span>Total ventas turno</span><span>Bs. ${totalV}</span></div>
    <div class="cierre-row"><span>${icon('cash', 14)} Efectivo cobrado</span><span style="color:var(--green);">Bs. ${ef}</span></div>
    <div class="cierre-row"><span>${icon('smartphone', 14)} QR cobrado</span><span style="color:var(--blue);">Bs. ${qr}</span></div>
    <div class="cierre-row"><span>${icon('alertTriangle', 14)} Anulaciones</span><span style="color:var(--red);">Bs. ${anulMonto}</span></div>
    <div class="cierre-row"><span>Cambios devueltos</span><span>Bs. ${cambios}</span></div>
    <div class="cierre-row"><span>Efectivo neto (sistema)</span><span style="color:var(--green);">Bs. ${Number((ef - cambios).toFixed(2))}</span></div>
    <div class="cierre-row">
      <button class="btn btn-danger" style="width:100%;margin-top:8px;" onclick="cerrarTurno()">${icon('lock', 14)} Cerrar Turno</button>
    </div>`;
}

function openConfirmarCaja(pedidoId) {
  const hoy = getTodayStr();
  const turnoActivo = DB.turnos.find(t => t.fecha === hoy && t.estado === 'abierto');
  if (!turnoActivo) {
    mostrarToast('Sin turno activo', 'Debes abrir un turno antes de confirmar pedidos');
    return;
  }
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

// ============================================================
// BOTÓN TOGGLE TURNO (abrir/cerrar)
// ============================================================

function toggleTurno() {
  const hoy = getTodayStr();
  const turnoAbierto = DB.turnos.find(t => t.fecha === hoy && t.estado === 'abierto');
  
  if (turnoAbierto) {
    // Si hay turno abierto, preguntar si cerrar
    mostrarConfirm('Cerrar Turno', `¿Cerrar turno de ${turnoAbierto.horaApertura}?<br><strong>Se registrará el arqueo de caja.</strong>`, ok => {
      if (ok) cerrarTurno();
    });
  } else {
    abrirTurno();
  }
}
