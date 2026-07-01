// scoring.js — All scoring math: weighted scores, normalization, sensitivity, insights

function effectiveScore(raw, inverted) {
  if (raw === null || raw === undefined) return null;
  return inverted ? 11 - raw : raw;
}

export function calculateScores(state) {
  const { options, criteria, scores } = state;
  const result = {};

  for (const opt of options) {
    let weightedTotal = 0;
    let maxPossible = 0;
    let filledCount = 0;
    const perCriterion = {};

    for (const crit of criteria) {
      const raw = scores[crit.id]?.[opt.id] ?? null;
      const eff = effectiveScore(raw, crit.inverted);
      const weighted = eff !== null ? eff * crit.weight : null;

      perCriterion[crit.id] = { raw, effective: eff, weighted };

      if (weighted !== null) {
        weightedTotal += weighted;
        filledCount++;
      }
      maxPossible += 10 * crit.weight;
    }

    result[opt.id] = {
      weightedTotal,
      maxPossible,
      normalizedPct: maxPossible > 0 ? Math.round((weightedTotal / maxPossible) * 100) : 0,
      isComplete: filledCount === criteria.length,
      filledCount,
      perCriterion
    };
  }

  return result;
}

export function getWinner(state, scores) {
  const { options } = state;
  if (!options.length) return null;
  return options.reduce((best, opt) =>
    (scores[opt.id]?.normalizedPct ?? 0) > (scores[best.id]?.normalizedPct ?? 0) ? opt : best
  );
}

export function generateProscons(state, scores) {
  const { options, criteria } = state;
  const result = {};

  for (const opt of options) {
    const pros = [];
    const cons = [];

    for (const crit of criteria) {
      const optEff = scores[opt.id]?.perCriterion[crit.id]?.effective;
      if (optEff === null || optEff === undefined) continue;

      // Average effective score across all options for this criterion
      let sum = 0, count = 0;
      for (const o of options) {
        const s = scores[o.id]?.perCriterion[crit.id]?.effective;
        if (s !== null && s !== undefined) { sum += s; count++; }
      }
      const avg = count > 0 ? sum / count : 5;
      const label = crit.name || 'Unnamed criterion';

      if (optEff >= avg + 2) pros.push(label);
      else if (optEff <= avg - 2) cons.push(label);
    }

    result[opt.id] = { pros, cons };
  }

  return result;
}

export function runSensitivityAnalysis(state, scores) {
  const { criteria } = state;
  const currentWinner = getWinner(state, scores);
  if (!currentWinner) return [];

  const winnerWithWeight = (crit, weight) => {
    const modState = {
      ...state,
      criteria: state.criteria.map(c => c.id === crit.id ? { ...c, weight } : c)
    };
    return getWinner(modState, calculateScores(modState));
  };

  return criteria.map(crit => {
    const increasedWinner = winnerWithWeight(crit, Math.min(crit.weight * 2, 10));
    const decreasedWinner = winnerWithWeight(crit, Math.max(crit.weight / 2, 0.1));

    const increasedFlips = !!(increasedWinner && increasedWinner.id !== currentWinner.id);
    const decreasedFlips = !!(decreasedWinner && decreasedWinner.id !== currentWinner.id);
    const isPivotal = increasedFlips || decreasedFlips;

    const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
    const impact = totalWeight > 0 ? crit.weight / totalWeight : 0;

    return {
      criterionId: crit.id,
      criterionName: crit.name || 'Unnamed',
      isPivotal,
      impact,
      newWinner: increasedFlips ? increasedWinner : (decreasedFlips ? decreasedWinner : null)
    };
  });
}

export function generateInsights(state, scores, sensitivity) {
  const { options, criteria } = state;
  const insights = [];

  if (options.length < 2) return insights;

  const winner = getWinner(state, scores);
  const pcts = options.map(o => scores[o.id]?.normalizedPct ?? 0);
  const sorted = [...pcts].sort((a, b) => b - a);
  const gap = sorted[0] - (sorted[1] ?? 0);

  // Only analyse race dynamics when there is actual scored data
  const totalFilled = options.reduce((n, o) => n + (scores[o.id]?.filledCount ?? 0), 0);
  const hasData = totalFilled > 0;

  // Exact tie
  if (hasData && gap === 0) {
    insights.push({
      type: 'warning',
      text: "It's an exact tie between your top options. Try adjusting weights or adding another criterion to break the deadlock."
    });
  } else if (hasData && gap <= 5) {
    // Tight race
    insights.push({
      type: 'warning',
      text: 'Your scores are very close. Try adjusting your criteria weights — you may not have a strong preference yet.'
    });
  }

  // Clear leader
  if (hasData && gap > 20 && winner) {
    insights.push({
      type: 'success',
      text: `<strong>${esc(winner.name)}</strong> leads by ${gap} points. Your weights and scores are well-aligned with this choice.`
    });
  }

  // Pivotal criteria
  const pivotal = sensitivity.filter(s => s.isPivotal);
  if (pivotal.length > 0) {
    const names = pivotal.map(p => `<strong>${esc(p.criterionName)}</strong>`).join(', ');
    insights.push({
      type: 'warning',
      text: `${names} ${pivotal.length === 1 ? 'is a pivotal criterion' : 'are pivotal criteria'} — changing ${pivotal.length === 1 ? 'its' : 'their'} weight would change the leading option. Worth double-checking ${pivotal.length === 1 ? 'its' : 'their'} importance.`
    });
  }

  // Dominant criterion
  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  for (const crit of criteria) {
    if (totalWeight > 0 && crit.weight / totalWeight > 0.4) {
      insights.push({
        type: 'info',
        text: `<strong>${esc(crit.name || 'One criterion')}</strong> accounts for over 40% of your total weight. Make sure that priority genuinely reflects what matters most to you.`
      });
      break;
    }
  }

  // Missing scores
  const anyIncomplete = options.some(o => !scores[o.id]?.isComplete);
  if (anyIncomplete) {
    insights.push({
      type: 'info',
      text: 'Some scores are missing. Results are based on filled scores only — complete the matrix for the most accurate comparison.'
    });
  }

  return insights;
}

export function countFilledScores(state) {
  const { options, criteria, scores } = state;
  let filled = 0;
  const total = options.length * criteria.length;
  for (const c of criteria) {
    for (const o of options) {
      const v = scores[c.id]?.[o.id];
      if (v !== null && v !== undefined) filled++;
    }
  }
  return { filled, total };
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
