// ============================================================
// DASHBOARD — Sistema Discoteca
// Panel principal del administrador
// ============================================================

function renderDashboard() {
  const hoy = getTodayStr();
  document.getElementById('dash-fecha').textContent = formatFechaLarga(hoy);

  const ventasHoy = DB.ventas.filter(v => v.fecha === hoy && v.estado === 'cobrado');
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const efectivoHoy = ventasHoy.reduce((s, v) => s + (v.efectivo || 0), 0);
  const qrHoy = ventasHoy.reduce((s, v) => s + (v.qr || 0), 0);

  document.getElementById('stat-total').textContent = `Bs. ${totalHoy}`;
  document.getElementById('stat-efectivo').textContent = `Bs. ${efectivoHoy}`;
  document.getElementById('stat-qr').textContent = `Bs. ${qrHoy}`;

  const alertas = getAlertas();
  document.getElementById('stat-alertas').textContent = alertas.length;
  const ac = document.getElementById('alertas-container');
  if (alertas.length === 0) {
    ac.innerHTML = '<div class="alert alert-success"><span class="alert-icon">' + icon('checkCircle', 16, 'icon-success') + '</span><div class="alert-text"><strong>Sin alertas activas</strong><span>Todo en orden esta noche</span></div></div>';
  } else {
    ac.innerHTML = alertas.map(a => `<div class="alert alert-${a.tipo}"><span class="alert-icon">${a.icon}</span><div class="alert-text"><strong>${a.titulo}</strong><span>${a.detalle}</span></div></div>`).join('');
  }

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

function getAlertas() {
  const alertas = [];
  const hoy = getTodayStr();
  DB.usuarios.filter(u => u.rol === 'garzon').forEach(g => {
    const count = DB.anulaciones.filter(a => a.garzonId === g.id && a.fecha === hoy).length;
    if (count >= 3) {
      alertas.push({ tipo: 'danger', icon: icon('xCircle', 16, 'icon-danger'), titulo: `${g.nombre} — ${count} anulaciones esta noche`, detalle: 'Límite alcanzado — no puede anular más pedidos' });
    }
  });
  DB.mesas.filter(m => m.estado !== 'libre' && m.estado !== 'entregado').forEach(m => {
    const pedido = DB.pedidos.find(p => p.mesaId === m.id && p.estado !== 'cobrado' && p.estado !== 'anulado');
    if (pedido) {
      const elapsed = getMinutesAgo(pedido.horaCreacion);
      if (elapsed > 60) {
        const g = DB.usuarios.find(u => u.id === m.garzonId);
        alertas.push({ tipo: 'warning', icon: icon('alertTriangle', 16, 'icon-warning'), titulo: `Mesa ${m.numero} — ${g ? g.nombre : ''}`, detalle: `Pedido abierto hace ${elapsed} min sin cobrar` });
      }
    }
  });
  return alertas;
}
