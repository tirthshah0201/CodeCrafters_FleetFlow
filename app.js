
let currentUser = null;
let isDark = true;

const USERS_DB = [
  { username: 'admin', email: 'manager@CodeCrafters_CodeCrafters_FleetFlow.io', password: 'Fleet@2024', name: 'Alex Manager', role: 'manager' },
  { username: 'dispatch', email: 'dispatcher@CodeCrafters_CodeCrafters_FleetFlow.io', password: 'Fleet@2024', name: 'Dana Dispatch', role: 'dispatcher' },
  { username: 'safety', email: 'safety@CodeCrafters_CodeCrafters_FleetFlow.io', password: 'Fleet@2024', name: 'Sam Safety', role: 'safety' },
];

const ROLES_CONFIG = {
  manager: {
    label: 'Manager',
    emoji: '👑',
    color: 'var(--primary-light)',
    modules: ['overview','vehicles','drivers','routes','dispatch','maintenance','compliance','reports','settings','users'],
  },
  dispatcher: {
    label: 'Dispatcher',
    emoji: '📡',
    color: '#4c9fd6',
    modules: ['overview','vehicles','routes','dispatch'],
    locked: ['maintenance','compliance','reports','settings','users'],
  },
  safety: {
    label: 'Safety Officer',
    emoji: '🛡️',
    color: '#4caf8c',
    modules: ['overview','drivers','compliance'],
    locked: ['vehicles','routes','dispatch','maintenance','reports','settings','users'],
  }
};

const SIDEBAR_ITEMS = [
  { id: 'overview', icon: '📊', label: 'Overview', section: 'Main' },
  { id: 'vehicles', icon: '🚛', label: 'Vehicles', badge: '12', section: 'Main' },
  { id: 'drivers', icon: '👤', label: 'Drivers', section: 'Main' },
  { id: 'routes', icon: '🗺️', label: 'Routes', section: 'Operations' },
  { id: 'dispatch', icon: '📡', label: 'Dispatch', badge: '3', section: 'Operations' },
  { id: 'maintenance', icon: '🔧', label: 'Maintenance', section: 'Operations' },
  { id: 'compliance', icon: '🛡️', label: 'Compliance', section: 'Safety' },
  { id: 'reports', icon: '📈', label: 'Reports', section: 'Analytics' },
  { id: 'settings', icon: '⚙️', label: 'Settings', section: 'System' },
  { id: 'users', icon: '👥', label: 'User Management', section: 'System' },
];

// ===== STORAGE HELPERS =====
function saveUsersToStorage() {
  try { localStorage.setItem('FF_USERS', JSON.stringify(USERS_DB)); } catch (e) { console.warn('Failed saving users', e); }
}

function loadUsersFromStorage() {
  try {
    const s = localStorage.getItem('FF_USERS');
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        USERS_DB.splice(0, USERS_DB.length, ...arr);
      }
    }
  } catch (e) { console.warn('Failed loading users', e); }
}

function saveRemembered(identifier) {
  try { localStorage.setItem('FF_REMEMBER', identifier); } catch (e) { }
}

function getRemembered() { return localStorage.getItem('FF_REMEMBER'); }

function clearRemembered() { try { localStorage.removeItem('FF_REMEMBER'); } catch (e) { } }

function tryAutoLogin() {
  const id = getRemembered();
  if (!id) return false;
  const u = USERS_DB.find(x => x.email === id || x.username === id);
  if (u) {
    currentUser = u;
    showToast(`Welcome back, ${u.name.split(' ')[0]}! 🎉`, 'success');
    setTimeout(() => loadDashboard(), 600);
    return true;
  }
  return false;
}

// ===== NAVIGATION =====
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page + '-page').classList.add('active');
}

// ===== THEME =====
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? '' : 'light');
  document.querySelectorAll('#themeBtn, #themeBtn2').forEach(b => b.textContent = isDark ? '🌙' : '☀️');
}

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const tc = document.getElementById('toastContainer');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  tc.appendChild(t);
  t.onclick = () => t.remove();
  setTimeout(() => {
    t.style.animation = 'toastOut 0.4s ease forwards';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ===== PASSWORD TOGGLE =====
function togglePassword(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁️'; }
}

// ===== VALIDATIONS =====
function validateName() {
  const v = document.getElementById('regName').value.trim();
  const w = document.getElementById('reg-name-wrap');
  const e = document.getElementById('regNameErr');
  if (v.length < 2) { w.classList.add('error'); w.classList.remove('success'); e.classList.add('show'); return false; }
  w.classList.remove('error'); w.classList.add('success'); e.classList.remove('show'); return true;
}

function validateEmail() {
  const v = document.getElementById('regEmail').value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const w = document.getElementById('reg-email-wrap');
  const e = document.getElementById('regEmailErr');
  if (!re.test(v)) { w.classList.add('error'); w.classList.remove('success'); e.classList.add('show'); return false; }
  // check duplicate
  if (USERS_DB.some(u => u.email === v)) {
    w.classList.add('error'); e.textContent = 'This email is already registered'; e.classList.add('show'); return false;
  }
  w.classList.remove('error'); w.classList.add('success'); e.classList.remove('show'); return true;
}

function checkStrength() {
  const v = document.getElementById('regPass').value;
  const fill = document.getElementById('strengthFill');
  const text = document.getElementById('strengthText');
  let score = 0;
  if (v.length >= 8) score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  const map = [
    { pct: '0%', color: '', label: 'Enter a password', col: 'var(--text-dim)' },
    { pct: '25%', color: 'var(--error)', label: 'Weak', col: 'var(--error)' },
    { pct: '50%', color: 'var(--warning)', label: 'Fair', col: 'var(--warning)' },
    { pct: '75%', color: '#4c9fd6', label: 'Good', col: '#4c9fd6' },
    { pct: '100%', color: 'var(--success)', label: 'Strong ✓', col: 'var(--success)' },
  ];
  fill.style.width = v ? map[score].pct : '0%';
  fill.style.background = map[score].color;
  text.textContent = v ? map[score].label : 'Enter a password';
  text.style.color = v ? map[score].col : 'var(--text-dim)';
}

function validateConfirm() {
  const p = document.getElementById('regPass').value;
  const c = document.getElementById('regConfirm').value;
  const w = document.getElementById('reg-confirm-wrap');
  const e = document.getElementById('regConfirmErr');
  if (p !== c || !c) { w.classList.add('error'); w.classList.remove('success'); e.classList.add('show'); return false; }
  w.classList.remove('error'); w.classList.add('success'); e.classList.remove('show'); return true;
}

// ===== HANDLE LOGIN =====
function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  let valid = true;

  if (!u) { document.getElementById('login-user-wrap').classList.add('error'); document.getElementById('loginUserErr').classList.add('show'); valid = false; }
  else { document.getElementById('login-user-wrap').classList.remove('error'); document.getElementById('loginUserErr').classList.remove('show'); }

  if (!p) { document.getElementById('login-pass-wrap').classList.add('error'); document.getElementById('loginPassErr').classList.add('show'); valid = false; }
  else { document.getElementById('login-pass-wrap').classList.remove('error'); document.getElementById('loginPassErr').classList.remove('show'); }

  if (!valid) return;

  const btn = document.getElementById('loginBtn');
  btn.innerHTML = '<div class="btn-loading"><div class="spinner"></div>Authenticating...</div>';
  btn.disabled = true;

  setTimeout(() => {
    const user = USERS_DB.find(x => (x.username === u || x.email === u) && x.password === p);
    if (user) {
      currentUser = user;
      // persist remembered identity if requested
      const remember = document.getElementById('rememberMe') && document.getElementById('rememberMe').checked;
      if (remember) saveRemembered(user.email || user.username);
      else clearRemembered();
      showToast(`Welcome back, ${user.name.split(' ')[0]}! 🎉`, 'success');
      setTimeout(() => loadDashboard(), 600);
    } else {
      showToast('Invalid credentials. Try a demo account!', 'error');
      document.getElementById('login-pass-wrap').classList.add('error');
      document.getElementById('loginPassErr').textContent = 'Invalid username or password';
      document.getElementById('loginPassErr').classList.add('show');
    }
    btn.innerHTML = 'Sign In to Account';
    btn.disabled = false;
  }, 1200);
}

// ===== HANDLE REGISTER =====
function handleRegister(e) {
  e.preventDefault();
  const n = validateName();
  const em = validateEmail();
  const r = document.getElementById('regRole').value;
  const pass = document.getElementById('regPass').value;

  if (!pass || pass.length < 8) {
    document.getElementById('reg-pass-wrap').classList.add('error');
    document.getElementById('regPassErr').classList.add('show');
    return;
  }
  const c = validateConfirm();

  if (!r) { document.getElementById('regRoleErr').classList.add('show'); return; }
  else { document.getElementById('regRoleErr').classList.remove('show'); }

  if (!n || !em || !c) return;

  const btn = document.getElementById('regBtn');
  btn.innerHTML = '<div class="btn-loading"><div class="spinner"></div>Securing account...</div>';
  btn.disabled = true;

  setTimeout(() => {
    const user = {
      username: document.getElementById('regEmail').value.split('@')[0],
      email: document.getElementById('regEmail').value,
      password: pass,
      name: document.getElementById('regName').value,
      role: r,
    };
    USERS_DB.push(user);
    // persist new user so registration is permanent across sessions
    saveUsersToStorage();
    currentUser = user;
    showToast(`Account created! Welcome, ${user.name.split(' ')[0]}! 🚀`, 'success');
    setTimeout(() => loadDashboard(), 800);
    btn.innerHTML = 'Create Account';
    btn.disabled = false;
  }, 1500);
}

// ===== QUICK LOGIN =====
function quickLogin(role) {
  const map = { manager: USERS_DB[0], dispatcher: USERS_DB[1], safety: USERS_DB[2] };
  currentUser = map[role];
  showToast(`Logging in as ${currentUser.name}...`, 'info');
  setTimeout(() => loadDashboard(), 500);
}

// ===== LOAD DASHBOARD =====
function loadDashboard() {
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 600);
  return;
  navigate('dashboard');
  const role = currentUser.role;
  const cfg = ROLES_CONFIG[role];

  // Update topbar
  document.getElementById('rolePill').textContent = cfg.label.toUpperCase();
  document.getElementById('rolePill').style.color = cfg.color;
  document.getElementById('userAvatar').textContent = currentUser.name.split(' ').map(x => x[0]).join('');
  document.getElementById('dashBreadcrumb').textContent = 'Dashboard — ' + cfg.label;

  buildSidebar(role);
  renderOverview(role);
}

// ===== BUILD SIDEBAR =====
function buildSidebar(role) {
  const cfg = ROLES_CONFIG[role];
  const sidebar = document.getElementById('sidebar');
  let sections = {};
  SIDEBAR_ITEMS.forEach(item => {
    if (!sections[item.section]) sections[item.section] = [];
    sections[item.section].push(item);
  });

  let html = '';
  Object.entries(sections).forEach(([sec, items]) => {
    html += `<div class="sidebar-section"><div class="sidebar-label">${sec}</div>`;
    items.forEach(item => {
      const allowed = cfg.modules.includes(item.id);
      const locked = !allowed;
      html += `<div class="sidebar-item ${locked ? 'sidebar-locked' : ''} ${item.id === 'overview' ? 'active' : ''}"
        onclick="${locked ? 'showToast(\'Access restricted for your role 🔒\', \'error\')' : `setActive(this, '${item.id}')`}">
        <span class="item-icon">${item.icon}</span>
        ${item.label}
        ${item.badge && allowed ? `<span class="sidebar-badge">${item.badge}</span>` : ''}
      </div>`;
    });
    html += `</div>`;
  });
  sidebar.innerHTML = html;
}

function setActive(el, id) {
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  showToast(`Loading ${el.textContent.trim()}...`, 'info');
}

// ===== RENDER OVERVIEW =====
function renderOverview(role) {
  const cfg = ROLES_CONFIG[role];
  const content = document.getElementById('mainContent');

  const stats = [
    { icon: '🚛', value: '248', label: 'Total Vehicles', delta: '+12 this month' },
    { icon: '👤', value: '1,047', label: 'Active Drivers', delta: '+28 this week' },
    { icon: '🗺️', value: '3,840', label: 'Routes Today', delta: '+5.2%' },
    { icon: '⚠️', value: '7', label: 'Alerts Pending', delta: '-3 resolved' },
  ];

  const locked = cfg.locked || [];

  content.innerHTML = `
    <div class="page-title">
      Good ${getTimeOfDay()}, ${currentUser.name.split(' ')[0]} ${cfg.emoji}
    </div>
    <div class="page-subtitle">Here's what's happening in your fleet today</div>

    <div class="stats-grid">
      ${stats.map((s, i) => `
        <div class="stat-tile" style="animation-delay:${i * 0.07}s">
          <span class="tile-icon">${s.icon}</span>
          <div class="tile-value">${s.value}</div>
          <div class="tile-label">${s.label}</div>
          <div class="tile-delta">↑ ${s.delta}</div>
        </div>
      `).join('')}
    </div>

    <div class="cards-row">
      <div class="card" style="position:relative;">
        ${locked.includes('vehicles') ? `<div class="locked-overlay"><div style="font-size:36px">🔒</div><div class="locked-msg">Vehicle data requires<br>elevated permissions</div><div class="access-badge">Access Denied</div></div>` : ''}
        <div class="card-title">
          Active Fleet <span class="card-title-action">View All →</span>
        </div>
        <table class="mini-table">
          <tr><th>Vehicle</th><th>Driver</th><th>Route</th><th>Status</th><th>Fuel</th></tr>
          <tr><td>TRK-001</td><td>J. Harris</td><td>RT-Alpha</td><td><span class="status-dot active">Active</span></td><td>78%</td></tr>
          <tr><td>TRK-047</td><td>M. Chen</td><td>RT-Beta</td><td><span class="status-dot active">Active</span></td><td>52%</td></tr>
          <tr><td>VAN-012</td><td>R. Patel</td><td>RT-Gamma</td><td><span class="status-dot idle">Idle</span></td><td>91%</td></tr>
          <tr><td>BUS-003</td><td>L. Torres</td><td>RT-Delta</td><td><span class="status-dot offline">Offline</span></td><td>34%</td></tr>
          <tr><td>TRK-088</td><td>K. Brown</td><td>RT-Epsilon</td><td><span class="status-dot active">Active</span></td><td>67%</td></tr>
        </table>
      </div>

      <div class="card">
        <div class="card-title">Recent Activity</div>
        <div>
          ${[
            ['TRK-001 completed delivery', '2m ago'],
            ['New driver registered: A. Kim', '14m ago'],
            ['Route RT-Beta optimized', '31m ago'],
            ['Maintenance alert: VAN-012', '1h ago'],
            ['Safety inspection passed', '2h ago'],
          ].map(([msg, time]) => `
            <div class="activity-item">
              <div class="activity-dot"></div>
              <div><div style="margin-bottom:3px">${msg}</div><div class="activity-time">${time}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    ${role === 'manager' ? `
    <div class="card" style="animation-delay:0.35s;animation:fadeInUp 0.5s ease 0.35s both">
      <div class="card-title">User Management <span class="card-title-action">Manager Only ✓</span></div>
      <table class="mini-table">
        <tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th></tr>
        <tr><td>Alex Manager</td><td>Manager</td><td>manager@CodeCrafters_CodeCrafters_FleetFlow.io</td><td><span class="status-dot active">Active</span></td></tr>
        <tr><td>Dana Dispatch</td><td>Dispatcher</td><td>dispatcher@CodeCrafters_CodeCrafters_FleetFlow.io</td><td><span class="status-dot active">Active</span></td></tr>
        <tr><td>Sam Safety</td><td>Safety Officer</td><td>safety@CodeCrafters_CodeCrafters_FleetFlow.io</td><td><span class="status-dot active">Active</span></td></tr>
      </table>
    </div>` : ''}

    ${role === 'safety' ? `
    <div class="card" style="animation-delay:0.35s;animation:fadeInUp 0.5s ease 0.35s both">
      <div class="card-title">Compliance Dashboard <span class="card-title-action">Safety Access ✓</span></div>
      <table class="mini-table">
        <tr><th>Driver</th><th>License Expiry</th><th>Last Inspection</th><th>Violations</th><th>Status</th></tr>
        <tr><td>J. Harris</td><td>2025-08-14</td><td>2024-11-01</td><td>0</td><td><span class="status-dot active">Compliant</span></td></tr>
        <tr><td>M. Chen</td><td>2026-03-22</td><td>2024-10-15</td><td>1</td><td><span class="status-dot idle">Review</span></td></tr>
        <tr><td>R. Patel</td><td>2024-12-31</td><td>2024-09-28</td><td>0</td><td><span class="status-dot offline">Expiring</span></td></tr>
      </table>
    </div>` : ''}
  `;
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

// ===== RESTRICT NAV TO DASHBOARD ONLY =====
function restrictNavToDashboard() {
  document.querySelectorAll('.sidebar-item').forEach(el => {
    const text = el.textContent.trim();
    const isDashboard = text.toLowerCase() === 'overview' || el.classList.contains('active');
    if (!isDashboard) {
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.6';
      el.style.cursor = 'default';
    }
  });
}// ===== LOGOUT =====
function showLogoutModal() {
  document.getElementById('logoutModal').classList.add('show');
}

function closeModal() {
  document.getElementById('logoutModal').classList.remove('show');
}

function confirmLogout() {
  closeModal();
  currentUser = null;
  showToast('You have been signed out securely. See you soon! 👋', 'info');
  setTimeout(() => navigate('login'), 500);
  // Clear form
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  // Optionally keep the remembered identity; do not remove saved users
}

// ===== INIT =====
setTimeout(() => {
  document.getElementById('welcomeScreen').style.display = 'none';
}, 2600);

// Load persisted users and attempt auto-login if remembered
loadUsersFromStorage();
// If auto-login succeeds, we hide the welcome screen earlier; otherwise it will behave normally
setTimeout(() => {
  tryAutoLogin();
}, 800);