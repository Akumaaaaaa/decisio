# Decisio

A browser-based decision-making tool that helps you think through complex choices by quantifying your priorities and visualizing tradeoffs.

No accounts. No servers. No dependencies. Just open the file and decide.

🔗 **[Live Demo](https://decisio-mal.vercel.app)** — replace with your actual Vercel URL once deployed.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Akumaaaaaa/decisio)

---

## Overview

Decisio is a 5-step wizard that guides you from a fuzzy question ("Should I take this job?") to a structured, data-driven answer — complete with weighted scoring, sensitivity analysis, and insight generation.

It runs entirely in the browser as a single HTML file with vanilla JS ES modules and zero third-party dependencies.

---

## Key Features

| Feature | Details |
|---|---|
| **5 built-in templates** | Job Offer, Buy vs Rent, City Move, Career Pivot, Education |
| **Weighted criteria** | 1–5 scale; weight each factor by importance |
| **Inverted scoring** | Toggle "lower is better" for criteria like cost or risk |
| **Scoring matrix** | Rate options 1–10 per criterion; live progress indicator |
| **Animated charts** | Pure SVG bar chart + radar chart — no canvas, no libraries |
| **Pros & Cons** | Auto-generated per option from relative scores |
| **Sensitivity analysis** | Identifies "pivotal" criteria that can flip the winner |
| **Decision insights** | Detects tight races, dominant criteria, incomplete matrices |
| **Share via URL** | Full state encoded into a shareable link |
| **Print / PDF export** | Native browser print dialog |
| **Dark mode** | Respects system preference; manually toggleable |
| **Auto-save** | State persisted to `localStorage` between sessions |
| **Accessible** | Full ARIA markup, keyboard navigation, screen-reader live regions |

---

## Screenshots

> Replace the placeholders below with actual screenshots.

| Step | Preview |
|---|---|
| Setup & Templates | `screenshots/step-1-setup.png` |
| Options | `screenshots/step-2-options.png` |
| Criteria & Weights | `screenshots/step-3-criteria.png` |
| Scoring Matrix | `screenshots/step-4-matrix.png` |
| Results & Charts | `screenshots/step-5-results.png` |

---

## Technologies

- **HTML5** — semantic structure, ARIA accessibility
- **CSS3** — custom properties, CSS Grid, Flexbox, `@media` queries, `@print` styles
- **JavaScript (ES Modules)** — no build step, no bundler, no framework
- **SVG** — hand-drawn bar and radar charts, animated with `requestAnimationFrame`
- **Web APIs** — `localStorage`, `URLSearchParams`, `Clipboard API`, `matchMedia`

---

## Installation

No installation required. The project is a static site.

```bash
# Clone
git clone https://github.com/Akumaaaaaa/decisio.git
cd decisio

# Open directly in a browser
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux
```

Or serve locally to avoid ES module CORS restrictions:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

Then visit `http://localhost:8080`.

---

## Usage

0. **Home** — Land on the intro screen and click **Start** to enter the wizard.
1. **Setup** — Enter a decision title and optionally pick a template.
2. **Options** — Add 2–5 choices you are comparing.
3. **Criteria** — Define what matters. Set a weight (1–5) per criterion. Toggle "Lower is better" for inverted scales (cost, risk, etc.).
4. **Score** — Rate each option on each criterion from 1 to 10.
5. **Results** — Review the winner, charts, breakdown table, pros/cons, sensitivity analysis, and insights.

Use **Share** to copy a URL that encodes the full state. Anyone with the link sees your results immediately.

---

## How the Scoring System Works

### 1. Effective score
For a standard criterion: `effective = raw`  
For an inverted criterion (lower is better): `effective = 11 − raw`

This maps a raw score of 1 → effective 10 and a raw score of 10 → effective 1.

### 2. Weighted score per criterion
```
weighted = effective × weight
```

### 3. Normalized total
```
normalizedPct = (sum of weighted scores / max possible) × 100
```

Where `max possible = 10 × sum of all weights`.

This produces a 0–100% score that is comparable across decisions with different numbers of criteria.

### 4. Sensitivity analysis
For each criterion, its weight is temporarily doubled (capped at 10). If the winner changes, the criterion is marked **Pivotal** — a signal to re-examine that weight carefully.

### 5. Insights
The engine automatically flags: tight races (gap ≤ 5 pts), clear leaders (gap > 20 pts), pivotal criteria, dominant criteria (>40% of total weight), and incomplete matrices.

---

## Project Structure

```
decisio/
├── index.html          # Full app markup and step templates
├── css/
│   └── styles.css      # All styles: layout, components, themes, print
└── js/
    ├── app.js          # Boot, step navigation, event binding
    ├── state.js        # Single source of truth + localStorage + URL codec
    ├── scoring.js      # Weighted scores, pros/cons, sensitivity, insights
    ├── ui.js           # DOM rendering helpers (matrix, criteria, results)
    ├── charts.js       # Pure SVG bar chart and radar chart
    └── templates.js    # Preset templates with criteria definitions
```

---

## Future Improvements

- [ ] Multiple saved decisions (decision history)
- [ ] Undo / redo for score changes
- [ ] CSV / JSON export of the full matrix
- [ ] Collaborative mode (real-time shared decisions)
- [ ] Custom weight scale (beyond 1–5)
- [ ] Mobile drag-to-reorder for options and criteria
- [ ] Keyboard shortcut to navigate steps

---

## License

MIT — free to use, modify, and distribute.
