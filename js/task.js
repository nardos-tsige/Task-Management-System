const createId = () => { try { return crypto.randomUUID(); } catch (e) { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); } };

function addTask(list, text, priority) {
  const item = {
    id: createId(),
    text: text.trim(),
    priority: priority || 'medium',
    completed: false,
    createdAt: Date.now()
  };
  return [...list, item];
}

function updateTask(list, id, patch) {
  return list.map(t => {
    if (t.id === id) {
      return Object.assign({}, t, patch);
    }
    return t;
  });
}

function removeTask(list, id) {
  return list.filter(function (t) { return t.id !== id; });
}

function toggleTask(list, id) {
  return list.map(t => {
    if (t.id === id) {
      return Object.assign({}, t, { completed: !t.completed });
    }
    return t;
  });
}

function moveTask(tasks, fromId, toIndex) {
  const fromIndex = tasks.findIndex(t => t.id === fromId);
  if (fromIndex === -1) return tasks;
  const next = [...tasks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function filterTasks(list, filter) {
  if (filter === 'pending') {
    return list.filter(t => !t.completed);
  }
  if (filter === 'completed') {
    return list.filter(t => t.completed);
  }
  return list.slice();
}

function findTasks(list, query) {
  if (!query || !query.trim()) {
    return list.slice();
  }
  const needle = query.trim().toLowerCase();
  return list.filter(t => t.text.toLowerCase().indexOf(needle) !== -1);
}

function getStats(list) {
  const total = list.length;
  let completed = 0;
  for (let i = 0; i < total; i++) {
    if (list[i].completed) completed++;
  }
  return {
    total: total,
    completed: completed,
    pending: total - completed
  };
}
