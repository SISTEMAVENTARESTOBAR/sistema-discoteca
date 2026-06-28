// ============================================================
// PEDIDOS — Sistema Discoteca
// Carrito, métodos de pago, anulaciones, entrega
// ============================================================

let selectedMesa = null;
let cart = [];
let selectedPayMethod = null;
let qrFileData = null;
let mixtoFileData = null;
let anularPedidoId = null;
let activeCategory = null;

function openPedidoModal(mesaId) {
  selectedMesa = DB.mesas.find(m => m.id === mesaId);
  cart = [];
  selectedPayMethod = null;
  qrFileData = null;
  mixtoFileData = null;
  document.getElementById('modal-pedido-title').textContent = `Pedido — Mesa ${selectedMesa.numero}`;
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
  buildProductGrid();
  renderCart();
  updateConfirmBtn();
  openModal('modal-pedido');
}

function buildProductGrid() {
  const cats = [...new Set(DB.productos.filter(p => p.activo).map(p => p.categoria))];
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

function setActiveCat(cat) {
  activeCategory = cat;
  buildProductGrid();
}

function addToCart(productId) {
  const prod = DB.productos.find(p => p.id === productId);
  const existing = cart.find(c => c.id === productId);
  if (existing) existing.qty++;
  else cart.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, qty: 1 });
  renderCart();
  updateConfirmBtn();
}

function changeQty(productId, delta) {
  const idx = cart.findIndex(c => c.id === productId);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  renderCart();
  updateConfirmBtn();
}

function renderCart() {
  const items = document.getElementById('cart-items');
  const total = cart.reduce((s, c) => s + c.qty * c.precio, 0);
  document.getElementById('cart-total-val').textContent = `Bs. ${total}`;
  document.getElementById('cart-count').textContent = `${cart.reduce((s, c) => s + c.qty, 0)} items`;
  if (cart.length === 0) {
    items.innerHTML = '<div class="empty-state" style="padding:20px;"><div class="empty-icon">🛒</div><p>Agrega productos al pedido</p></div>';
    return;
  }
  items.innerHTML = cart.map(c => `
    <div class="cart-item">
      <div class="cart-item-name">${c.nombre}</div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty(${c.id},-1)">−</button>
        <span class="qty-num">${c.qty}</span>
        <button class="qty-btn" onclick="changeQty(${c.id},1)">+</button>
      </div>
      <div class="cart-item-price">Bs. ${c.qty * c.precio}</div>
    </div>`).join('');
}

function selectPayMethod(method) {
  selectedPayMethod = method;
  ['pay-efectivo', 'pay-qr', 'pay-mixto'].forEach(id => document.getElementById(id).classList.remove('selected'));
  document.getElementById(`pay-${method}`).classList.add('selected');
  document.getElementById('pago-efectivo-fields').style.display = method === 'efectivo' ? 'block' : 'none';
  document.getElementById('pago-qr-fields').style.display = method === 'qr' ? 'block' : 'none';
  document.getElementById('pago-mixto-fields').style.display = method === 'mixto' ? 'block' : 'none';
  updateConfirmBtn();
}

function calcCambio() {
  const total = cart.reduce((s, c) => s + c.qty * c.precio, 0);
  const recibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
  document.getElementById('cambio-display').textContent = `Bs. ${Math.max(0, recibido - total)}`;
  updateConfirmBtn();
}

function calcMixto() {
  const total = cart.reduce((s, c) => s + c.qty * c.precio, 0);
  const ef = parseFloat(document.getElementById('mixto-efectivo').value) || 0;
  const qr = parseFloat(document.getElementById('mixto-qr').value) || 0;
  const sum = ef + qr;
  const display = document.getElementById('mixto-total-display');
  display.textContent = `Bs. ${sum}`;
  display.style.color = sum === total ? 'var(--green)' : 'var(--red)';
  updateConfirmBtn();
}

function handleQRUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    qrFileData = e.target.result;
    document.getElementById('qr-preview-img').src = qrFileData;
    document.getElementById('qr-preview').style.display = 'block';
    document.getElementById('qr-upload-area').classList.add('has-file');
    updateConfirmBtn();
  };
  reader.readAsDataURL(file);
}

function handleMixtoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    mixtoFileData = e.target.result;
    document.getElementById('mixto-preview-img').src = mixtoFileData;
    document.getElementById('mixto-preview').style.display = 'block';
    document.getElementById('mixto-upload-area').classList.add('has-file');
    updateConfirmBtn();
  };
  reader.readAsDataURL(file);
}

function updateConfirmBtn() {
  const btn = document.getElementById('btn-confirmar-pedido');
  if (!btn) return;
  const hasCart = cart.length > 0;
  const total = cart.reduce((s, c) => s + c.qty * c.precio, 0);
  let valid = hasCart && selectedPayMethod;
  if (selectedPayMethod === 'efectivo') {
    const recibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
    valid = valid && recibido >= total;
  }
  if (selectedPayMethod === 'qr') {
    valid = valid && !!qrFileData;
  }
  if (selectedPayMethod === 'mixto') {
    const ef = parseFloat(document.getElementById('mixto-efectivo').value) || 0;
    const qr = parseFloat(document.getElementById('mixto-qr').value) || 0;
    valid = valid && !!mixtoFileData && (ef + qr === total);
  }
  btn.disabled = !valid;
}

function confirmarPedido() {
  if (!selectedMesa || cart.length === 0 || !selectedPayMethod) return;
  const total = cart.reduce((s, c) => s + c.qty * c.precio, 0);
  const clienteNombre = document.getElementById('pedido-cliente').value.trim();
  const nota = document.getElementById('pedido-nota').value.trim();
  const hoy = getTodayStr();
  const hora = getTimeStr();

  let efectivo = 0, qr = 0, cambio = 0, comprobante = null;
  if (selectedPayMethod === 'efectivo') {
    const recibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
    efectivo = total;
    cambio = recibido - total;
    comprobante = null;
  } else if (selectedPayMethod === 'qr') {
    qr = total;
    comprobante = qrFileData;
  } else if (selectedPayMethod === 'mixto') {
    efectivo = parseFloat(document.getElementById('mixto-efectivo').value) || 0;
    qr = parseFloat(document.getElementById('mixto-qr').value) || 0;
    comprobante = mixtoFileData;
  }

  // Crear pedido
  const pedidoId = DB.nextPedidoId++;
  const pedido = {
    id: pedidoId,
    mesaId: selectedMesa.id,
    mesaNum: selectedMesa.numero,
    garzonId: currentUser.id,
    garzonNombre: currentUser.nombre,
    clienteNombre,
    productos: [...cart],
    nota,
    total,
    metodo: selectedPayMethod,
    efectivo, qr, cambio, comprobante,
    horaCreacion: hora,
    fecha: hoy,
    estado: 'pendiente',
    bartenderConfirmado: false,
    cocineraConfirmada: false,
  };
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedidoId).set(pedido);
  } else {
    DB.pedidos.push(pedido);
  }

  // Notificar a la cajera
  Notificaciones.notificarNuevoPedido(pedido);

  // Log
  addLog(`Confirmó pedido Mesa ${selectedMesa.numero} — Bs.${total} — ${metodoLabel(selectedPayMethod)}`);

  closeModal('modal-pedido');
  renderMesasGarzon();
}

// ============================================================
// ANULACIONES (Garzón)
// ============================================================
function initAnular(pedidoId) {
  const hoy = getTodayStr();
  const anulacionesHoy = DB.anulaciones.filter(a => a.garzonId === currentUser.id && a.fecha === hoy).length;
  if (anulacionesHoy >= 3) {
    alert('Has alcanzado el límite de 3 anulaciones por noche. Contacta al administrador.');
    return;
  }
  anularPedidoId = pedidoId;
  document.getElementById('motivo-anulacion').value = '';
  document.getElementById('anulacion-counter-msg').textContent = `Anulaciones hoy: ${anulacionesHoy} de 3 permitidas`;
  openModal('modal-anular');
}

function ejecutarAnulacion() {
  const motivo = document.getElementById('motivo-anulacion').value.trim();
  if (!motivo) { alert('Debes ingresar un motivo'); return; }
  const pedido = DB.pedidos.find(p => p.id === anularPedidoId);
  if (!pedido) return;
  const hoy = getTodayStr();
  const hora = getTimeStr();
  pedido.estado = 'anulado';
  const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
  const anulacionId = DB.anulaciones.length + 1;
  const anulacion = { id: anulacionId, mesa: pedido.mesaNum, garzonId: currentUser.id, garzonNombre: currentUser.nombre, fecha: hoy, hora, monto: pedido.total, motivo };
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedido.id).update({ estado: 'anulado' });
    db.ref('anulaciones/' + anulacionId).set(anulacion);
  } else {
    pedido.estado = 'anulado';
    DB.anulaciones.push(anulacion);
  }
  
  addLog(`Anuló pedido Mesa ${pedido.mesaNum} — Motivo: ${motivo}`);
  closeModal('modal-anular');
  renderMesasGarzon();
}

function marcarEntregadoMesa(pedidoId) {
  const pedido = DB.pedidos.find(p => p.id === pedidoId);
  if (!pedido) return;
  const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
  
  // Crear venta final
  const ventaId = DB.nextVentaId++;
  const venta = {
    id: ventaId,
    mesa: pedido.mesaNum,
    garzonId: pedido.garzonId,
    garzonNombre: pedido.garzonNombre,
    fecha: pedido.fecha,
    hora: pedido.horaCreacion,
    horaCierre: getTimeStr(),
    clienteNombre: pedido.clienteNombre || null,
    productos: pedido.productos,
    nota: pedido.nota,
    total: pedido.total,
    metodo: pedido.metodo,
    efectivo: pedido.efectivo,
    qr: pedido.qr,
    comprobante: pedido.comprobante,
    cajeraId: pedido.cajeraId || null,
    cajeraNombre: pedido.cajeraNombre || null,
    horaCaja: pedido.horaCaja || null,
    cambio: pedido.cambio,
    bartenderNombre: pedido.bartenderNombre || null,
    horaBar: pedido.horaBar || null,
    cocineraNombre: pedido.cocineraNombre || null,
    horacocina: pedido.horacocina || null,
    estado: 'cobrado',
  };
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedido.id).update({ estado: 'entregado', horaCierre: venta.horaCierre });
    db.ref('ventas/' + ventaId).set(venta);
  } else {
    pedido.estado = 'entregado';
    pedido.horaCierre = venta.horaCierre;
    DB.ventas.push(venta);
  }

  // Notificar al sistema para re-renderizar
  setTimeout(() => {
    renderMesasGarzon();
  }, 500);

  addLog(`Entregó pedido a Mesa ${pedido.mesaNum} — venta #${String(venta.id).padStart(4, '0')} registrada`);
  renderMesasGarzon();
}
