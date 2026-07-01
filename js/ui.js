// ui.js — DOM rendering and UI state management

import { getOptionColor } from './charts.js';

// ── SVG icon strings ──────────────────────────────

const ICON = {
  remove:  `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  drag:    `<svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" opacity=".5"><circle cx="4.5" cy="3" r="1.2"/><circle cx="9.5" cy="3" r="1.2"/><circle cx="4.5" cy="7" r="1.2"/><circle cx="9.5" cy="7" r="1.2"/><circle cx="4.5" cy="11" r="1.2"/><circle cx="9.5" cy="11" r="1.2"/></svg>`,
  info:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  check:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`,
  cross:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function scoreLevel(v) {
  return v >= 7 ? 'high' : v >= 4 ? 'mid' : 'low';
}

// ── Step navigation ───────────────────────────────

export function navigateToStep(stepNum) {
  document.querySelectorAll('.wizard-step').forEach(el => {
    parseInt(el.dataset.step) === stepNum
      ? el.removeAttribute('hidden')
      : el.setAttribute('hidden', '');
  });

  // Progress bubbles
  document.querySelectorAll('.progress-step').forEach(el => {
    const n = parseInt(el.dataset.step);
    el.classList.toggle('is-active', n === stepNum);
    el.classList.toggle('is-complete', n < stepNum);
    n === stepNum
      ? el.setAttribute('aria-current', 'step')
      : el.removeAttribute('aria-current');
  });

  // Progress bar fill: 0% at step 1, 100% at step 5
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${((stepNum - 1) / 4) * 100}%`;

  const track = document.querySelector('.progress-track');
  if (track) {
    track.setAttribute('aria-valuenow', stepNum);
    track.setAttribute('aria-label', `Step ${stepNum} of 5`);
  }

  // Back / Next buttons
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');

  if (btnBack) btnBack.disabled = stepNum === 1;

  if (btnNext) {
    if (stepNum === 5) {
      btnNext.setAttribute('hidden', '');
    } else {
      btnNext.removeAttribute('hidden');
      const isLast = stepNum === 4;
      btnNext.innerHTML = isLast
        ? `See Results <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`
        : `Next <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    }
  }

  document.getElementById('current-step-num')?.replaceChildren(document.createTextNode(stepNum));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  announce(`Step ${stepNum} of 5`);
}

// ── Option List ───────────────────────────────────

export function renderOptions(options, onRemove, onUpdate) {
  const list = document.getElementById('option-list');
  if (!list) return;

  list.innerHTML = options.map((opt, i) => `
    <div class="option-row" role="listitem" data-option-id="${opt.id}">
      <span class="option-row__drag" aria-hidden="true">${ICON.drag}</span>
      <div class="option-row__field">
        <label class="sr-only" for="opt-${opt.id}">Option ${i + 1}</label>
        <input class="field__input" type="text" id="opt-${opt.id}"
          placeholder="Option ${String.fromCharCode(65 + i)}"
          maxlength="60" autocomplete="off" spellcheck="true"
          value="${esc(opt.name)}" data-option-id="${opt.id}"/>
      </div>
      <button class="btn-icon btn-icon--remove" type="button"
        data-option-id="${opt.id}" aria-label="Remove option ${i + 1}"
        ${options.length <= 2 ? 'disabled' : ''}>${ICON.remove}</button>
    </div>`).join('');

  list.querySelectorAll('.field__input').forEach(el => {
    el.addEventListener('input', e => onUpdate(e.target.dataset.optionId, e.target.value));
  });

  list.querySelectorAll('.btn-icon--remove').forEach(el => {
    el.addEventListener('click', e => onRemove(e.currentTarget.dataset.optionId));
  });

  const hint = document.getElementById('option-limit-hint');
  const addBtn = document.getElementById('btn-add-option');
  if (hint) hint.textContent = options.length >= 5 ? 'Maximum 5 options reached.' : '';
  if (addBtn) addBtn.disabled = options.length >= 5;
}

// ── Criteria List ─────────────────────────────────

const PLACEHOLDER_NAMES = ['Salary', 'Work-Life Balance', 'Growth Potential', 'Culture', 'Location', 'Risk', 'Cost', 'Quality'];

export function renderCriteria(criteria, onRemove, onUpdate) {
  const list = document.getElementById('criteria-list');
  if (!list) return;

  list.innerHTML = criteria.map((crit, i) => `
    <div class="criterion-row" role="listitem" data-criterion-id="${crit.id}">
      <div class="criterion-row__name">
        <label class="sr-only" for="crit-${crit.id}">Criterion ${i + 1} name</label>
        <input class="field__input" type="text" id="crit-${crit.id}"
          placeholder="${PLACEHOLDER_NAMES[i % PLACEHOLDER_NAMES.length]}"
          maxlength="50" autocomplete="off"
          value="${esc(crit.name)}"
          data-criterion-id="${crit.id}" data-field="name"/>
      </div>

      <div class="criterion-row__weight" role="group"
           aria-label="Importance weight for criterion ${i + 1}">
        ${[1, 2, 3, 4, 5].map(v => `
          <button class="weight-pip ${v <= crit.weight ? 'is-active' : ''}" type="button"
            data-criterion-id="${crit.id}" data-value="${v}"
            aria-label="Weight ${v}" aria-pressed="${v === crit.weight}"></button>
        `).join('')}
        <span class="weight-value" aria-live="polite" aria-label="Current weight: ${crit.weight}">${crit.weight}</span>
      </div>

      <div class="criterion-row__invert">
        <label class="toggle" title="Lower score is better (e.g. cost, commute, risk)">
          <input class="toggle__input" type="checkbox"
            data-criterion-id="${crit.id}" data-field="inverted"
            ${crit.inverted ? 'checked' : ''}
            aria-label="Lower is better for ${esc(crit.name || 'this criterion')}"/>
          <span class="toggle__track" aria-hidden="true">
            <span class="toggle__thumb"></span>
          </span>
        </label>
      </div>

      <button class="btn-icon btn-icon--remove" type="button"
        data-criterion-id="${crit.id}" aria-label="Remove criterion ${i + 1}"
        ${criteria.length <= 1 ? 'disabled' : ''}>${ICON.remove}</button>
    </div>`).join('');

  // Weight pips
  list.querySelectorAll('.weight-pip').forEach(pip => {
    pip.addEventListener('click', e => {
      const id  = e.currentTarget.dataset.criterionId;
      const val = parseInt(e.currentTarget.dataset.value);
      onUpdate(id, { weight: val });

      const row = list.querySelector(`.criterion-row[data-criterion-id="${id}"]`);
      if (!row) return;
      row.querySelectorAll('.weight-pip').forEach(p => {
        const pv = parseInt(p.dataset.value);
        p.classList.toggle('is-active', pv <= val);
        p.setAttribute('aria-pressed', String(pv === val));
      });
      const valueEl = row.querySelector('.weight-value');
      if (valueEl) {
        valueEl.textContent = val;
        valueEl.setAttribute('aria-label', `Current weight: ${val}`);
      }
    });
  });

  // Name inputs
  list.querySelectorAll('input[data-field="name"]').forEach(el => {
    el.addEventListener('input', e => onUpdate(e.target.dataset.criterionId, { name: e.target.value }));
  });

  // Invert toggles
  list.querySelectorAll('input[data-field="inverted"]').forEach(el => {
    el.addEventListener('change', e => onUpdate(e.target.dataset.criterionId, { inverted: e.target.checked }));
  });

  // Remove buttons
  list.querySelectorAll('.btn-icon--remove').forEach(el => {
    el.addEventListener('click', e => onRemove(e.currentTarget.dataset.criterionId));
  });

  const hint   = document.getElementById('criteria-limit-hint');
  const addBtn = document.getElementById('btn-add-criterion');
  if (hint)   hint.textContent = criteria.length >= 8 ? 'Maximum 8 criteria reached.' : '';
  if (addBtn) addBtn.disabled  = criteria.length >= 8;
}

// ── Scoring Matrix ────────────────────────────────

export function renderMatrix(state, onScore) {
  const isMobile = window.innerWidth < 640;
  const scroll   = document.querySelector('.matrix-scroll');
  const cards    = document.getElementById('scoring-cards');

  if (isMobile) {
    scroll?.setAttribute('hidden', '');
    if (cards) { cards.removeAttribute('hidden'); renderCards(state, cards, onScore); }
  } else {
    scroll?.removeAttribute('hidden');
    cards?.setAttribute('hidden', '');
    renderTable(state, onScore);
  }

  syncScoreProgress(state);
}

function renderTable(state, onScore) {
  const { options, criteria, scores } = state;

  // Header
  const headerRow = document.getElementById('matrix-header-row');
  if (headerRow) {
    headerRow.querySelectorAll('th:not(:first-child)').forEach(th => th.remove());
    options.forEach((opt, i) => {
      const th  = document.createElement('th');
      th.scope  = 'col';
      th.className = 'matrix-cell matrix-cell--header';
      th.innerHTML = `<span style="color:${getOptionColor(i)};font-weight:700">${esc(opt.name || `Option ${i + 1}`)}</span>`;
      headerRow.appendChild(th);
    });
  }

  // Body
  const tbody = document.getElementById('matrix-body');
  if (tbody) {
    tbody.innerHTML = criteria.map(crit => {
      const cells = options.map(opt => {
        const raw = scores[crit.id]?.[opt.id] ?? '';
        const lvl = raw ? scoreLevel(raw) : '';
        return `
          <td class="matrix-cell">
            <div class="score-cell-wrap">
              <label class="sr-only" for="sc-${crit.id}-${opt.id}">
                Score for ${esc(opt.name || 'option')} on ${esc(crit.name || 'criterion')}
              </label>
              <input class="score-input" type="number" id="sc-${crit.id}-${opt.id}"
                min="1" max="10" step="1" placeholder="—"
                value="${raw}" data-criterion-id="${crit.id}" data-option-id="${opt.id}"
                ${lvl ? `data-score="${lvl}"` : ''}/>
              <div class="score-track" aria-hidden="true">
                <div class="score-track__fill" ${lvl ? `data-score="${lvl}"` : ''}
                     style="width:${raw ? (raw / 10 * 100) : 0}%"></div>
              </div>
            </div>
          </td>`;
      }).join('');

      return `
        <tr class="matrix-row" data-criterion-id="${crit.id}">
          <th scope="row" class="matrix-cell matrix-cell--criterion-label">
            <span class="matrix-criterion-name">${esc(crit.name || 'Unnamed')}</span>
            <span class="matrix-criterion-weight">×${crit.weight}</span>
            ${crit.inverted ? `<span class="badge-inverted" aria-label="Lower is better">↓ lower</span>` : ''}
          </th>
          ${cells}
        </tr>`;
    }).join('');

    attachScoreInputs(tbody, onScore);
  }

  syncTotalRow(state);
}

function renderCards(state, container, onScore) {
  const { options, criteria, scores } = state;

  container.innerHTML = criteria.map(crit => {
    const optCells = options.map((opt, i) => {
      const raw = scores[crit.id]?.[opt.id] ?? '';
      const lvl = raw ? scoreLevel(raw) : '';
      return `
        <div class="scoring-card__option">
          <label style="color:${getOptionColor(i)}" for="mc-${crit.id}-${opt.id}">
            ${esc(opt.name || `Option ${i + 1}`)}
          </label>
          <div class="score-cell-wrap">
            <input class="score-input" type="number" id="mc-${crit.id}-${opt.id}"
              min="1" max="10" step="1" placeholder="—"
              value="${raw}" data-criterion-id="${crit.id}" data-option-id="${opt.id}"
              ${lvl ? `data-score="${lvl}"` : ''}/>
            <div class="score-track" aria-hidden="true">
              <div class="score-track__fill" ${lvl ? `data-score="${lvl}"` : ''}
                   style="width:${raw ? (raw / 10 * 100) : 0}%"></div>
            </div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="scoring-card" data-criterion-id="${crit.id}">
        <div class="scoring-card__header">
          <h3 class="scoring-card__name">${esc(crit.name || 'Unnamed criterion')}</h3>
          <span class="scoring-card__weight">Weight: ${crit.weight}${crit.inverted ? ' · ↓ lower' : ''}</span>
        </div>
        <div class="scoring-card__options">${optCells}</div>
      </div>`;
  }).join('');

  attachScoreInputs(container, onScore);
}

function attachScoreInputs(container, onScore) {
  container.querySelectorAll('.score-input').forEach(input => {
    // Prevent accidental value changes when the page is scrolled with the
    // cursor resting over a focused number input.
    input.addEventListener('wheel', e => {
      if (document.activeElement === input) e.preventDefault();
    }, { passive: false });

    input.addEventListener('input', e => {
      let val = parseInt(e.target.value, 10);
      if (isNaN(val)) val = null;
      else val = Math.min(10, Math.max(1, val));
      syncScoreVisual(e.target, val);
      onScore(e.target.dataset.criterionId, e.target.dataset.optionId, val);
    });

    input.addEventListener('blur', e => {
      if (e.target.value === '') return;
      const clamped = Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1));
      e.target.value = clamped;
      syncScoreVisual(e.target, clamped);
    });
  });
}

function syncScoreVisual(input, val) {
  const lvl  = val ? scoreLevel(val) : null;
  const wrap = input.closest('.score-cell-wrap');
  const fill = wrap?.querySelector('.score-track__fill');

  lvl ? input.setAttribute('data-score', lvl) : input.removeAttribute('data-score');

  if (fill) {
    fill.style.width = val ? `${(val / 10) * 100}%` : '0%';
    lvl ? fill.setAttribute('data-score', lvl) : fill.removeAttribute('data-score');
  }
}

function syncTotalRow(state, computedScores) {
  const totalRow = document.getElementById('matrix-total-row');
  if (!totalRow) return;

  totalRow.querySelectorAll('td').forEach(td => td.remove());
  state.options.forEach(opt => {
    const pct = computedScores?.[opt.id]?.normalizedPct;
    const td  = document.createElement('td');
    td.className  = 'matrix-cell';
    td.innerHTML  = `<strong>${pct !== undefined ? pct + '%' : '—'}</strong>`;
    totalRow.appendChild(td);
  });
}

export function updateTotals(state, scores) {
  syncTotalRow(state, scores);
}

function syncScoreProgress(state) {
  const { options, criteria, scores } = state;
  let filled = 0;
  const total = options.length * criteria.length;
  for (const c of criteria)
    for (const o of options)
      if (scores[c.id]?.[o.id] !== null && scores[c.id]?.[o.id] !== undefined) filled++;

  const filledEl = document.getElementById('score-filled');
  const totalEl  = document.getElementById('score-total');
  const fillEl   = document.getElementById('score-progress-fill');
  if (filledEl) filledEl.textContent = filled;
  if (totalEl)  totalEl.textContent  = total;
  if (fillEl)   fillEl.style.width   = total > 0 ? `${(filled / total) * 100}%` : '0%';
}

export function updateScoreProgressLive(state) {
  syncScoreProgress(state);
}

// ── Results ───────────────────────────────────────

export function renderWinner(winner, scores) {
  if (!winner) return;
  const pct      = scores[winner.id]?.normalizedPct ?? 0;
  const filled   = scores[winner.id]?.filledCount ?? 0;
  const el       = document.getElementById('winner-name');
  const sc       = document.getElementById('winner-score');
  const banner   = document.getElementById('winner-banner');
  if (el) el.textContent = winner.name || 'Unnamed';
  if (sc) sc.textContent = filled > 0 ? `${pct}% weighted score` : 'Enter scores to see your result';
  if (banner) banner.style.opacity = filled > 0 ? '1' : '0.6';
}

export function renderBreakdownTable(state, scores) {
  const { options, criteria } = state;

  // Find winner id
  let winnerId = null, bestPct = -1;
  options.forEach(o => {
    const pct = scores[o.id]?.normalizedPct ?? 0;
    if (pct > bestPct) { bestPct = pct; winnerId = o.id; }
  });

  // Header
  const headerRow = document.getElementById('breakdown-header-row');
  if (headerRow) {
    headerRow.querySelectorAll('th:not(.breakdown-cell--criterion):not(.breakdown-cell--weight)').forEach(th => th.remove());
    options.forEach((opt, i) => {
      const th     = document.createElement('th');
      th.scope     = 'col';
      th.className = 'breakdown-cell';
      th.style.color = getOptionColor(i);
      th.textContent = opt.name || `Option ${i + 1}`;
      headerRow.appendChild(th);
    });
  }

  // Body
  const tbody = document.getElementById('breakdown-body');
  if (tbody) {
    tbody.innerHTML = criteria.map(crit => {
      const cells = options.map(opt => {
        const raw      = scores[opt.id]?.perCriterion[crit.id]?.raw;
        const weighted = scores[opt.id]?.perCriterion[crit.id]?.weighted;
        const lvl      = raw ? scoreLevel(raw) : null;
        const winner   = opt.id === winnerId ? 'is-winner' : '';
        return `
          <td class="breakdown-cell ${winner}">
            ${raw
              ? `<span class="score-pill score-pill--${lvl}">${raw}</span><small style="color:var(--color-text-muted);margin-left:5px">(${(weighted ?? 0).toFixed(0)})</small>`
              : `<span style="color:var(--color-text-muted)">—</span>`}
          </td>`;
      }).join('');

      return `
        <tr>
          <td class="breakdown-cell breakdown-cell--criterion">
            ${esc(crit.name || 'Unnamed')}
            ${crit.inverted ? `<span class="badge-inverted">↓</span>` : ''}
          </td>
          <td class="breakdown-cell breakdown-cell--weight">×${crit.weight}</td>
          ${cells}
        </tr>`;
    }).join('');
  }

  // Footer totals
  const totalRow = document.getElementById('breakdown-total-row');
  if (totalRow) {
    totalRow.innerHTML = `<th scope="row" class="breakdown-cell" colspan="2">Total Score</th>`;
    options.forEach(opt => {
      const pct = scores[opt.id]?.normalizedPct ?? 0;
      const td  = document.createElement('td');
      td.className = `breakdown-cell ${opt.id === winnerId ? 'is-winner' : ''}`;
      td.innerHTML = `<strong>${pct}%</strong>`;
      totalRow.appendChild(td);
    });
  }
}

export function renderProscons(state, proscons, scores) {
  const container = document.getElementById('proscons-grid');
  if (!container) return;

  let winnerId = null, best = -1;
  state.options.forEach(o => {
    const p = scores[o.id]?.normalizedPct ?? 0;
    if (p > best) { best = p; winnerId = o.id; }
  });

  container.innerHTML = state.options.map((opt, i) => {
    const color = getOptionColor(i);
    const pc    = proscons[opt.id] || { pros: [], cons: [] };
    const pct   = scores[opt.id]?.normalizedPct ?? 0;

    const proList = pc.pros.length
      ? `<ul class="proscon-list">${pc.pros.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`
      : `<p class="proscon-empty">No standout strengths vs. other options.</p>`;

    const conList = pc.cons.length
      ? `<ul class="proscon-list">${pc.cons.map(c => `<li>${esc(c)}</li>`).join('')}</ul>`
      : `<p class="proscon-empty">No notable weaknesses vs. other options.</p>`;

    return `
      <div class="proscon-card ${opt.id === winnerId ? 'is-winner' : ''}" role="listitem">
        <div class="proscon-card__header">
          <h3 class="proscon-card__name" style="color:${color}">${esc(opt.name || `Option ${i + 1}`)}</h3>
          <span class="proscon-card__pct" style="color:${color}">${pct}%</span>
        </div>
        <div class="proscon-card__section proscon-card__section--pros">
          <h4 class="proscon-card__label">${ICON.check} Strengths</h4>
          ${proList}
        </div>
        <div class="proscon-card__section proscon-card__section--cons">
          <h4 class="proscon-card__label">${ICON.cross} Weaknesses</h4>
          ${conList}
        </div>
      </div>`;
  }).join('');
}

export function renderSensitivity(sensitivity) {
  const container = document.getElementById('sensitivity-list');
  if (!container) return;

  if (!sensitivity.length) {
    container.innerHTML = `<p style="color:var(--color-text-muted);font-size:.875rem">Not enough data for sensitivity analysis.</p>`;
    return;
  }

  container.innerHTML = sensitivity.map(s => `
    <div class="sensitivity-item" role="listitem">
      <span class="sensitivity-item__name">${esc(s.criterionName)}</span>
      <span class="sensitivity-item__bar">
        <span class="sensitivity-item__fill" style="width:${Math.round(s.impact * 100)}%"></span>
      </span>
      <span class="sensitivity-item__tag sensitivity-item__tag--${s.isPivotal ? 'pivotal' : 'stable'}">
        ${s.isPivotal ? '⚠ Pivotal' : 'Stable'}
      </span>
    </div>`).join('');
}

export function renderInsights(insights) {
  const container = document.getElementById('insights-list');
  if (!container) return;

  if (!insights.length) {
    container.innerHTML = `<li style="color:var(--color-text-muted);font-size:.875rem">Fill in your scores to generate insights.</li>`;
    return;
  }

  container.innerHTML = insights.map(ins => `
    <li class="insight-item insight-item--${ins.type}">
      <span class="insight-item__icon">${ICON[ins.type] || ICON.info}</span>
      <span>${ins.text}</span>
    </li>`).join('');
}

// ── Toast ─────────────────────────────────────────

let _toastTimer = null;

export function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  const iconEl = document.getElementById('toast-icon');
  if (!toast || !msgEl) return;

  clearTimeout(_toastTimer);

  const icons = { info: 'ℹ️', success: '✓', error: '✕', warning: '⚠️' };
  if (iconEl) iconEl.textContent = icons[type] || '';
  msgEl.textContent = message;

  toast.removeAttribute('hidden');
  toast.style.animation = 'none';   // 1. stop current animation
  void toast.offsetHeight;          // 2. flush the 'none' state via reflow
  toast.style.animation = '';       // 3. restore CSS animation → restarts cleanly

  _toastTimer = setTimeout(() => toast.setAttribute('hidden', ''), 3200);
}

// ── Modal ─────────────────────────────────────────

export function showModal(onConfirm, config = {}) {
  const overlay    = document.getElementById('modal-overlay');
  const titleEl    = document.getElementById('modal-title');
  const descEl     = document.getElementById('modal-desc');
  const confirmBtn = document.getElementById('modal-confirm');
  const cancelBtn  = document.getElementById('modal-cancel');
  if (!overlay) return;

  if (titleEl)    titleEl.textContent    = config.title        || 'Are you sure?';
  if (descEl)     descEl.textContent     = config.desc         || 'This action cannot be undone.';
  if (confirmBtn) confirmBtn.textContent = config.confirmLabel || 'Confirm';

  overlay.removeAttribute('hidden');
  setTimeout(() => confirmBtn?.focus(), 60);

  const cleanup = () => {
    confirmBtn?.removeEventListener('click', onOk);
    cancelBtn?.removeEventListener('click', onCancel);
    overlay.removeEventListener('click', onOverlay);
    document.removeEventListener('keydown', onKey);
  };

  const onOk = () => { hideModal(); cleanup(); onConfirm?.(); };
  const onCancel = () => { hideModal(); cleanup(); };
  const onOverlay = e => { if (e.target === overlay) onCancel(); };
  const onKey = e => { if (e.key === 'Escape') onCancel(); };

  confirmBtn?.addEventListener('click', onOk);
  cancelBtn?.addEventListener('click', onCancel);
  overlay.addEventListener('click', onOverlay);
  document.addEventListener('keydown', onKey);
}

export function hideModal() {
  document.getElementById('modal-overlay')?.setAttribute('hidden', '');
}

// ── Validation highlight ──────────────────────────

export function highlightInvalid(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.add('is-invalid');
  el.focus();
  el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
}

// ── Screen reader announcer ───────────────────────

function announce(msg) {
  const el = document.getElementById('sr-announcer');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}
