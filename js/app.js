var bootAt = Date.now();

let state = {
  tasks: [],
  filter: 'all',
  query: '',
  theme: 'light',
  editingId: null
};

const els = {
  form: document.getElementById('task-form'),
  input: document.getElementById('task-input'),
  priority: document.getElementById('task-priority'),
  addBtn: document.getElementById('add-btn'),
  formError: document.getElementById('form-error'),
  search: document.getElementById('search-input'),
  searchWrap: document.querySelector('.search-wrapper'),
  filterGroup: document.getElementById('filter-group'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  reorderHint: document.getElementById('reorder-hint'),
  taskList: document.getElementById('task-list'),
  statTotal: document.getElementById('stat-total'),
  statDone: document.getElementById('stat-done'),
  statPending: document.getElementById('stat-pending'),
  countAll: document.getElementById('count-all'),
  countPending: document.getElementById('count-pending'),
  countCompleted: document.getElementById('count-completed'),
  themeBtn: document.getElementById('theme-toggle')
};

const ICONS = {
  handle: '<svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="7" cy="4" r="1.75"/><circle cx="13" cy="4" r="1.75"/><circle cx="7" cy="10" r="1.75"/><circle cx="13" cy="10" r="1.75"/><circle cx="7" cy="16" r="1.75"/><circle cx="13" cy="16" r="1.75"/></svg>',
  pencil: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>',
  hint: '<svg class="mobile-hint" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  check: '<svg class="check-svg" viewBox="0 0 20 20" fill="none"><rect class="check-box-rect" x="1" y="1" width="18" height="18" rx="9"/><path class="check-path" d="M5.5 10.2l3 3 6-6.4" fill="none" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  empty: '<svg class="empty-icon" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="var(--border-strong)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><rect x="24" y="20" width="48" height="60" rx="8"/><path d="M38 16h20a2 2 0 0 1 2 2v2H36v-2a2 2 0 0 1 2-2z"/><line x1="34" y1="36" x2="62" y2="36" stroke-dasharray="3 3"/><line x1="34" y1="46" x2="62" y2="46" stroke-dasharray="3 3"/><line x1="34" y1="56" x2="52" y2="56" stroke-dasharray="3 3"/><path d="M58 64l4 4 10-10" opacity="0.45" stroke="var(--border-strong)"/></svg>',
  alert: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

function pickTheme() {
  const saved = localStorage.getItem("task_theme");
  return saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem("task_theme", theme);
}

function toggleTheme() {
  applyTheme(state.theme === 'light' ? 'dark' : 'light');
}

function renderStats() {
  const s = getStats(state.tasks);
  els.statTotal.textContent = s.total;
  els.statDone.textContent = s.completed;
  els.statPending.textContent = s.pending;
}

function updateCounts() {
  const s = getStats(state.tasks);
  els.countAll.textContent = s.total;
  els.countPending.textContent = s.pending;
  els.countCompleted.textContent = s.completed;
}

function updateReorderHint() {
  const isFiltered = state.filter !== 'all' || (state.query && state.query.trim().length > 0);
  els.reorderHint.textContent = isFiltered ? 'Reordering is available in All view.' : '';
  els.reorderHint.classList.toggle('visible', isFiltered);
  els.taskList.classList.toggle('drag-disabled', isFiltered);
}

function updateLiveNumbers() {
  els.taskList.querySelectorAll('.task-item:not(.empty-item)').forEach((item, idx) => {
    const numEl = item.querySelector('.task-number');
    if (numEl) numEl.textContent = idx + 1;
  });
}

function drawTask(task, number, index) {
  const isEditing = state.editingId === task.id;
  const li = document.createElement('li');
  li.className = 'task-item' + (task.completed ? ' completed' : '') + (isEditing ? ' editing' : '');
  li.style.setProperty('--i', typeof index === 'number' ? index : 0);
  li.dataset.id = task.id;
  li.tabIndex = 0;

  const row = document.createElement('div');
  row.className = 'task-row' + (isEditing ? ' editing' : '');
  row.innerHTML = `
    <div class="drag-handle" role="button" aria-label="Drag to reorder" tabindex="-1">${ICONS.handle}</div>
    <span class="task-number">${number}</span>
    <label class="check-label" aria-label="${task.completed ? 'Mark task pending' : 'Mark task completed'}">
      <input type="checkbox" class="sr-only task-check" data-action="toggle"${task.completed ? ' checked' : ''}>
      ${ICONS.check}
    </label>
    ${isEditing ? '<input type="text" class="task-edit-input" aria-label="Edit task text">' : '<span class="task-title"></span>'}
    <div class="priority-pill priority-${task.priority}">
      <select class="priority-inline-select" aria-label="Task priority" data-action="priority">
        <option value="low"${task.priority === 'low' ? ' selected' : ''}>Low</option>
        <option value="medium"${task.priority === 'medium' ? ' selected' : ''}>Medium</option>
        <option value="high"${task.priority === 'high' ? ' selected' : ''}>High</option>
      </select>
    </div>
    <button type="button" class="pencil-btn" aria-label="Edit task" data-action="edit">${ICONS.pencil}</button>
    <button type="button" class="delete-btn" aria-label="Delete task" data-action="delete">${ICONS.trash}</button>
    ${ICONS.hint}`;

  row.querySelector('.check-label').addEventListener('click', (e) => e.preventDefault());
  if (isEditing) {
    row.querySelector('.task-edit-input').value = task.text;
  } else {
    const title = row.querySelector('.task-title');
    title.textContent = task.text;
    title.title = task.text;
  }
  li.appendChild(row);
  return li;
}

function drawEmpty(type) {
  const li = document.createElement('li');
  li.className = 'empty-item';
  const isSearch = type === 'search';
  li.innerHTML = `<div class="empty-state">${ICONS.empty}
    <p class="empty-title">${isSearch ? 'Nothing matches. Try a different search or filter.' : 'No tasks yet. Add one above to get started.'}</p>
    <p class="empty-hint">${isSearch ? 'Tip: press Escape to clear search.' : 'Tip: press Enter to submit.'}</p>
  </div>`;
  return li;
}

function renderList() {
  const filtered = filterTasks(state.tasks, state.filter);
  const visible = findTasks(filtered, state.query);
  els.taskList.replaceChildren();
  if (visible.length === 0) {
    els.taskList.appendChild(drawEmpty(state.tasks.length > 0 ? 'search' : 'all'));
    return;
  }
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < visible.length; i++) fragment.appendChild(drawTask(visible[i], i + 1, i));
  els.taskList.appendChild(fragment);
}

function updateRow(id) {
  const existingLi = els.taskList.querySelector(`[data-id="${id}"]`);
  if (!existingLi) return;
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  const filtered = filterTasks(state.tasks, state.filter);
  const visible = findTasks(filtered, state.query);
  const index = visible.findIndex(t => t.id === id);
  const newLi = drawTask(task, index >= 0 ? index + 1 : 1, 0);
  existingLi.replaceWith(newLi);
  if (state.editingId === id) {
    const input = newLi.querySelector('.task-edit-input');
    if (input) {
      input.focus();
      input.select();
      bindEditEvents(input, id);
    }
  }
}

function enterEdit(id) {
  if (state.editingId === id) return;
  if (state.editingId) {
    const prevId = state.editingId;
    state.editingId = null;
    updateRow(prevId);
  }
  state.editingId = id;
  updateRow(id);
}

function cancelEdit(id) {
  if (state.editingId === id) {
    state.editingId = null;
    updateRow(id);
  }
}

function commitEdit(id, text, inputEl) {
  const err = checkInput(text, true);
  if (err) {
    if (inputEl) {
      inputEl.classList.remove('shake');
      void inputEl.offsetWidth;
      inputEl.classList.add('shake');
      setTimeout(() => cancelEdit(id), 340);
    } else {
      cancelEdit(id);
    }
    return;
  }
  state.tasks = updateTask(state.tasks, id, { text: text.trim() });
  saveTasks(state.tasks);
  localStorage.setItem('hasEdited', '1');
  document.body.classList.add('has-edited');
  state.editingId = null;
  updateRow(id);
  updateCounts();
  renderStats();
}

function bindEditEvents(input, id) {
  let isCommitted = false;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      isCommitted = true;
      commitEdit(id, input.value, input);
    } else if (e.key === 'Escape') {
      isCommitted = true;
      cancelEdit(id);
    }
  });
  input.addEventListener('blur', () => {
    if (!isCommitted && state.editingId === id) {
      isCommitted = true;
      commitEdit(id, input.value, input);
    }
  });
}

function render() {
  renderStats();
  renderList();
  updateCounts();
  updateReorderHint();
}

function refresh() {
  requestAnimationFrame(render);
}

function sync() {
  saveTasks(state.tasks);
  requestAnimationFrame(render);
}

function showError(msg) {
  if (!msg) {
    els.formError.replaceChildren();
    els.formError.classList.remove('visible');
    return;
  }
  els.formError.innerHTML = `${ICONS.alert}<span></span>`;
  els.formError.querySelector('span').textContent = msg;
  els.formError.classList.add('visible');
}

function clearError() {
  showError('');
}

function flashAddSuccess() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const orig = els.addBtn.style.backgroundColor;
    els.addBtn.style.backgroundColor = 'var(--success)';
    setTimeout(() => { els.addBtn.style.backgroundColor = orig; }, 200);
  } else {
    const orig = els.addBtn.innerHTML;
    els.addBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(() => { els.addBtn.innerHTML = orig; }, 400);
  }
}

let drag = null;
let justDragged = false;

function isDragAllowed() {
  return state.filter === 'all' && (!state.query || !state.query.trim()) && !state.editingId;
}

function startDrag(itemEl, e) {
  if (!itemEl || drag || !isDragAllowed()) return;
  const rowEl = itemEl.querySelector('.task-row');
  if (!rowEl) return;
  const currentItems = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)'));
  if (currentItems.length <= 1) return;

  try {
    if (e.target && e.target.setPointerCapture) e.target.setPointerCapture(e.pointerId);
  } catch (err) {}

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rowTops = new Map();
  const rowMids = new Map();
  currentItems.forEach(el => {
    const r = el.getBoundingClientRect();
    rowTops.set(el, r.top);
    rowMids.set(el, r.top + r.height / 2);
  });

  const draggedRect = itemEl.getBoundingClientRect();
  drag = {
    id: itemEl.dataset.id, itemEl, rowEl,
    target: e.target, pointerId: e.pointerId, startY: e.clientY,
    initialMidY: draggedRect.top + draggedRect.height / 2,
    initialIndex: currentItems.indexOf(itemEl),
    initialOrder: currentItems.map(item => item.dataset.id),
    rowTops, rowMids, prefersReduced
  };

  els.taskList.classList.add('is-dragging-active');
  rowEl.classList.add('is-dragging');
  rowEl.style.transform = prefersReduced ? 'translateY(0px)' : 'translateY(0px) rotate(0.5deg) scale(1.02)';
}

function animateRows(allRows, oldTops, exclude) {
  allRows.forEach(row => {
    if (row !== exclude) {
      const diff = oldTops.get(row) - row.getBoundingClientRect().top;
      if (diff !== 0) {
        row.style.transition = 'none';
        row.style.transform = `translateY(${diff}px)`;
        void row.offsetWidth;
        row.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
        row.style.transform = 'translateY(0)';
      }
    }
  });
}

function swapRows(draggedItem, crossedItem, position, e) {
  const allRows = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)'));
  const oldTops = new Map();
  allRows.forEach(row => oldTops.set(row, row.getBoundingClientRect().top));
  const oldOffset = draggedItem.offsetTop;

  if (position === 'before') crossedItem.before(draggedItem);
  else crossedItem.after(draggedItem);

  const offsetDiff = draggedItem.offsetTop - oldOffset;
  drag.startY += offsetDiff;
  drag.initialMidY += offsetDiff;

  const newDeltaY = e.clientY - drag.startY;
  drag.rowEl.style.transform = drag.prefersReduced ? `translateY(${newDeltaY}px)` : `translateY(${newDeltaY}px) rotate(0.5deg) scale(1.02)`;

  if (!drag.prefersReduced) animateRows(allRows, oldTops, draggedItem);

  const rDragged = draggedItem.getBoundingClientRect();
  drag.rowTops.set(draggedItem, rDragged.top);
  drag.rowMids.set(draggedItem, rDragged.top + rDragged.height / 2);
  const rCrossed = crossedItem.getBoundingClientRect();
  drag.rowTops.set(crossedItem, rCrossed.top);
  drag.rowMids.set(crossedItem, rCrossed.top + rCrossed.height / 2);
  updateLiveNumbers();
}

function finishDrag() {
  if (!drag) return;
  const currentDomIds = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)')).map(el => el.dataset.id);
  const finalIndex = currentDomIds.indexOf(drag.id);

  try {
    if (drag.target && drag.target.releasePointerCapture) drag.target.releasePointerCapture(drag.pointerId);
  } catch (err) {}

  const { rowEl, id: draggedId, prefersReduced } = drag;
  els.taskList.classList.remove('is-dragging-active');
  rowEl.classList.remove('is-dragging');
  drag = null;
  justDragged = true;
  setTimeout(() => { justDragged = false; }, 100);

  if (finalIndex !== -1) {
    state.tasks = moveTask(state.tasks, draggedId, finalIndex);
    saveTasks(state.tasks);
  }

  if (!prefersReduced) {
    rowEl.style.transition = 'none';
    rowEl.style.transform = 'scale(1.02)';
    void rowEl.offsetWidth;
    rowEl.style.transition = 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)';
    rowEl.style.transform = 'scale(1)';
    setTimeout(() => {
      rowEl.style.transform = '';
      rowEl.style.transition = '';
      render();
    }, 180);
  } else {
    rowEl.style.transform = '';
    rowEl.style.transition = '';
    render();
  }
}

function cancelDrag() {
  if (!drag) return;
  try {
    if (drag.target && drag.target.releasePointerCapture) drag.target.releasePointerCapture(drag.pointerId);
  } catch (err) {}

  const allRows = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)'));
  const oldTops = new Map();
  allRows.forEach(row => oldTops.set(row, row.getBoundingClientRect().top));

  drag.rowEl.classList.remove('is-dragging');
  drag.rowEl.style.transform = '';
  drag.rowEl.style.transition = '';
  els.taskList.classList.remove('is-dragging-active');

  const taskMap = new Map();
  allRows.forEach(item => taskMap.set(item.dataset.id, item));
  drag.initialOrder.forEach(id => {
    const item = taskMap.get(id);
    if (item) els.taskList.appendChild(item);
  });

  if (!drag.prefersReduced) animateRows(allRows, oldTops, null);

  updateLiveNumbers();
  drag = null;
  justDragged = true;
  setTimeout(() => { justDragged = false; }, 100);
}

function wireEvents() {
  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    const val = els.input.value;
    const err = checkInput(val, false);
    if (err) {
      showError(err);
      return;
    }
    clearError();
    const priority = els.priority.value;
    state.tasks = addTask(state.tasks, val, priority);
    saveTasks(state.tasks);
    els.input.value = '';

    const newTask = state.tasks[state.tasks.length - 1];
    const isVisibleInCurrentView = (state.filter === 'all' || state.filter === 'pending') &&
      (!state.query || newTask.text.toLowerCase().indexOf(state.query.trim().toLowerCase()) !== -1);

    if (isVisibleInCurrentView) {
      const emptyEl = els.taskList.querySelector('.empty-item');
      if (emptyEl) emptyEl.remove();

      const filtered = filterTasks(state.tasks, state.filter);
      const visible = findTasks(filtered, state.query);
      const newLi = drawTask(newTask, visible.length, 0);
      els.taskList.appendChild(newLi);

      if (window.matchMedia('(min-width: 1024px)').matches && els.taskList.scrollHeight > els.taskList.clientHeight) {
        els.taskList.scrollTo({ top: els.taskList.scrollHeight, behavior: 'smooth' });
      }
    }
    updateCounts();
    renderStats();
    flashAddSuccess();
  });

  els.input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.input.value.length > 0) {
      els.input.value = '';
      clearError();
    }
  });

  let searchTimer = null;
  els.search.addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = e.target.value;
      refresh();
    }, 150);
  });

  els.search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      els.search.value = '';
      state.query = '';
      els.searchWrap.classList.remove('flicker');
      void els.searchWrap.offsetWidth;
      els.searchWrap.classList.add('flicker');
      refresh();
    }
  });

  els.filterGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    const targetFilter = btn.dataset.filter;
    if (state.filter === targetFilter) return;

    state.filter = targetFilter;
    localStorage.setItem('lastFilter', targetFilter);
    for (let i = 0; i < els.filterBtns.length; i++) {
      const b = els.filterBtns[i];
      const match = b.dataset.filter === targetFilter;
      b.classList.toggle('active', match);
      b.setAttribute('aria-selected', match ? 'true' : 'false');
    }
    refresh();
  });

  els.taskList.addEventListener('change', (e) => {
    const target = e.target;
    if (target.dataset.action === 'priority') {
      const li = target.closest('.task-item');
      if (!li) return;
      state.tasks = updateTask(state.tasks, li.dataset.id, { priority: target.value });
      saveTasks(state.tasks);
      updateRow(li.dataset.id);
    }
  });

  els.taskList.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.drag-handle');
    if (handle) {
      if (!isDragAllowed()) return;
      e.preventDefault();
      startDrag(handle.closest('.task-item'), e);
      return;
    }

    if (e.pointerType !== 'mouse') {
      const li = e.target.closest('.task-item');
      if (!li || e.target.closest('.check-label') || e.target.closest('.delete-btn') || e.target.closest('.priority-pill') || e.target.closest('.task-edit-input')) return;

      const startX = e.clientX;
      const startY = e.clientY;

      let touchTimer = setTimeout(() => {
        touchTimer = null;
        startDrag(li, e);
      }, 400);

      const cancelTouch = () => {
        if (touchTimer) {
          clearTimeout(touchTimer);
          touchTimer = null;
        }
        window.removeEventListener('pointermove', checkMove);
        window.removeEventListener('pointerup', cancelTouch);
        window.removeEventListener('pointercancel', cancelTouch);
      };

      const checkMove = (evt) => {
        if (touchTimer && (Math.abs(evt.clientX - startX) > 8 || Math.abs(evt.clientY - startY) > 8)) cancelTouch();
      };

      window.addEventListener('pointermove', checkMove);
      window.addEventListener('pointerup', cancelTouch);
      window.addEventListener('pointercancel', cancelTouch);
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    e.preventDefault();
    const deltaY = e.clientY - drag.startY;
    drag.rowEl.style.transform = drag.prefersReduced ? `translateY(${deltaY}px)` : `translateY(${deltaY}px) rotate(0.5deg) scale(1.02)`;
    const currentDraggedMid = drag.initialMidY + deltaY;

    while (true) {
      const items = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)'));
      const currentIndex = items.indexOf(drag.itemEl);
      if (currentIndex === -1) break;

      if (currentIndex > 0 && currentDraggedMid < drag.rowMids.get(items[currentIndex - 1])) {
        swapRows(drag.itemEl, items[currentIndex - 1], 'before', e);
      } else if (currentIndex < items.length - 1 && currentDraggedMid > drag.rowMids.get(items[currentIndex + 1])) {
        swapRows(drag.itemEl, items[currentIndex + 1], 'after', e);
      } else {
        break;
      }
    }
  });

  window.addEventListener('pointerup', () => { if (drag) finishDrag(); });
  window.addEventListener('pointercancel', () => { if (drag) finishDrag(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drag) cancelDrag();
  });

  els.taskList.addEventListener('click', (e) => {
    if (justDragged) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn) {
      const li = delBtn.closest('.task-item');
      if (!li || li.classList.contains('deleting')) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const id = li.dataset.id;
      const runDelete = () => {
        li.classList.add('deleting');
        const onEnd = (evt) => {
          if (evt.propertyName === 'grid-template-rows') {
            li.removeEventListener('transitionend', onEnd);
            state.tasks = removeTask(state.tasks, id);
            sync();
          }
        };
        li.addEventListener('transitionend', onEnd);
      };

      if (prefersReduced) runDelete();
      else {
        li.classList.add('shake');
        setTimeout(runDelete, 320);
      }
      return;
    }

    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn) {
      const li = editBtn.closest('.task-item');
      if (li) enterEdit(li.dataset.id);
      return;
    }

    if (e.target.closest('.priority-pill') || e.target.closest('.task-edit-input') || e.target.closest('.drag-handle')) {
      return;
    }

    const li = e.target.closest('.task-item');
    if (!li || li.classList.contains('editing') || li.classList.contains('deleting')) return;

    state.tasks = toggleTask(state.tasks, li.dataset.id);
    sync();
  });

  els.taskList.addEventListener('dblclick', (e) => {
    const li = e.target.closest('.task-item');
    if (li && !e.target.closest('.check-label') && !e.target.closest('.delete-btn') && !e.target.closest('.priority-pill') && !e.target.closest('.drag-handle')) {
      enterEdit(li.dataset.id);
    }
  });

  els.taskList.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('task-item')) {
      if ((e.key === 'e' || e.key === 'E') && state.editingId !== e.target.dataset.id) {
        e.preventDefault();
        enterEdit(e.target.dataset.id);
      }
    }
  });

  els.themeBtn.addEventListener('click', toggleTheme);
}

function wireParallax() {
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const svgs = document.querySelectorAll('.bg-doodle svg');
  if (!svgs.length) return;

  let ticking = false;
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        const halfW = window.innerWidth / 2;
        const halfH = window.innerHeight / 2;
        const normX = (mouseX - halfW) / halfW;
        const normY = (mouseY - halfH) / halfH;
        for (let i = 0; i < svgs.length; i++) {
          const depth = parseFloat(svgs[i].dataset.depth) || 0.5;
          const tx = Math.round(normX * 18 * depth * 100) / 100;
          const ty = Math.round(normY * 18 * depth * 100) / 100;
          svgs[i].style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
        ticking = false;
      });
    }
  }, { passive: true });
}

function boot() {
  state.tasks = loadTasks();
  applyTheme(pickTheme());

  const savedFilter = localStorage.getItem('lastFilter');
  if (savedFilter && (savedFilter === 'all' || savedFilter === 'pending' || savedFilter === 'completed')) {
    state.filter = savedFilter;
    for (let i = 0; i < els.filterBtns.length; i++) {
      const b = els.filterBtns[i];
      const match = b.dataset.filter === savedFilter;
      b.classList.toggle('active', match);
      b.setAttribute('aria-selected', match ? 'true' : 'false');
    }
  }

  if (localStorage.getItem('hasEdited')) {
    document.body.classList.add('has-edited');
  }

  render();
  wireEvents();
  wireParallax();

  requestAnimationFrame(() => {
    document.body.classList.add('ready');
    if (window.matchMedia('(min-width: 640px)').matches) {
      els.input.focus();
    }
  });

  console.log("task manager booted in", Date.now() - bootAt, "ms");
}

boot();
