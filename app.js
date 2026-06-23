/* =============================================
   Task Manager — CloudTech Solutions
   Frontend · Laboratorio S13
   Consume la API REST de Node.js/Express
   ============================================= */

const API = '/api/tasks';

// ── State ──────────────────────────────────────
let tasks         = [];
let currentFilter = 'all';

// ── DOM refs ────────────────────────────────────
const taskInput      = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const addBtn         = document.getElementById('add-btn');
const taskList       = document.getElementById('task-list');
const emptyState     = document.getElementById('empty-state');
const charCount      = document.getElementById('char-count');
const progressBar    = document.getElementById('progress-bar');
const progressLabel  = document.getElementById('progress-label');
const badgePending   = document.getElementById('badge-pending');
const badgeDone      = document.getElementById('badge-done');
const taskFooter     = document.getElementById('task-count-footer');
const toast          = document.getElementById('toast');

// ── API helpers ──────────────────────────────────
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    showToast(`Error: ${e.message}`, true);
    throw e;
  }
}

// ── CRUD ─────────────────────────────────────────
async function fetchTasks() {
  const data = await apiFetch(API);
  tasks = data.tasks || [];
  render();
}

async function addTask() {
  const text = taskInput.value.trim();
  if (!text) { taskInput.focus(); showToast('Escribe una tarea primero.', true); return; }

  addBtn.disabled = true;
  addBtn.textContent = '…';
  try {
    const task = await apiFetch(API, {
      method: 'POST',
      body: JSON.stringify({ text, priority: prioritySelect.value }),
    });
    tasks.unshift(task);
    render();
    showToast('Tarea agregada ✓');
    taskInput.value = '';
    charCount.textContent = '0 / 120';
    taskInput.focus();
  } finally {
    addBtn.disabled = false;
    addBtn.textContent = 'Agregar';
  }
}

async function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
  const updated = await apiFetch(`${API}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus }),
  });
  const idx = tasks.findIndex(t => t.id === id);
  tasks[idx] = updated;
  render();
}

async function deleteTask(id) {
  await apiFetch(`${API}/${id}`, { method: 'DELETE' });
  tasks = tasks.filter(t => t.id !== id);
  render();
  showToast('Tarea eliminada.');
}

// ── Filter ────────────────────────────────────────
function filteredTasks() {
  if (currentFilter === 'all')        return tasks;
  if (currentFilter === 'pendiente')  return tasks.filter(t => t.status === 'pendiente');
  if (currentFilter === 'completada') return tasks.filter(t => t.status === 'completada');
  return tasks.filter(t => t.priority === currentFilter);
}

// ── Render ────────────────────────────────────────
function render() {
  const visible = filteredTasks();

  Array.from(taskList.children).forEach(child => {
    if (child.id !== 'empty-state') child.remove();
  });

  emptyState.style.display = visible.length === 0 ? 'flex' : 'none';
  visible.forEach(task => taskList.appendChild(createTaskNode(task)));
  updateStats();
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function createTaskNode(task) {
  const item = document.createElement('div');
  item.className = `task-item ${task.status}`;
  item.dataset.id = task.id;

  const priorityLabels = { alta: '🔴 Alta', media: '🟡 Media', baja: '🟢 Baja' };

  item.innerHTML = `
    <div class="task-check ${task.status === 'completada' ? 'checked' : ''}"
         title="${task.status === 'completada' ? 'Marcar pendiente' : 'Completar'}"></div>
    <div class="task-body">
      <p class="task-text">${escapeHtml(task.text)}</p>
      <div class="task-meta">
        <span class="task-date">${formatDate(task.createdAt)}</span>
        <span class="priority-tag ${task.priority}">${priorityLabels[task.priority]}</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="action-btn delete-btn" title="Eliminar">🗑</button>
    </div>`;

  item.querySelector('.task-check').addEventListener('click', () => toggleTask(task.id));
  item.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));
  return item;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.status === 'completada').length;
  const pending = total - done;
  const pct     = total ? Math.round((done / total) * 100) : 0;

  progressBar.style.width = pct + '%';
  progressLabel.textContent = total
    ? `${done} de ${total} completadas · ${pct}%`
    : 'Sin tareas aún';

  badgePending.textContent = `${pending} pendiente${pending !== 1 ? 's' : ''}`;
  badgeDone.textContent    = `${done} completada${done !== 1 ? 's' : ''}`;
  taskFooter.textContent   = `${total} tarea${total !== 1 ? 's' : ''} en total`;
}

// ── Toast ─────────────────────────────────────────
let toastTimer;
function showToast(msg, isError = false) {
  toast.textContent = msg;
  toast.style.borderColor = isError ? 'var(--red)'    : 'var(--accent)';
  toast.style.color       = isError ? 'var(--red)'    : 'var(--accent)';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

// ── Event listeners ───────────────────────────────
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
taskInput.addEventListener('input', () => {
  const len = taskInput.value.length;
  charCount.textContent = `${len} / 120`;
  charCount.style.color = len > 100 ? 'var(--yellow)' : 'var(--text-muted)';
});

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ── Init ──────────────────────────────────────────
fetchTasks();
