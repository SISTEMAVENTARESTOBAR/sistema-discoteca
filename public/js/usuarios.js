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
      <td><span class="badge ${u.activo ? 'badge-delivered' : 'badge-cancelled'}">${u.activo ? '✅ Activo' : '❌ Inactivo'}</span></td>
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
  if (!nombre || !usuario || !pass) return alert('Completa todos los campos');
  if (DB.usuarios.find(u => u.usuario === usuario)) return alert('Ese usuario ya existe');
  DB.usuarios.push({ id: Date.now(), nombre, usuario, pass, rol, activo: true });
  closeModal('modal-nuevo-usuario');
  renderUsuarios();
}

function toggleUsuario(id) {
  const u = DB.usuarios.find(x => x.id === id);
  if (u) u.activo = !u.activo;
  renderUsuarios();
}
