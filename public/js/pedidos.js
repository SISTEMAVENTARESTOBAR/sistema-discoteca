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
let isCajaMode = false;
let cajaModeCliente = null;

function mostrarQR_EMPRESA() {
  // Intentar cargar desde Firebase (compartido entre todos los dispositivos)
  if (typeof db !== 'undefined') {
    db.ref('config/qr_empresa').once('value', snap => {
      const qrImg = snap.val();
      if (qrImg) {
        expandirImagen(qrImg);
      } else {
        // Fallback a localStorage
        const localQR = localStorage.getItem('qr_empresa_img');
        if (localQR) {
          expandirImagen(localQR);
        } else {
          mostrarToast('QR no disponible', 'El administrador aún no ha configurado el QR de pago. Solicítale que lo suba desde Gestión del Menú.');
        }
      }
    });
  } else {
    const qrImg = localStorage.getItem('qr_empresa_img');
    if (qrImg) {
      expandirImagen(qrImg);
    } else {
      mostrarToast('QR no disponible', 'El administrador aún no ha configurado el QR de pago. Solicítale que lo suba desde Gestión del Menú.');
    }
  }
}

function abrirCamara(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.setAttribute('capture', 'environment');
    input.click();
  }
}

function abrirGaleria(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.removeAttribute('capture');
    input.click();
  }
}

function openPedidoModal(mesaId) {
  if (mesaId) {
    isCajaMode = false;
    selectedMesa = DB.mesas.find(m => m.id === mesaId);
    if (!selectedMesa) {
      mostrarToast('Error', 'Esta mesa ya no existe o fue eliminada por un administrador.');
      return;
    }
  } else if (isCajaMode) {
    // Modo caja: no hay mesa seleccionada
    selectedMesa = null;
  } else {
    return;
  }
  
  cart = [];
  selectedPayMethod = null;
  qrFileData = null;
  mixtoFileData = null;
  document.getElementById('modal-pedido-title').textContent = isCajaMode ? 'Nuevo Pedido — Mostrador' : `Pedido — Mesa ${selectedMesa.numero}`;
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
    items.innerHTML = '<div class="empty-state" style="padding:20px;"><div class="empty-icon">' + icon('shoppingCart', 40, 'icon-muted') + '</div><p>Agrega productos al pedido</p></div>';
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

const MAX_IMG_SIZE = 500 * 1024;

function validarImgSize(file) {
  if (file.size > MAX_IMG_SIZE) {
    mostrarToast('Imagen muy grande', `Máximo ${MAX_IMG_SIZE / 1024}KB. La imagen actual pesa ${(file.size / 1024).toFixed(0)}KB.`);
    return false;
  }
  return true;
}

function handleQRUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (!validarImgSize(file)) { input.value = ''; return; }
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
  if (!validarImgSize(file)) { input.value = ''; return; }
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
  if (isCajaMode) {
    // Modo caja: no requiere mesa, el cliente paga en mostrador
    if (cart.length === 0 || !selectedPayMethod) return;
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

    const pedidoId = Date.now();
    const pedido = {
      id: pedidoId,
      mesaId: null,
      mesaNum: 'TL', // Takeaway / Para Llevar
      garzonId: null,
      garzonNombre: '—',
      origen: 'caja',
      clienteNombre,
      productos: [...cart],
      nota,
      total,
      metodo: selectedPayMethod,
      efectivo, qr, cambio, comprobante,
      horaCreacion: hora,
      fecha: hoy,
      estado: 'caja_confirmada',
      bartenderConfirmado: false,
      cocineraConfirmada: false,
    };

    if (typeof db !== 'undefined') {
      db.ref('pedidos/' + pedidoId).set(pedido).catch(e => console.error('Error creando pedido:', e));
    } else {
      DB.pedidos.push(pedido);
    }

    // Notificar a garzones que hay un pedido disponible en caja
    Notificaciones.notificarPedidoCajaDisponible(pedido);

    addLog(`Creó pedido en caja — ${clienteNombre || 'Cliente'} — Bs.${total} — ${metodoLabel(selectedPayMethod)}`);

    isCajaMode = false;
    closeModal('modal-pedido');
    renderCaja();
    return;
  }

  // Modo normal (garzón)
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

  const pedidoId = Date.now();
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
    db.ref('pedidos/' + pedidoId).set(pedido).catch(e => console.error('Error creando pedido:', e));
  } else {
    DB.pedidos.push(pedido);
  }

  Notificaciones.notificarNuevoPedido(pedido);

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
    mostrarToast('Límite alcanzado', 'Has alcanzado el límite de 3 anulaciones por noche. Contacta al administrador.');
    return;
  }
  anularPedidoId = pedidoId;
  document.getElementById('motivo-anulacion').value = '';
  document.getElementById('anulacion-counter-msg').textContent = `Anulaciones hoy: ${anulacionesHoy} de 3 permitidas`;
  openModal('modal-anular');
}

function ejecutarAnulacion() {
  const motivo = document.getElementById('motivo-anulacion').value.trim();
  if (!motivo) { mostrarToast('Error', 'Debes ingresar un motivo'); return; }
  const pedido = DB.pedidos.find(p => p.id === anularPedidoId);
  if (!pedido) return;
  const hoy = getTodayStr();
  const hora = getTimeStr();
  pedido.estado = 'anulado';
  const mesa = DB.mesas.find(m => m.id === pedido.mesaId);
  const anulacionId = Date.now();
  const anulacion = { id: anulacionId, mesa: pedido.mesaNum, garzonId: currentUser.id, garzonNombre: currentUser.nombre, fecha: hoy, hora, monto: pedido.total, motivo };
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedido.id).update({ estado: 'anulado' }).catch(e => console.error(e));
    db.ref('anulaciones/' + anulacionId).set(anulacion).catch(e => console.error(e));
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
  
  const ventaId = Date.now() + 1;
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
    cocineroNombre: pedido.cocineroNombre || null,
    horaCocina: pedido.horaCocina || null,
    estado: 'cobrado',
  };
  
  if (typeof db !== 'undefined') {
    db.ref('pedidos/' + pedido.id).update({ estado: 'entregado', horaCierre: venta.horaCierre }).catch(e => console.error(e));
    db.ref('ventas/' + ventaId).set(venta).catch(e => console.error(e));
  } else {
    pedido.estado = 'entregado';
    pedido.horaCierre = venta.horaCierre;
    DB.ventas.push(venta);
  }
  
  addLog(`Entregó pedido a Mesa ${pedido.mesaNum} — venta registrada`);
  renderMesasGarzon();
}
