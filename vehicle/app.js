// ── Modal Controls ──────────────────────────────────────────
function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// Close modal on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});


// ── Vehicle Counter ──────────────────────────────────────────
let vehicleCount = 4;


// ── Save New Vehicle ─────────────────────────────────────────
function saveVehicle() {
  const plate    = document.getElementById('f-plate').value.trim();
  const model    = document.getElementById('f-model').value.trim();
  const type     = document.getElementById('f-type').value;
  const payload  = document.getElementById('f-payload').value.trim();
  const odometer = document.getElementById('f-odometer').value.trim();

  if (!plate || !model || !type) {
    alert('Please fill in required fields: License Plate, Model, and Type.');
    return;
  }

  vehicleCount++;
  const no           = String(vehicleCount).padStart(3, '0');
  const odoFormatted = odometer ? parseInt(odometer).toLocaleString() + ' km' : '0 km';
  const payloadText  = payload ? payload + ' Ton' : '—';

  const tbody = document.getElementById('vehicleTable');
  const row   = document.createElement('tr');

  row.innerHTML = `
    <td class="no">${no}</td>
    <td><span class="plate-badge">${plate}</span></td>
    <td>${model}</td>
    <td><span class="type-badge">${type}</span></td>
    <td>${payloadText}</td>
    <td class="odometer-text">${odoFormatted}</td>
    <td><span class="status-badge status-idle">Idle</span></td>
    <td>
      <div class="actions">
        <button class="action-btn" title="View">👁</button>
        <button class="action-btn" title="Edit">✏️</button>
        <button class="action-btn del" title="Delete" onclick="deleteRow(this)">✕</button>
      </div>
    </td>
  `;

  tbody.appendChild(row);

  // Update stats
  document.getElementById('stat-total').textContent = vehicleCount;
  const currentIdle = parseInt(document.getElementById('stat-idle').textContent);
  document.getElementById('stat-idle').textContent = currentIdle + 1;

  closeModal();
  showToast();

  // Reset form fields
  ['f-plate', 'f-model', 'f-type', 'f-payload', 'f-odometer', 'f-notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
}


// ── Delete Vehicle Row ───────────────────────────────────────
function deleteRow(btn) {
  if (!confirm('Remove this vehicle from the fleet?')) return;

  const row        = btn.closest('tr');
  const statusClass = row.querySelector('.status-badge').className;

  vehicleCount--;
  document.getElementById('stat-total').textContent = vehicleCount;

  // Decrement the correct stat counter
  if (statusClass.includes('idle')) {
    const el = document.getElementById('stat-idle');
    el.textContent = Math.max(0, parseInt(el.textContent) - 1);
  } else if (statusClass.includes('active')) {
    const el = document.getElementById('stat-active');
    el.textContent = Math.max(0, parseInt(el.textContent) - 1);
  } else if (statusClass.includes('maintenance')) {
    const el = document.getElementById('stat-maint');
    el.textContent = Math.max(0, parseInt(el.textContent) - 1);
  }

  // Animate row removal
  row.style.transition = 'opacity 0.3s, transform 0.3s';
  row.style.opacity    = '0';
  row.style.transform  = 'translateX(20px)';
  setTimeout(() => row.remove(), 300);
}


// ── Toast Notification ───────────────────────────────────────
function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}


// ── Search / Filter Table ────────────────────────────────────
function filterTable(val) {
  const rows = document.querySelectorAll('#vehicleTable tr');
  const query = val.toLowerCase();

  rows.forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}
