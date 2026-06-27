// ============================================================
// AUTENTICACIÓN — Sistema Discoteca
// ============================================================

let currentUser = null;

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const found = DB.usuarios.find(x => x.usuario === u && x.pass === p && x.activo);
  if (!found) {
    document.getElementById('login-error').style.display = 'block';
    return;
  }
  currentUser = found;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initApp();
}

function doLogout() {
  currentUser = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
}
