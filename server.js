/**
 * server.js — Task Manager Backend
 * CloudTech Solutions · Laboratorio S13 · UTP
 *
 * API REST con Express. Persistencia en memoria (JSON en RAM).
 * En producción (Azure), los datos se resetean al reiniciar la instancia;
 * para persistencia real conectar con Azure Cosmos DB o SQL Database.
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-memory store ──────────────────────────────────────────────────────────
let tasks = [
  {
    id:        uuidv4(),
    text:      'Configurar repositorio en GitHub',
    priority:  'alta',
    status:    'completada',
    createdAt: new Date().toISOString(),
  },
  {
    id:        uuidv4(),
    text:      'Desplegar aplicación en Azure App Service',
    priority:  'alta',
    status:    'pendiente',
    createdAt: new Date().toISOString(),
  },
  {
    id:        uuidv4(),
    text:      'Documentar proceso en README.md',
    priority:  'media',
    status:    'pendiente',
    createdAt: new Date().toISOString(),
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const VALID_PRIORITIES = ['alta', 'media', 'baja'];
const VALID_STATUSES   = ['pendiente', 'completada'];

function validateTask(body) {
  const errors = [];
  if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0)
    errors.push('El campo "text" es requerido y no puede estar vacío.');
  if (body.text && body.text.trim().length > 120)
    errors.push('El campo "text" no puede superar los 120 caracteres.');
  if (body.priority && !VALID_PRIORITIES.includes(body.priority))
    errors.push(`"priority" debe ser: ${VALID_PRIORITIES.join(', ')}.`);
  return errors;
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/tasks
 * Retorna todas las tareas.
 * Query params opcionales: ?status=pendiente|completada  ?priority=alta|media|baja
 */
app.get('/api/tasks', (req, res) => {
  let result = [...tasks];

  if (req.query.status) {
    if (!VALID_STATUSES.includes(req.query.status))
      return res.status(400).json({ error: `status inválido. Usa: ${VALID_STATUSES.join(', ')}` });
    result = result.filter(t => t.status === req.query.status);
  }

  if (req.query.priority) {
    if (!VALID_PRIORITIES.includes(req.query.priority))
      return res.status(400).json({ error: `priority inválida. Usa: ${VALID_PRIORITIES.join(', ')}` });
    result = result.filter(t => t.priority === req.query.priority);
  }

  res.json({
    total:  result.length,
    tasks:  result,
  });
});

/**
 * GET /api/tasks/:id
 * Retorna una tarea por ID.
 */
app.get('/api/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Tarea no encontrada.' });
  res.json(task);
});

/**
 * POST /api/tasks
 * Crea una nueva tarea.
 * Body: { text: string, priority?: 'alta'|'media'|'baja' }
 */
app.post('/api/tasks', (req, res) => {
  const errors = validateTask(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const task = {
    id:        uuidv4(),
    text:      req.body.text.trim(),
    priority:  req.body.priority || 'media',
    status:    'pendiente',
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(task);
  res.status(201).json(task);
});

/**
 * PATCH /api/tasks/:id
 * Actualiza campos de una tarea (text, priority, status).
 */
app.patch('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tarea no encontrada.' });

  const allowed = ['text', 'priority', 'status'];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.text !== undefined) {
    if (typeof updates.text !== 'string' || updates.text.trim().length === 0)
      return res.status(400).json({ error: '"text" no puede estar vacío.' });
    if (updates.text.trim().length > 120)
      return res.status(400).json({ error: '"text" no puede superar 120 caracteres.' });
    updates.text = updates.text.trim();
  }

  if (updates.priority && !VALID_PRIORITIES.includes(updates.priority))
    return res.status(400).json({ error: `priority inválida: ${VALID_PRIORITIES.join(', ')}` });

  if (updates.status && !VALID_STATUSES.includes(updates.status))
    return res.status(400).json({ error: `status inválido: ${VALID_STATUSES.join(', ')}` });

  tasks[index] = { ...tasks[index], ...updates };
  res.json(tasks[index]);
});

/**
 * DELETE /api/tasks/:id
 * Elimina una tarea.
 */
app.delete('/api/tasks/:id', (req, res) => {
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Tarea no encontrada.' });

  const deleted = tasks.splice(index, 1)[0];
  res.json({ message: 'Tarea eliminada.', task: deleted });
});

/**
 * GET /api/stats
 * Estadísticas generales.
 */
app.get('/api/stats', (req, res) => {
  const total      = tasks.length;
  const completadas = tasks.filter(t => t.status === 'completada').length;
  const pendientes  = total - completadas;

  const byPriority = VALID_PRIORITIES.reduce((acc, p) => {
    acc[p] = tasks.filter(t => t.priority === p).length;
    return acc;
  }, {});

  res.json({
    total,
    completadas,
    pendientes,
    progreso: total ? Math.round((completadas / total) * 100) : 0,
    byPriority,
  });
});

// ── Health check (Azure lo usa para saber si la app está viva) ────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    env:       process.env.NODE_ENV || 'development',
  });
});

// ── SPA fallback — cualquier ruta desconocida sirve el frontend ───────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⬡  Task Manager corriendo en http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/tasks`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
