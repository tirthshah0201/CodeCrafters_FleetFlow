/**
 * Fleet Flow – Maintenance & Service Logs
 * maintenance-app.js
 */

// ── State ─────────────────────────────────────────────────────
let logCounter = 324;

const stats = {
  total:    4,
  new:      2,
  progress: 1,
  done:     1
};


// ── Modal Controls ────────────────────────────────────────────
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  // Auto-fill today's date
  document.getElementById('f-date').value = new Date().toISOString().split('T')[0];
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});


// ── Save New Service Log ──────────────────────────────────────
function saveService() {
  const vehicle = document.getElementById('f-vehicle').value.trim();
  const issue   = document.getElementById('f-issue').value.trim();
  const date    = document.getElementById('f-date').value;
  const cost    = document.getElementById('f-cost').value.trim();
  const status  = document.getElementById('f-status').value;

  if (!vehicle || !issue || !date) {
    alert('Please fill in: Vehicle Name, Issue/Service, and Date.');
    return;
  }

  logCounter++;

  const costDisplay = cost
    ? '₹' + parseInt(cost).toLocaleString('en-IN')
    : '—';

  const dateDisplay = date
    ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const statusClassMap = {
    'New':         'status-new',
    'In Progress': 'status-progress',
    'Completed':   'status-done'
  };
  const statusClass = statusClassMap[status] || 'status-new';

  const row = document.createElement('tr');
  row.innerHTML = `
    <td><span class="logid-badge">#${logCounter}</span></td>
    <td><span class="vehicle-name">${escHtml(vehicle)}</span></td>
    <td class="issue-text">${escHtml(issue)}</td>
    <td class="date-text">${dateDisplay}</td>
    <td class="cost-text">${costDisplay}</td>
    <td><span class="status-badge ${statusClass}">${status}</span></td>
    <td>
      <div class="actions">
        <button class="action-btn" title="View">👁</button>
        <button class="action-btn" title="Edit">✏️</button>
        <button class="action-btn del" title="Delete" onclick="deleteRow(this)">✕</button>
      </div>
    </td>
  `;

  document.getElementById('serviceTable').appendChild(row);

  // Update stat counters
  stats.total++;
  if (status === 'New')         stats.new++;
  if (status === 'In Progress') stats.progress++;
  if (status === 'Completed')   stats.done++;
  renderStats();

  closeModal();
  showToast();
  resetForm();
}


// ── Delete a Row ──────────────────────────────────────────────
function deleteRow(btn) {
  if (!confirm('Remove this service log?')) return;

  const row         = btn.closest('tr');
  const statusClass = row.querySelector('.status-badge').className;

  stats.total = Math.max(0, stats.total - 1);
  if (statusClass.includes('status-new'))      stats.new      = Math.max(0, stats.new - 1);
  if (statusClass.includes('status-progress')) stats.progress = Math.max(0, stats.progress - 1);
  if (statusClass.includes('status-done'))     stats.done     = Math.max(0, stats.done - 1);
  renderStats();

  // Animate row out
  row.style.transition = 'opacity 0.3s, transform 0.3s';
  row.style.opacity    = '0';
  row.style.transform  = 'translateX(20px)';
  setTimeout(() => row.remove(), 300);
}


// ── Render Stats ──────────────────────────────────────────────
function renderStats() {
  document.getElementById('stat-total').textContent    = stats.total;
  document.getElementById('stat-new').textContent      = stats.new;
  document.getElementById('stat-progress').textContent = stats.progress;
  document.getElementById('stat-done').textContent     = stats.done;
}


// ── Toast Notification ────────────────────────────────────────
function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}


// ── Search / Filter ───────────────────────────────────────────
function filterTable(val) {
  const query = val.toLowerCase();
  document.querySelectorAll('#serviceTable tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}


// ── Helpers ───────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resetForm() {
  ['f-vehicle', 'f-issue', 'f-date', 'f-cost', 'f-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-status').value = 'New';
}
