// state.js — Single source of truth with localStorage persistence

const STORAGE_KEY = 'decision-simulator-v1';

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function buildInitialState() {
  const options = [
    { id: uid(), name: '' },
    { id: uid(), name: '' }
  ];
  const criteria = [
    { id: uid(), name: '', weight: 3, inverted: false }
  ];
  const scores = {};
  for (const c of criteria) {
    scores[c.id] = {};
    for (const o of options) scores[c.id][o.id] = null;
  }
  return { step: 1, title: '', template: null, options, criteria, scores };
}

let _state = buildInitialState();

export function getState() {
  return _state;
}

export function setState(patch) {
  _state = { ..._state, ...patch };
  persist();
}

export function addOption() {
  const opt = { id: uid(), name: '' };
  const scores = { ..._state.scores };
  for (const c of _state.criteria) {
    scores[c.id] = { ...scores[c.id], [opt.id]: null };
  }
  _state = { ..._state, options: [..._state.options, opt], scores };
  persist();
  return opt;
}

export function removeOption(id) {
  const scores = {};
  for (const [critId, optMap] of Object.entries(_state.scores)) {
    scores[critId] = Object.fromEntries(
      Object.entries(optMap).filter(([optId]) => optId !== id)
    );
  }
  _state = { ..._state, options: _state.options.filter(o => o.id !== id), scores };
  persist();
}

export function updateOption(id, name) {
  _state = {
    ..._state,
    options: _state.options.map(o => o.id === id ? { ...o, name } : o)
  };
  persist();
}

export function addCriterion() {
  const crit = { id: uid(), name: '', weight: 3, inverted: false };
  const scores = { ..._state.scores, [crit.id]: {} };
  for (const o of _state.options) scores[crit.id][o.id] = null;
  _state = { ..._state, criteria: [..._state.criteria, crit], scores };
  persist();
  return crit;
}

export function removeCriterion(id) {
  const scores = Object.fromEntries(
    Object.entries(_state.scores).filter(([critId]) => critId !== id)
  );
  _state = { ..._state, criteria: _state.criteria.filter(c => c.id !== id), scores };
  persist();
}

export function updateCriterion(id, patch) {
  _state = {
    ..._state,
    criteria: _state.criteria.map(c => c.id === id ? { ...c, ...patch } : c)
  };
  persist();
}

export function setScore(criterionId, optionId, value) {
  const scores = {
    ..._state.scores,
    [criterionId]: { ..._state.scores[criterionId], [optionId]: value }
  };
  _state = { ..._state, scores };
  persist();
}

export function applyTemplate(tpl) {
  const options = tpl.options.map(name => ({ id: uid(), name }));
  const criteria = tpl.criteria.map(c => ({
    id: uid(),
    name: c.name,
    weight: c.weight,
    inverted: c.inverted || false
  }));
  const scores = {};
  for (const c of criteria) {
    scores[c.id] = {};
    for (const o of options) scores[c.id][o.id] = null;
  }
  _state = { ..._state, template: tpl.id, options, criteria, scores };
  persist();
}

export function resetState() {
  _state = buildInitialState();
  persist();
}

export function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (parsed?.options?.length && parsed?.criteria?.length) {
      _state = parsed;
      return true;
    }
  } catch {
    // Corrupt data — silently ignore
  }
  return false;
}

export function encodeToURL() {
  try {
    const compressed = btoa(encodeURIComponent(JSON.stringify(_state)));
    const url = new URL(window.location.href);
    url.hash = '';
    url.searchParams.set('d', compressed);
    return url.toString();
  } catch {
    return null;
  }
}

export function decodeFromURL() {
  try {
    const encoded = new URLSearchParams(window.location.search).get('d');
    if (!encoded) return false;
    const parsed = JSON.parse(decodeURIComponent(atob(encoded)));
    if (parsed?.options?.length && parsed?.criteria?.length) {
      _state = parsed;
      persist();
      return true;
    }
  } catch {
    // Invalid URL data — silently ignore
  }
  return false;
}

let _persistTimer = null;

function persist() {
  clearTimeout(_persistTimer);
  _persistTimer = setTimeout(flushPersist, 250);
}

function flushPersist() {
  clearTimeout(_persistTimer);
  _persistTimer = null;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch {
    // Quota exceeded or private browsing — silent fail
  }
}

window.addEventListener('beforeunload', flushPersist);
