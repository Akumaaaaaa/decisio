// app.js — Main application controller

import * as State    from './state.js';
import * as Scoring  from './scoring.js';
import * as UI       from './ui.js';
import * as Charts   from './charts.js';
import { TEMPLATES } from './templates.js';

// ── Boot ──────────────────────────────────────────

function init() {
  initTheme();

  // URL state takes priority over localStorage (shared links)
  const fromURL = State.decodeFromURL();
  if (!fromURL) State.loadFromStorage();

  const startStep = fromURL ? 5 : (State.getState().step || 1);

  bindNavigation();
  bindStep1();
  bindStep2();
  bindStep3();
  bindStep5();
  bindHome(startStep);

  // Shared links skip the landing screen and jump straight to the results
  if (fromURL) {
    enterApp();
    UI.navigateToStep(startStep);
    renderStep(startStep);
  }

  // Resize: switch matrix/cards layout
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (State.getState().step === 4) renderStep4();
    }, 180);
  });
}

// ── Home / landing screen ─────────────────────────

function bindHome(startStep) {
  document.getElementById('btn-start')?.addEventListener('click', () => {
    enterApp();
    UI.navigateToStep(startStep);
    renderStep(startStep);
  });
}

function enterApp() {
  document.getElementById('home-screen')?.setAttribute('hidden', '');
  document.querySelector('.app-header')?.removeAttribute('hidden');
  document.querySelector('.progress-nav')?.removeAttribute('hidden');
  document.getElementById('wizard')?.removeAttribute('hidden');
  document.querySelector('.wizard-nav')?.removeAttribute('hidden');
}

// ── Theme ─────────────────────────────────────────

function initTheme() {
  const saved   = localStorage.getItem('ds-theme');
  const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (sysDark ? 'dark' : 'light'));

  document.getElementById('btn-dark-mode')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('ds-theme', next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('btn-dark-mode');
  if (btn) btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
}

// ── Navigation ────────────────────────────────────

function bindNavigation() {
  document.getElementById('btn-next')?.addEventListener('click', () => {
    const current = State.getState().step;
    const error   = validateStep(current);

    if (error) {
      UI.showToast(error, 'error');
      highlightStepError(current);
      return;
    }

    const next = current + 1;
    State.setState({ step: next });
    renderStep(next);       // render content while step is still hidden
    UI.navigateToStep(next); // then reveal (charts measure real clientWidth)
  });

  document.getElementById('btn-back')?.addEventListener('click', () => {
    const prev = State.getState().step - 1;
    if (prev < 1) return;
    State.setState({ step: prev });
    renderStep(prev);
    UI.navigateToStep(prev);
  });
}

function validateStep(step) {
  const { title, options, criteria } = State.getState();
  if (step === 1 && !title.trim())
    return 'Please enter a decision title to continue.';
  if (step === 2 && options.filter(o => o.name.trim()).length < 2)
    return 'Please name at least 2 options to continue.';
  if (step === 3 && criteria.filter(c => c.name.trim()).length < 1)
    return 'Please name at least 1 criterion to continue.';
  return null;
}

function highlightStepError(step) {
  if (step === 1) UI.highlightInvalid('decision-title');
  if (step === 2) {
    const blank = State.getState().options.find(o => !o.name.trim());
    if (blank) UI.highlightInvalid(`opt-${blank.id}`);
  }
  if (step === 3) {
    const blank = State.getState().criteria.find(c => !c.name.trim());
    if (blank) UI.highlightInvalid(`crit-${blank.id}`);
  }
}

// ── Step dispatch ─────────────────────────────────

function renderStep(step) {
  const render = [null, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];
  render[step]?.();
}

// ── Step 1 — Setup ────────────────────────────────

function renderStep1() {
  const state      = State.getState();
  const titleInput = document.getElementById('decision-title');
  if (titleInput) titleInput.value = state.title || '';

  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.toggle('is-selected', card.dataset.template === state.template);
  });
}

function bindStep1() {
  document.getElementById('decision-title')?.addEventListener('input', e => {
    State.setState({ title: e.target.value });
  });

  document.querySelectorAll('.template-card').forEach(card => {
    card.addEventListener('click', () => {
      const tplId = card.dataset.template;
      const tpl   = TEMPLATES[tplId];
      if (!tpl) return;

      const state        = State.getState();
      const hasDirt      = state.options.some(o => o.name) || state.criteria.some(c => c.name);
      const isNewTpl     = state.template !== tplId;

      const apply = () => {
        State.applyTemplate(tpl);

        const titleInput = document.getElementById('decision-title');
        if (titleInput) {
          titleInput.placeholder = tpl.placeholder || 'What are you deciding?';
          if (!State.getState().title) titleInput.value = '';
        }

        document.querySelectorAll('.template-card').forEach(c => {
          c.classList.toggle('is-selected', c.dataset.template === tplId);
        });

        UI.showToast('Template applied.', 'success');
      };

      if (hasDirt) {
        // Warn whether switching templates OR re-applying the same one (resets edits)
        UI.showModal(apply, {
          title:        isNewTpl ? 'Replace current data?' : 'Reset to template defaults?',
          desc:         isNewTpl
            ? 'Applying this template will replace your current options and criteria. Your scores will be lost.'
            : 'This will reset your criteria to the original template values. Any edits you made will be lost.',
          confirmLabel: isNewTpl ? 'Apply Template' : 'Reset Template'
        });
      } else {
        apply();
      }
    });
  });
}

// ── Step 2 — Options ──────────────────────────────

function renderStep2() {
  UI.renderOptions(
    State.getState().options,
    id   => { State.removeOption(id); renderStep2(); },
    (id, name) => State.updateOption(id, name)
  );
}

function bindStep2() {
  document.getElementById('btn-add-option')?.addEventListener('click', () => {
    if (State.getState().options.length >= 5) {
      UI.showToast('Maximum of 5 options reached.', 'warning');
      return;
    }
    State.addOption();
    renderStep2();
    focusLastInput('#option-list .field__input');
  });
}

// ── Step 3 — Criteria ─────────────────────────────

function renderStep3() {
  UI.renderCriteria(
    State.getState().criteria,
    id       => { State.removeCriterion(id); renderStep3(); },
    (id, patch) => { State.updateCriterion(id, patch); }
  );
}

function bindStep3() {
  document.getElementById('btn-add-criterion')?.addEventListener('click', () => {
    if (State.getState().criteria.length >= 8) {
      UI.showToast('Maximum of 8 criteria reached.', 'warning');
      return;
    }
    State.addCriterion();
    renderStep3();
    focusLastInput('#criteria-list .criterion-row__name .field__input');
  });
}

// ── Step 4 — Scoring ──────────────────────────────

function renderStep4() {
  const state = State.getState();
  UI.renderMatrix(state, (critId, optId, val) => {
    State.setScore(critId, optId, val);
    const updated = State.getState();
    const scores  = Scoring.calculateScores(updated);
    UI.updateTotals(updated, scores);
    UI.updateScoreProgressLive(updated);
  });

  const scores = Scoring.calculateScores(state);
  UI.updateTotals(state, scores);
}

// ── Step 5 — Results ──────────────────────────────

function renderStep5() {
  const state       = State.getState();
  const scores      = Scoring.calculateScores(state);
  const winner      = Scoring.getWinner(state, scores);
  const proscons    = Scoring.generateProscons(state, scores);
  const sensitivity = Scoring.runSensitivityAnalysis(state, scores);
  const insights    = Scoring.generateInsights(state, scores, sensitivity);

  const subtitle = document.getElementById('results-decision-name');
  if (subtitle) subtitle.textContent = state.title ? `"${state.title}"` : '';

  UI.renderWinner(winner, scores);
  UI.renderBreakdownTable(state, scores);
  UI.renderProscons(state, proscons, scores);
  UI.renderSensitivity(sensitivity);
  UI.renderInsights(insights);

  // Charts render after layout is stable
  requestAnimationFrame(() => {
    Charts.renderBarChart('chart-bar', state.options, scores);
    Charts.renderRadarChart('chart-radar', state.options, state.criteria, scores);
    Charts.renderChartLegend('chart-legend', state.options);
  });
}

function bindStep5() {
  // Share via URL
  const LONG_URL_THRESHOLD = 1800;

  document.getElementById('btn-share')?.addEventListener('click', async () => {
    const url = State.encodeToURL();
    if (!url) { UI.showToast('Could not generate share link.', 'error'); return; }
    const isLong = url.length > LONG_URL_THRESHOLD;

    try {
      await navigator.clipboard.writeText(url);
      const fb = document.getElementById('share-feedback');
      if (fb) { fb.removeAttribute('hidden'); setTimeout(() => fb.setAttribute('hidden', ''), 3000); }
      UI.showToast(
        isLong
          ? 'Link copied — it is long, so some apps (email, SMS) may cut it off. Consider Export/PDF instead for large decisions.'
          : 'Link copied to clipboard!',
        isLong ? 'warning' : 'success'
      );
    } catch {
      // Fallback: write state to URL bar so user can copy manually
      history.replaceState(null, '', url);
      UI.showToast('Link updated in address bar — copy it to share.', 'info');
    }
  });

  // Export (print / save as PDF)
  document.getElementById('btn-export')?.addEventListener('click', () => {
    window.print();
  });

  // New Decision
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    UI.showModal(
      () => {
        State.resetState();
        const titleInput = document.getElementById('decision-title');
        if (titleInput) { titleInput.value = ''; titleInput.placeholder = 'e.g. Job Offer A vs Job Offer B'; }
        document.querySelectorAll('.template-card').forEach(c => c.classList.remove('is-selected'));
        State.setState({ step: 1 });
        UI.navigateToStep(1);
        renderStep1();
        UI.showToast('Started a new decision.', 'info');
      },
      {
        title:        'Start over?',
        desc:         'This will clear your current decision permanently. Your progress will be lost.',
        confirmLabel: 'Yes, start over'
      }
    );
  });
}

// ── Utilities ─────────────────────────────────────

function focusLastInput(selector) {
  setTimeout(() => {
    const inputs = document.querySelectorAll(selector);
    inputs[inputs.length - 1]?.focus();
  }, 50);
}

// ── Entry point ───────────────────────────────────

document.addEventListener('DOMContentLoaded', init);
