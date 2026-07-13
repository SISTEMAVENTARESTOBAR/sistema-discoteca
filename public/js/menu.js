// ============================================================
// MENÚ — Sistema Discoteca
// Gestión de productos (admin)
// ============================================================

let menuActiveCat = null;

function subirQREmpresa(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 500 * 1024) {
    mostrarToast('Imagen muy grande', 'Máximo 500KB');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const dataUrl = e.target.result;
    localStorage.setItem('qr_empresa_img', dataUrl);
    const preview = document.getElementById('qr-empresa-preview-mini');
    if (preview) {
      preview.innerHTML = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:cover;">`;
    }
    mostrarToast('QR guardado', 'El QR de pago se ha guardado correctamente');
    addLog('Subió QR de pago de la empresa');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function eliminarQREmpresa() {
  mostrarConfirm('Eliminar QR', '¿Eliminar el QR de pago de la empresa?', ok => {
    if (ok) {
      localStorage.removeItem('qr_empresa_img');
      const preview = document.getElementById('qr-empresa-preview-mini');
      if (preview) {
        preview.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
      }
      mostrarToast('QR eliminado', 'El QR de pago ha sido eliminado');
      addLog('Eliminó QR de pago de la empresa');
    }
  });
}

function loadQREmpresaPreview() {
  const qrImg = localStorage.getItem('qr_empresa_img');
  const preview = document.getElementById('qr-empresa-preview-mini');
  if (qrImg && preview) {
    preview.innerHTML = `<img src="${qrImg}" style="width:100%;height:100%;object-fit:cover;">`;
  }
}

function renderMenu() {
  const cats = [...new Set(DB.productos.map(p => p.categoria))];
  if (cats.length === 0) {
    document.getElementById('menu-tabs').innerHTML = '';
    document.getElementById('menu-productos-grid').innerHTML = '<div class="empty-state"><div class="empty-icon">' + icon('package', 40, 'icon-muted') + '</div><p>No hay productos aún. Crea uno nuevo.</p></div>';
    return;
  }
  if (!menuActiveCat || !cats.includes(menuActiveCat)) menuActiveCat = cats[0];

  const tabs = document.getElementById('menu-tabs');
  tabs.innerHTML = cats.map(c => `<button class="tab-btn ${c === menuActiveCat ? 'active' : ''}" onclick="setMenuCat('${c}')">${c}</button>`).join('');

  const grid = document.getElementById('menu-productos-grid');
  const productos = DB.productos.filter(p => p.categoria === menuActiveCat);
  grid.innerHTML = productos.map(p => `
    <div class="card card-sm" style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <strong style="font-size:13px;">${p.nombre}</strong>
        <span class="badge ${p.activo ? 'badge-delivered' : 'badge-cancelled'}">${p.activo ? 'Activo' : 'Inactivo'}</span>
      </div>
      <div style="font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:var(--accent);">Bs. ${p.precio}</div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-outline btn-sm" onclick="editarProductoPrecio(${p.id})" style="flex:1;">Editar</button>
        <button class="btn btn-outline btn-sm" onclick="toggleProducto(${p.id})">${p.activo ? 'Desactivar' : 'Activar'}</button>
      </div>
    </div>`).join('');
  
  loadQREmpresaPreview();
}

function setMenuCat(cat) {
  menuActiveCat = cat;
  renderMenu();
}

function crearProducto() {
  const nombre = document.getElementById('np-nombre').value.trim();
  const precio = parseFloat(document.getElementById('np-precio').value);
  const categoria = document.getElementById('np-categoria').value;
  if (!nombre || !precio) return mostrarToast('Error', 'Completa todos los campos');

  const id = Date.now();
  const nuevoProducto = { id, nombre, precio, categoria, activo: true };

  if (typeof db !== 'undefined') {
    db.ref('productos/' + id).set(nuevoProducto);
  } else {
    DB.productos.push(nuevoProducto);
  }

  addLog(`Creó producto "${nombre}" — Bs. ${precio} — ${categoria}`);
  closeModal('modal-nuevo-producto');
  document.getElementById('np-nombre').value = '';
  document.getElementById('np-precio').value = '';
  renderMenu();
}

function toggleProducto(id) {
  const p = DB.productos.find(x => x.id === id);
  if (!p) return;
  p.activo = !p.activo;

  if (typeof db !== 'undefined') {
    db.ref('productos/' + id).update({ activo: p.activo });
  }

  addLog(`${p.activo ? 'Activó' : 'Desactivó'} producto "${p.nombre}"`);
  renderMenu();
}

function editarProductoPrecio(id) {
  const p = DB.productos.find(x => x.id === id);
  if (!p) return;
  mostrarPrompt(
    `Nuevo precio para "${p.nombre}"`,
    `Precio actual: Bs. ${p.precio}`,
    nuevo => {
      if (nuevo === null) return;
      const val = parseFloat(nuevo);
      if (isNaN(val) || val <= 0) {
        mostrarToast('Error', 'Ingresa un precio válido mayor a 0');
        return;
      }
      const precioAnterior = p.precio;
      p.precio = val;
      if (typeof db !== 'undefined') {
        db.ref('productos/' + id).update({ precio: p.precio }).catch(e => console.error(e));
      }
      addLog(`Editó precio de "${p.nombre}": Bs. ${precioAnterior} → Bs. ${p.precio}`);
      renderMenu();
    }
  );
}

