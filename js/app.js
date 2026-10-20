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

function pickTheme() {
  const saved = localStorage.getItem("task_theme");
  if (saved) return saved;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem("task_theme", theme);
}

function toggleTheme() {
  const next = state.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
}

function renderStats() {
  const stats = getStats(state.tasks);
  els.statTotal.textContent = stats.total;
  els.statDone.textContent = stats.completed;
  els.statPending.textContent = stats.pending;
}

function updateCounts() {
  const stats = getStats(state.tasks);
  els.countAll.textContent = stats.total;
  els.countPending.textContent = stats.pending;
  els.countCompleted.textContent = stats.completed;
}

function updateReorderHint() {
  const isFiltered = state.filter !== 'all' || (state.query && state.query.trim().length > 0);
  if (isFiltered) {
    els.reorderHint.textContent = 'Reordering is available in All view.';
    els.reorderHint.classList.add('visible');
    els.taskList.classList.add('drag-disabled');
  } else {
    els.reorderHint.textContent = '';
    els.reorderHint.classList.remove('visible');
    els.taskList.classList.remove('drag-disabled');
  }
}

function updateLiveNumbers() {
  const rows = els.taskList.querySelectorAll('.task-item:not(.empty-item)');
  rows.forEach((item, idx) => {
    const numEl = item.querySelector('.task-number');
    if (numEl) {
      numEl.textContent = idx + 1;
    }
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

  const handle = document.createElement('div');
  handle.className = 'drag-handle';
  handle.setAttribute('role', 'button');
  handle.setAttribute('aria-label', 'Drag to reorder');
  handle.tabIndex = -1;

  const svgHandle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgHandle.setAttribute('width', '14');
  svgHandle.setAttribute('height', '14');
  svgHandle.setAttribute('viewBox', '0 0 20 20');
  svgHandle.setAttribute('fill', 'currentColor');
  svgHandle.setAttribute('aria-hidden', 'true');

  const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c1.setAttribute('cx', '7'); c1.setAttribute('cy', '4'); c1.setAttribute('r', '1.75');
  const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c2.setAttribute('cx', '13'); c2.setAttribute('cy', '4'); c2.setAttribute('r', '1.75');
  const c3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c3.setAttribute('cx', '7'); c3.setAttribute('cy', '10'); c3.setAttribute('r', '1.75');
  const c4 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c4.setAttribute('cx', '13'); c4.setAttribute('cy', '10'); c4.setAttribute('r', '1.75');
  const c5 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c5.setAttribute('cx', '7'); c5.setAttribute('cy', '16'); c5.setAttribute('r', '1.75');
  const c6 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c6.setAttribute('cx', '13'); c6.setAttribute('cy', '16'); c6.setAttribute('r', '1.75');

  svgHandle.appendChild(c1);
  svgHandle.appendChild(c2);
  svgHandle.appendChild(c3);
  svgHandle.appendChild(c4);
  svgHandle.appendChild(c5);
  svgHandle.appendChild(c6);
  handle.appendChild(svgHandle);

  const numSpan = document.createElement('span');
  numSpan.className = 'task-number';
  numSpan.textContent = number;

  const label = document.createElement('label');
  label.className = 'check-label';
  label.setAttribute('aria-label', task.completed ? 'Mark task pending' : 'Mark task completed');
  label.addEventListener('click', (e) => {
    e.preventDefault();
  });

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'sr-only task-check';
  check.checked = task.completed;
  check.dataset.action = 'toggle';

  const svgCheck = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgCheck.setAttribute('class', 'check-svg');
  svgCheck.setAttribute('viewBox', '0 0 20 20');
  svgCheck.setAttribute('fill', 'none');

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('class', 'check-box-rect');
  rect.setAttribute('x', '1');
  rect.setAttribute('y', '1');
  rect.setAttribute('width', '18');
  rect.setAttribute('height', '18');
  rect.setAttribute('rx', '9');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'check-path');
  path.setAttribute('d', 'M5.5 10.2l3 3 6-6.4');
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke-width', '1.85');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');

  svgCheck.appendChild(rect);
  svgCheck.appendChild(path);

  label.appendChild(check);
  label.appendChild(svgCheck);

  let textSlot;
  if (isEditing) {
    textSlot = document.createElement('input');
    textSlot.type = 'text';
    textSlot.className = 'task-edit-input';
    textSlot.value = task.text;
    textSlot.setAttribute('aria-label', 'Edit task text');
  } else {
    textSlot = document.createElement('span');
    textSlot.className = 'task-title';
    textSlot.textContent = task.text;
    textSlot.title = task.text;
  }

  const pill = document.createElement('div');
  pill.className = 'priority-pill priority-' + task.priority;

  const pSelect = document.createElement('select');
  pSelect.className = 'priority-inline-select';
  pSelect.setAttribute('aria-label', 'Task priority');
  pSelect.dataset.action = 'priority';

  const optLow = document.createElement('option');
  optLow.value = 'low';
  optLow.textContent = 'Low';
  if (task.priority === 'low') optLow.selected = true;

  const optMed = document.createElement('option');
  optMed.value = 'medium';
  optMed.textContent = 'Medium';
  if (task.priority === 'medium') optMed.selected = true;

  const optHigh = document.createElement('option');
  optHigh.value = 'high';
  optHigh.textContent = 'High';
  if (task.priority === 'high') optHigh.selected = true;

  pSelect.appendChild(optLow);
  pSelect.appendChild(optMed);
  pSelect.appendChild(optHigh);
  pill.appendChild(pSelect);

  const pencil = document.createElement('button');
  pencil.type = 'button';
  pencil.className = 'pencil-btn';
  pencil.setAttribute('aria-label', 'Edit task');
  pencil.dataset.action = 'edit';

  const svgPencil = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgPencil.setAttribute('width', '16');
  svgPencil.setAttribute('height', '16');
  svgPencil.setAttribute('viewBox', '0 0 24 24');
  svgPencil.setAttribute('fill', 'none');
  svgPencil.setAttribute('stroke', 'currentColor');
  svgPencil.setAttribute('stroke-width', '1.85');
  svgPencil.setAttribute('stroke-linecap', 'round');
  svgPencil.setAttribute('stroke-linejoin', 'round');

  const pPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pPath1.setAttribute('d', 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z');

  const pPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pPath2.setAttribute('d', 'm15 5 4 4');

  svgPencil.appendChild(pPath1);
  svgPencil.appendChild(pPath2);
  pencil.appendChild(svgPencil);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'delete-btn';
  del.setAttribute('aria-label', 'Delete task');
  del.dataset.action = 'delete';

  const svgDel = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgDel.setAttribute('width', '16');
  svgDel.setAttribute('height', '16');
  svgDel.setAttribute('viewBox', '0 0 24 24');
  svgDel.setAttribute('fill', 'none');
  svgDel.setAttribute('stroke', 'currentColor');
  svgDel.setAttribute('stroke-width', '1.85');
  svgDel.setAttribute('stroke-linecap', 'round');
  svgDel.setAttribute('stroke-linejoin', 'round');

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', '3 6 5 6 21 6');

  const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path1.setAttribute('d', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2');

  const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line1.setAttribute('x1', '10');
  line1.setAttribute('y1', '11');
  line1.setAttribute('x2', '10');
  line1.setAttribute('y2', '17');

  const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line2.setAttribute('x1', '14');
  line2.setAttribute('y1', '11');
  line2.setAttribute('x2', '14');
  line2.setAttribute('y2', '17');

  svgDel.appendChild(polyline);
  svgDel.appendChild(path1);
  svgDel.appendChild(line1);
  svgDel.appendChild(line2);
  del.appendChild(svgDel);

  const svgHint = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svgHint.setAttribute('class', 'mobile-hint');
  svgHint.setAttribute('width', '14');
  svgHint.setAttribute('height', '14');
  svgHint.setAttribute('viewBox', '0 0 24 24');
  svgHint.setAttribute('fill', 'none');
  svgHint.setAttribute('stroke', 'currentColor');
  svgHint.setAttribute('stroke-width', '1.85');
  svgHint.setAttribute('stroke-linecap', 'round');
  svgHint.setAttribute('stroke-linejoin', 'round');

  const polyHint = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyHint.setAttribute('points', '9 18 15 12 9 6');
  svgHint.appendChild(polyHint);

  row.appendChild(handle);
  row.appendChild(numSpan);
  row.appendChild(label);
  row.appendChild(textSlot);
  row.appendChild(pill);
  row.appendChild(pencil);
  row.appendChild(del);
  row.appendChild(svgHint);
  li.appendChild(row);

  return li;
}

function drawEmpty(type) {
  const li = document.createElement('li');
  li.className = 'empty-item';

  const box = document.createElement('div');
  box.className = 'empty-state';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'empty-icon');
  svg.setAttribute('width', '96');
  svg.setAttribute('height', '96');
  svg.setAttribute('viewBox', '0 0 96 96');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'var(--border-strong)');
  svg.setAttribute('stroke-width', '1.25');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  r.setAttribute('x', '24');
  r.setAttribute('y', '20');
  r.setAttribute('width', '48');
  r.setAttribute('height', '60');
  r.setAttribute('rx', '8');

  const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p1.setAttribute('d', 'M38 16h20a2 2 0 0 1 2 2v2H36v-2a2 2 0 0 1 2-2z');

  const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l1.setAttribute('x1', '34');
  l1.setAttribute('y1', '36');
  l1.setAttribute('x2', '62');
  l1.setAttribute('y2', '36');
  l1.setAttribute('stroke-dasharray', '3 3');

  const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l2.setAttribute('x1', '34');
  l2.setAttribute('y1', '46');
  l2.setAttribute('x2', '62');
  l2.setAttribute('y2', '46');
  l2.setAttribute('stroke-dasharray', '3 3');

  const l3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l3.setAttribute('x1', '34');
  l3.setAttribute('y1', '56');
  l3.setAttribute('x2', '52');
  l3.setAttribute('y2', '56');
  l3.setAttribute('stroke-dasharray', '3 3');

  const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p2.setAttribute('d', 'M58 64l4 4 10-10');
  p2.setAttribute('opacity', '0.45');
  p2.setAttribute('stroke', 'var(--border-strong)');

  svg.appendChild(r);
  svg.appendChild(p1);
  svg.appendChild(l1);
  svg.appendChild(l2);
  svg.appendChild(l3);
  svg.appendChild(p2);

  const t1 = document.createElement('p');
  t1.className = 'empty-title';

  const t2 = document.createElement('p');
  t2.className = 'empty-hint';

  if (type === 'search') {
    t1.textContent = 'Nothing matches. Try a different search or filter.';
    t2.textContent = 'Tip: press Escape to clear search.';
  } else {
    t1.textContent = 'No tasks yet. Add one above to get started.';
    t2.textContent = 'Tip: press Enter to submit.';
  }

  box.appendChild(svg);
  box.appendChild(t1);
  box.appendChild(t2);
  li.appendChild(box);

  return li;
}

function renderList() {
  const filtered = filterTasks(state.tasks, state.filter);
  const visible = findTasks(filtered, state.query);

  els.taskList.replaceChildren();

  if (visible.length === 0) {
    const isSearchEmpty = state.tasks.length > 0;
    els.taskList.appendChild(drawEmpty(isSearchEmpty ? 'search' : 'all'));
    return;
  }

  const fragment = document.createDocumentFragment();
  for (let i = 0; i < visible.length; i++) {
    fragment.appendChild(drawTask(visible[i], i + 1, i));
  }
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
      setTimeout(() => {
        cancelEdit(id);
      }, 340);
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
  els.formError.replaceChildren();

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.85');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');

  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z');

  const l1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l1.setAttribute('x1', '12');
  l1.setAttribute('y1', '9');
  l1.setAttribute('x2', '12');
  l1.setAttribute('y2', '13');

  const l2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  l2.setAttribute('x1', '12');
  l2.setAttribute('y1', '17');
  l2.setAttribute('x2', '12.01');
  l2.setAttribute('y2', '17');

  svg.appendChild(p);
  svg.appendChild(l1);
  svg.appendChild(l2);

  const span = document.createElement('span');
  span.textContent = msg;

  els.formError.appendChild(svg);
  els.formError.appendChild(span);
  els.formError.classList.add('visible');
}

function clearError() {
  showError('');
}

function flashAddSuccess() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    const originalBg = els.addBtn.style.backgroundColor;
    els.addBtn.style.backgroundColor = 'var(--success)';
    setTimeout(() => {
      els.addBtn.style.backgroundColor = originalBg;
    }, 200);
  } else {
    const originalHtml = els.addBtn.innerHTML;
    els.addBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    setTimeout(() => {
      els.addBtn.innerHTML = originalHtml;
    }, 400);
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

  const id = itemEl.dataset.id;
  const initialIndex = currentItems.indexOf(itemEl);
  const initialOrder = currentItems.map(item => item.dataset.id);

  try {
    if (e.target && e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
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
  const initialMidY = draggedRect.top + draggedRect.height / 2;

  drag = {
    id: id,
    itemEl: itemEl,
    rowEl: rowEl,
    target: e.target,
    pointerId: e.pointerId,
    startY: e.clientY,
    initialMidY: initialMidY,
    initialIndex: initialIndex,
    initialOrder: initialOrder,
    rowTops: rowTops,
    rowMids: rowMids,
    prefersReduced: prefersReduced
  };

  els.taskList.classList.add('is-dragging-active');
  rowEl.classList.add('is-dragging');

  if (!prefersReduced) {
    rowEl.style.transform = 'translateY(0px) rotate(0.5deg) scale(1.02)';
  } else {
    rowEl.style.transform = 'translateY(0px)';
  }
}

function swapRows(draggedItem, crossedItem, position, e) {
  const allRows = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)'));
  const oldTops = new Map();
  allRows.forEach(row => {
    oldTops.set(row, row.getBoundingClientRect().top);
  });

  const oldOffset = draggedItem.offsetTop;

  if (position === 'before') {
    crossedItem.before(draggedItem);
  } else {
    crossedItem.after(draggedItem);
  }

  const newOffset = draggedItem.offsetTop;
  const offsetDiff = newOffset - oldOffset;
  drag.startY += offsetDiff;
  drag.initialMidY += offsetDiff;

  const newDeltaY = e.clientY - drag.startY;
  if (!drag.prefersReduced) {
    drag.rowEl.style.transform = 'translateY(' + newDeltaY + 'px) rotate(0.5deg) scale(1.02)';
  } else {
    drag.rowEl.style.transform = 'translateY(' + newDeltaY + 'px)';
  }

  if (!drag.prefersReduced) {
    allRows.forEach(row => {
      if (row !== draggedItem) {
        const oldTop = oldTops.get(row);
        const newTop = row.getBoundingClientRect().top;
        const diff = oldTop - newTop;
        if (diff !== 0) {
          row.style.transition = 'none';
          row.style.transform = 'translateY(' + diff + 'px)';
          void row.offsetWidth;
          row.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
          row.style.transform = 'translateY(0)';
        }
      }
    });
  }

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
    if (drag.target && drag.target.releasePointerCapture) {
      drag.target.releasePointerCapture(drag.pointerId);
    }
  } catch (err) {}

  const rowEl = drag.rowEl;
  const draggedId = drag.id;
  const prefersReduced = drag.prefersReduced;

  els.taskList.classList.remove('is-dragging-active');
  rowEl.classList.remove('is-dragging');

  drag = null;
  justDragged = true;
  setTimeout(() => {
    justDragged = false;
  }, 100);

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
    if (drag.target && drag.target.releasePointerCapture) {
      drag.target.releasePointerCapture(drag.pointerId);
    }
  } catch (err) {}

  const allRows = Array.from(els.taskList.querySelectorAll('.task-item:not(.empty-item)'));
  const oldTops = new Map();
  allRows.forEach(row => {
    oldTops.set(row, row.getBoundingClientRect().top);
  });

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

  if (!drag.prefersReduced) {
    allRows.forEach(row => {
      const oldTop = oldTops.get(row);
      const newTop = row.getBoundingClientRect().top;
      const diff = oldTop - newTop;
      if (diff !== 0) {
        row.style.transition = 'none';
        row.style.transform = 'translateY(' + diff + 'px)';
        void row.offsetWidth;
        row.style.transition = 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)';
        row.style.transform = 'translateY(0)';
      }
    });
  }

  updateLiveNumbers();
  drag = null;
  justDragged = true;
  setTimeout(() => {
    justDragged = false;
  }, 100);
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
      const newRowNumber = visible.length;

      const newLi = drawTask(newTask, newRowNumber, 0);
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
    if (state.filter == targetFilter) return;

    state.filter = targetFilter;
    localStorage.setItem('lastFilter', targetFilter);
    for (let i = 0; i < els.filterBtns.length; i++) {
      const b = els.filterBtns[i];
      const match = b.dataset.filter == targetFilter;
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
      const id = li.dataset.id;
      state.tasks = updateTask(state.tasks, id, { priority: target.value });
      saveTasks(state.tasks);
      updateRow(id);
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

      const touchTarget = li;
      const startX = e.clientX;
      const startY = e.clientY;

      let touchTimer = setTimeout(() => {
        touchTimer = null;
        startDrag(touchTarget, e);
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
        if (!touchTimer) return;
        const dx = Math.abs(evt.clientX - startX);
        const dy = Math.abs(evt.clientY - startY);
        if (dx > 8 || dy > 8) {
          cancelTouch();
        }
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

    if (!drag.prefersReduced) {
      drag.rowEl.style.transform = 'translateY(' + deltaY + 'px) rotate(0.5deg) scale(1.02)';
    } else {
      drag.rowEl.style.transform = 'translateY(' + deltaY + 'px)';
    }

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

  window.addEventListener('pointerup', () => {
    if (drag) finishDrag();
  });

  window.addEventListener('pointercancel', () => {
    if (drag) finishDrag();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drag) {
      cancelDrag();
    }
  });

  els.taskList.addEventListener('click', (e) => {
    if (justDragged) return;

    const delBtn = e.target.closest('[data-action="delete"]');
    if (delBtn) {
      const li = delBtn.closest('.task-item');
      if (!li || li.classList.contains('deleting')) return;

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const id = li.dataset.id;

      if (prefersReduced) {
        li.classList.add('deleting');
        const onEnd = (evt) => {
          if (evt.propertyName === 'grid-template-rows') {
            li.removeEventListener('transitionend', onEnd);
            state.tasks = removeTask(state.tasks, id);
            sync();
          }
        };
        li.addEventListener('transitionend', onEnd);
      } else {
        li.classList.add('shake');
        setTimeout(() => {
          li.classList.add('deleting');
          const onEnd = (evt) => {
            if (evt.propertyName === 'grid-template-rows') {
              li.removeEventListener('transitionend', onEnd);
              state.tasks = removeTask(state.tasks, id);
              sync();
            }
          };
          li.addEventListener('transitionend', onEnd);
        }, 320);
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

    const id = li.dataset.id;
    state.tasks = toggleTask(state.tasks, id);
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
          const svg = svgs[i];
          const depth = parseFloat(svg.dataset.depth) || 0.5;
          const tx = Math.round(normX * 18 * depth * 100) / 100;
          const ty = Math.round(normY * 18 * depth * 100) / 100;
          svg.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
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

