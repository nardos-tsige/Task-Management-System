const STORE_KEY = 'task_system_items';

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Unable to read tasks from storage', err);
    return [];
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      console.warn('LocalStorage quota exceeded', err);
    } else {
      console.warn('Unable to persist tasks', err);
    }
  }
}
