// ============================================================
// DASHBOARD EN TIEMPO REAL — Sistema Discoteca
// Panel principal del administrador con métricas live
// ============================================================

let dashboardInterval = null;

function renderDashboard() {
  const hoy = getTodayStr();
  document.getElementById('dash-fecha').textContent = formatFechaLarga(hoy);
  
  // Render initial state
  actualizarMetricasDashboard();
  
  // Start realtime updates (cada 5 segundos)
  if (dashboardInterval) clearInterval(dashboardInterval);
  dashboardInterval = setInterval(actualizarMetricasDashboard, 5000);
}

function actualizarMetricasDashboard() {
  const hoy = getTodayStr();
  const ahora = new Date();
  
  // Ventas hoy
  const ventasHoy = DB.ventas.filter(v => v.fecha === hoy && v.estado === 'cobrado');
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const efectivoHoy = ventasHoy.reduce((s, v) => s + (v.efectivo || 0), 0);
  const qrHoy = ventasHoy.reduce((s, v) => s + (v.qr || 0), 0);
  const countHoy = ventasHoy.length;

  // Animar números
  animateNumber('stat-total', totalHoy, 'Bs. ');
  animateNumber('stat-efectivo', efectivoHoy, 'Bs. ');
  animateNumber('stat-qr', qrHoy, 'Bs. ');
  animateNumber('stat-count', countHoy, '', ' ventas');

  // Alertas
  const alertas = getAlertas();
  animateNumber('stat-alertas', alertas.length);
  const ac = document.getElementById('alertas-container');
  if (alertas.length === 0) {
    ac.innerHTML = '<div class="alert alert-success"><span class="alert-icon">' + icon('checkCircle', 16, 'icon-success') + '</span><div class="alert-text"><strong>Sin alertas activas</strong><span>Todo en orden esta noche</span></div></div>';
  } else {
    ac.innerHTML = alertas.map(a => `<div class="alert alert-${a.tipo}"><span class="alert-icon">${a.icon}</span><div class="alert-text"><strong>${a.titulo}</strong><span>${a.detalle}</span></div></div>`).join('');
  }

  // Métricas en tiempo real (nuevas tarjetas)
  renderMetricasRealtime(hoy, ahora);
  
  // Top productos
  renderTopProductos(ventasHoy);
  
  // Últimas ventas
  renderUltimasVentas(ventasHoy);
}

function renderMetricasRealtime(hoy, ahora) {
  // Pedidos activos
  const pedidosActivos = DB.pedidos.filter(p => 
    p.fecha === hoy && !['cobrado', 'anulado', 'entregado'].includes(p.estado)
  ).length;
  
  // Mesas
  const mesasOcupadas = DB.mesas.filter(m => m.estado !== 'libre').length;
  const mesasTotales = DB.mesas.length;
  const mesasLibres = mesasTotales - mesasOcupadas;
  
  // Colas
  const enCaja = DB.pedidos.filter(p => p.fecha === hoy && p.estado === 'pendiente').length;
  const enBar = DB.pedidos.filter(p => p.fecha === hoy && p.notificarBar && !p.barListo).length;
  const enCocina = DB.pedidos.filter(p => p.fecha === hoy && p.notificarCocina && !p.cocinaListo).length;
  const listos = DB.pedidos.filter(p => p.fecha === hoy && p.estado === 'listo').length;
  
  // Ventas por minuto (últimos 60 min)
  const ventasPorMin = {};
  ventasHoy.forEach(v => {
    const min = v.hora.slice(0, 5);
    ventasPorMin[min] = (ventasPorMin[min] || 0) + v.total;
  });
  const ultimos60 = Object.entries(ventasPorMin)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 60)
    .reverse();
  
  // Actualizar elementos si existen
  const elPedidosActivos = document.getElementById('stat-pedidos-activos');
  const elMesas = document.getElementById('stat-mesas');
  const elColas = document.getElementById('stat-colas');
  const elVentasMin = document.getElementById('stat-ventas-min');
  
  if (elPedidosActivos) animateNumber('stat-pedidos-activos', pedidosActivos);
  if (elMesas) animateNumber('stat-mesas', mesasOcupadas, '', ` / ${mesasTotales}`);
  if (elColas) elColas.innerHTML = `${icon('clock', 14, 'icon-warning')} Caja: ${enCaja} ${icon('wine', 14, 'icon-info')} Bar: ${enBar} ${icon('chefHat', 14, 'icon-warning')} Cocina: ${enCocina} ${icon('checkCircle', 14, 'icon-success')} Listos: ${listos}`;
  if (elVentasMin && ultimos60.length > 0) {
    const totalMin = ultimos60.reduce((s, [, v]) => s + v, 0);
    animateNumber('stat-ventas-min', totalMin, 'Bs. ', ' /min');
  }
}

function renderTopProductos(ventasHoy) {
  const conteo = {};
  const ingresos = {};
  ventasHoy.forEach(v => {
    v.productos.forEach(prod => {
      conteo[prod.nombre] = (conteo[prod.nombre] || 0) + prod.qty;
      ingresos[prod.nombre] = (ingresos[prod.nombre] || 0) + prod.qty * prod.precio;
    });
  });
  const sorted = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
  const tp = document.getElementById('top-productos');
  if (sorted.length === 0) {
    tp.innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('package', 40, 'icon-muted') + '</div><p>Sin ventas hoy</p></div>';
  } else {
    const ranks = ['gold', 'silver', 'bronze', '', ''];
    tp.innerHTML = sorted.map((nombre, i) => `
      <div class="top-product">
        <div class="top-rank ${ranks[i]}">${i + 1}</div>
        <div class="top-info"><div class="tname">${nombre}</div></div>
        <div class="top-units"><strong>${conteo[nombre]} uds</strong>Bs. ${ingresos[nombre]}</div>
      </div>`).join('');
  }
}

function renderUltimasVentas(ventasHoy) {
  const uv = document.getElementById('ultimas-ventas');
  const ultimas = [...ventasHoy].reverse().slice(0, 5);
  if (ultimas.length === 0) {
    uv.innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('fileText', 40, 'icon-muted') + '</div><p>Sin ventas aún</p></div>';
  } else {
    uv.innerHTML = ultimas.map(v => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:500;">Mesa ${v.mesa} — ${v.garzonNombre}</div>
          <div style="font-size:11px;color:var(--text3);">${v.fecha} ${v.hora}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;font-weight:700;font-family:'Syne',sans-serif;">Bs. ${v.total}</div>
          <span class="badge badge-${v.metodo}">${metodoLabel(v.metodo)}</span>
        </div>
      </div>`).join('');
  }
}

function animateNumber(elementId, value, prefix = '', suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;
  
  const currentText = el.textContent;
  const currentNum = parseFloat(currentText.replace(/[^\d.-]/g, '')) || 0;
  const targetNum = typeof value === 'number' ? value : parseFloat(value) || 0;
  
  if (currentNum === targetNum) return;
  
  const duration = 500;
  const startTime = Date.now();
  const startNum = currentNum;
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = startNum + (targetNum - startNum) * eased;
    
    if (Number.isInteger(targetNum)) {
      el.textContent = `${prefix}${Math.round(current)}${suffix}`;
    } else {
      el.textContent = `${prefix}${current.toFixed(2)}${suffix}`;
    }
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

function getAlertas() {
  const alertas = [];
  const hoy = getTodayStr();
  DB.usuarios.filter(u => u.rol === 'garzon').forEach(g => {
    const count = DB.anulaciones.filter(a => a.garzonId === g.id && a.fecha === hoy).length;
    if (count >= 3) {
      alertas.push({ tipo: 'danger', icon: icon('xCircle', 16, 'icon-danger'), titulo: `${g.nombre} — ${count} anulaciones esta noche`, detalle: 'Límite alcanzado — no puede anular más pedidos' });
    } else if (count > 0) {
      alertas.push({ tipo: 'warning', icon: icon('alertTriangle', 16, 'icon-warning'), titulo: `${g.nombre} — ${count} anulación(es) hoy`, detalle: 'Cuidado: cerca del límite de 3' });
    }
  });
  DB.mesas.filter(m => m.estado !== 'libre' && m.estado !== 'entregado').forEach(m => {
    const pedido = DB.pedidos.find(p => p.mesaId === m.id && p.estado !== 'cobrado' && p.estado !== 'anulado');
    if (pedido) {
      const elapsed = getMinutesAgo(pedido.horaCreacion);
      if (elapsed > 60) {
        const g = DB.usuarios.find(u => u.id === m.garzonId);
        alertas.push({ tipo: 'warning', icon: icon('alertTriangle', 16, 'icon-warning'), titulo: `Mesa ${m.numero} — ${g ? g.nombre : ''}`, detalle: `Pedido abierto hace ${elapsed} min sin cobrar` });
      } else if (elapsed > 30) {
        const g = DB.usuarios.find(u => u.id === m.garzonId);
        alertas.push({ tipo: 'info', icon: icon('clock', 16, 'icon-info'), titulo: `Mesa ${m.numero} — ${g ? g.nombre : ''}`, detalle: `Pedido hace ${elapsed} min` });
      }
    }
  });
  return alertas;
}

// Cleanup al cambiar de página
function destroyDashboard() {
  if (dashboardInterval) {
    clearInterval(dashboardInterval);
    dashboardInterval = null;
  }
}