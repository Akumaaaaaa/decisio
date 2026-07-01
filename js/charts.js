// charts.js — Pure SVG chart rendering (no dependencies)

export const OPTION_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6'  // violet
];

export function getOptionColor(index) {
  return OPTION_COLORS[index % OPTION_COLORS.length];
}

// ── Bar Chart ─────────────────────────────────────

export function renderBarChart(containerId, options, scores) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const BAR_H    = 36;
  const BAR_GAP  = 20;
  const PAD_L    = 150;
  const PAD_R    = 70;
  const PAD_T    = 20;
  const PAD_B    = 28;
  const W        = Math.max(container.clientWidth || 560, 320);
  const chartW   = W - PAD_L - PAD_R;
  const H        = PAD_T + options.length * (BAR_H + BAR_GAP) - BAR_GAP + PAD_B;

  let svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;

  // Grid lines and % labels
  for (let i = 0; i <= 4; i++) {
    const x   = PAD_L + (chartW / 4) * i;
    const pct = i * 25;
    svg += `
      <line x1="${x}" y1="${PAD_T - 6}" x2="${x}" y2="${H - PAD_B}"
            stroke="currentColor" stroke-opacity="0.1" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="${x}" y="${H - 8}" text-anchor="middle" font-size="10"
            fill="currentColor" opacity="0.45" font-family="inherit">${pct}%</text>`;
  }

  options.forEach((opt, i) => {
    const pct   = scores[opt.id]?.normalizedPct ?? 0;
    const bw    = Math.max((pct / 100) * chartW, 0);
    const y     = PAD_T + i * (BAR_H + BAR_GAP);
    const color = OPTION_COLORS[i % OPTION_COLORS.length];
    const label = truncate(opt.name || `Option ${i + 1}`, 18);

    // Option name label
    svg += `
      <text x="${PAD_L - 10}" y="${y + BAR_H / 2 + 4}" text-anchor="end"
            font-size="13" font-weight="600" fill="currentColor"
            font-family="inherit">${esc(label)}</text>`;

    // Background track
    svg += `
      <rect x="${PAD_L}" y="${y}" width="${chartW}" height="${BAR_H}"
            rx="6" fill="currentColor" opacity="0.06"/>`;

    // Filled bar — initial width:0 set via style so CSS transition can animate it
    svg += `
      <rect class="ds-bar" data-final="${bw.toFixed(1)}"
            x="${PAD_L}" y="${y}" style="width:0px" height="${BAR_H}"
            rx="6" fill="${color}" opacity="0.88"/>`;

    // Percentage label — starts invisible at its final x position
    svg += `
      <text class="ds-bar-label"
            x="${(PAD_L + bw + 8).toFixed(1)}" y="${y + BAR_H / 2 + 4}"
            font-size="13" font-weight="700" fill="${color}"
            font-family="inherit" style="opacity:0">${pct}%</text>`;
  });

  svg += '</svg>';
  container.innerHTML = svg;

  // Animate bars: set transition then update style.width (CSS property, not attribute)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      container.querySelectorAll('.ds-bar').forEach((rect, i) => {
        const finalW = parseFloat(rect.dataset.final);
        rect.style.transition = `width 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 0.08}s`;
        rect.style.width = `${finalW}px`;
      });

      // Fade in labels after bars have grown
      container.querySelectorAll('.ds-bar-label').forEach((text, i) => {
        text.style.transition = `opacity 0.3s ease ${0.42 + i * 0.08}s`;
        requestAnimationFrame(() => { text.style.opacity = '1'; });
      });
    });
  });
}

// ── Radar Chart ───────────────────────────────────

export function renderRadarChart(containerId, options, criteria, scores) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const n = criteria.length;
  if (n < 3) {
    container.innerHTML = `
      <p style="color:var(--color-text-muted);font-size:.875rem;text-align:center;padding:40px 20px">
        Add at least 3 criteria to display the radar chart.
      </p>`;
    return;
  }

  const SIZE    = Math.min(container.clientWidth || 380, 380);
  const CX      = SIZE / 2;
  const CY      = SIZE / 2;
  const R       = SIZE * 0.36;
  const LABEL_R = R + 18;
  const RINGS   = 5;
  const startA  = -Math.PI / 2;
  const stepA   = (Math.PI * 2) / n;

  const axisPoint = (idx, r) => ({
    x: CX + Math.cos(startA + stepA * idx) * r,
    y: CY + Math.sin(startA + stepA * idx) * r
  });

  const dataPoint = (val, idx) => {
    const r = (Math.max(0, Math.min(10, val)) / 10) * R;
    return { x: CX + Math.cos(startA + stepA * idx) * r, y: CY + Math.sin(startA + stepA * idx) * r };
  };

  let svg = `<svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">`;

  // Grid rings
  for (let ring = 1; ring <= RINGS; ring++) {
    const pts = Array.from({ length: n }, (_, i) => {
      const p = axisPoint(i, R * (ring / RINGS));
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ');
    const opacity = ring === RINGS ? '0.2' : '0.1';
    svg += `<polygon points="${pts}" fill="none" stroke="currentColor" stroke-opacity="${opacity}" stroke-width="${ring === RINGS ? 1.5 : 1}"/>`;
  }

  // Axis spokes
  for (let i = 0; i < n; i++) {
    const p = axisPoint(i, R);
    svg += `<line x1="${CX}" y1="${CY}" x2="${p.x.toFixed(2)}" y2="${p.y.toFixed(2)}"
                  stroke="currentColor" stroke-opacity="0.12" stroke-width="1"/>`;
  }

  // Center dot
  svg += `<circle cx="${CX}" cy="${CY}" r="3" fill="currentColor" opacity="0.15"/>`;

  // Data polygons (back to front: draw fills first, then strokes)
  options.forEach((opt, oi) => {
    const color = OPTION_COLORS[oi % OPTION_COLORS.length];
    const pts = criteria.map((crit, ci) => {
      const eff = scores[opt.id]?.perCriterion[crit.id]?.effective ?? 0;
      const p = dataPoint(eff, ci);
      return `${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(' ');

    svg += `<polygon points="${pts}" fill="${color}" fill-opacity="0.1"
                     stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-opacity="0.85"/>`;

    // Vertex dots
    criteria.forEach((crit, ci) => {
      const eff = scores[opt.id]?.perCriterion[crit.id]?.effective ?? 0;
      const p = dataPoint(eff, ci);
      svg += `<circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="3.5"
                      fill="${color}" stroke="var(--color-surface)" stroke-width="1.5"/>`;
    });
  });

  // Axis labels
  criteria.forEach((crit, i) => {
    const p   = axisPoint(i, LABEL_R);
    const raw = crit.name || `C${i + 1}`;
    const lbl = truncate(raw, 13);

    let anchor = 'middle';
    if (p.x < CX - 12) anchor = 'end';
    else if (p.x > CX + 12) anchor = 'start';

    const dy = p.y < CY - 5 ? '-0.3em' : p.y > CY + 5 ? '1em' : '0.35em';

    svg += `
      <text x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}"
            text-anchor="${anchor}" dy="${dy}"
            font-size="11" font-weight="600" fill="currentColor" opacity="0.7"
            font-family="inherit">${esc(lbl)}</text>`;
  });

  svg += '</svg>';
  container.innerHTML = svg;
}

// ── Chart Legend ──────────────────────────────────

export function renderChartLegend(containerId, options) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = options.map((opt, i) => {
    const color = OPTION_COLORS[i % OPTION_COLORS.length];
    return `
      <span class="chart-legend-item">
        <span class="chart-legend-dot" style="background:${color}"></span>
        ${esc(opt.name || `Option ${i + 1}`)}
      </span>`;
  }).join('');
}

// ── Helpers ───────────────────────────────────────

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
