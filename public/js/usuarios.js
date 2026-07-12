// ============================================================
// USUARIOS — Sistema Discoteca
// Gestión de usuarios (admin)
// ============================================================

function renderUsuarios() {
  const tbody = document.getElementById('usuarios-tbody');
  tbody.innerHTML = DB.usuarios.map(u => `
    <tr>
      <td style="font-weight:500;">${u.nombre}</td>
      <td style="color:var(--text3);">@${u.usuario}</td>
      <td><span style="font-size:12px;padding:3px 10px;border-radius:20px;background:var(--bg2);color:var(--text2);">${rolLabel(u.rol)}</span></td>
      <td><span class="badge ${u.activo ? 'badge-delivered' : 'badge-cancelled'}">${u.activo ? icon('checkCircle', 12, 'icon-success') + ' Activo' : icon('xCircle', 12, 'icon-danger') + ' Inactivo'}</span></td>
      <td>
        ${u.rol !== 'admin' ? `<button class="btn btn-outline btn-sm" onclick="toggleUsuario(${u.id})">${u.activo ? 'Desactivar' : 'Activar'}</button>` : '—'}
      </td>
    </tr>`).join('');
}

function crearUsuario() {
  const nombre = document.getElementById('nu-nombre').value.trim();
  const usuario = document.getElementById('nu-usuario').value.trim();
  const pass = document.getElementById('nu-pass').value.trim();
  const rol = document.getElementById('nu-rol').value;
  if (!nombre || !usuario || !pass) return mostrarToast('Error', 'Completa todos los campos');
  if (DB.usuarios.find(u => u.usuario === usuario)) return mostrarToast('Error', 'Ese usuario ya existe');

  const id = Date.now();
  const nuevoUsuario = { id, nombre, usuario, pass, rol, activo: true };

  if (typeof db !== 'undefined') {
    db.ref('usuarios/' + id).set(nuevoUsuario);
  } else {
    DB.usuarios.push(nuevoUsuario);
  }

  addLog(`Creó usuario "${nombre}" con rol ${rolLabel(rol)}`);
  closeModal('modal-nuevo-usuario');
  document.getElementById('nu-nombre').value = '';
  document.getElementById('nu-usuario').value = '';
  document.getElementById('nu-pass').value = '';
  renderUsuarios();
}

function toggleUsuario(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (!u) return;
  u.activo = !u.activo;

  if (typeof db !== 'undefined') {
    db.ref('usuarios/' + id).update({ activo: u.activo });
  }

  addLog(`${u.activo ? 'Activó' : 'Desactivó'} usuario "${u.nombre}"`);
  renderUsuarios();
}

