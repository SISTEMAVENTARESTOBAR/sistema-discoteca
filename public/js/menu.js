// ============================================================
// MENÚ — Sistema Discoteca
// Gestión de productos (admin)
// ============================================================

let menuActiveCat = null;

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
