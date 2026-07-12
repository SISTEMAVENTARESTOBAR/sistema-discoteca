// ============================================================
// AUTENTICACIÓN — Sistema Discoteca
// Login local con usuarios de Firebase Realtime DB
// ============================================================

let currentUser = null;

function _restaurarSesion() {
  const saved = localStorage.getItem('sys_session');
  if (!saved) return false;
  try {
    const { userId, userName } = JSON.parse(saved);
    const user = DB.usuarios.find(u => u.id === userId && u.activo);
    if (user) {
      currentUser = user;
      document.getElementById('login-screen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      if (typeof window.unlockAudioContext === 'function') window.unlockAudioContext();
      initApp();
      return true;
    }
  } catch(e) {}
  localStorage.removeItem('sys_session');
  return false;
}

function doLogin() {
  const u = document.getElementById('login-user').value.trim();
  const p = document.getElementById('login-pass').value.trim();
  const found = DB.usuarios.find(x => x.usuario === u && x.pass === p && x.activo);
  if (!found) {
    document.getElementById('login-error').style.display = 'block';
    return;
  }
  currentUser = found;
  localStorage.setItem('sys_session', JSON.stringify({ userId: currentUser.id, userName: currentUser.nombre }));
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  
  if (typeof window.unlockAudioContext === 'function') {
    window.unlockAudioContext();
  }
  
  initApp();
}

function doLogout() {
  localStorage.removeItem('sys_session');
  currentUser = null;
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').style.display = 'none';
}