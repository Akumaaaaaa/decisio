// templates.js — Preset decision templates with pre-populated criteria

export const TEMPLATES = {
  'job-offer': {
    id: 'job-offer',
    placeholder: 'e.g. Company A vs Company B',
    options: ['Option A', 'Option B'],
    criteria: [
      { name: 'Salary & Compensation', weight: 4, inverted: false },
      { name: 'Career Growth',         weight: 4, inverted: false },
      { name: 'Work-Life Balance',     weight: 3, inverted: false },
      { name: 'Company Culture',       weight: 3, inverted: false },
      { name: 'Location / Remote',     weight: 2, inverted: false },
      { name: 'Job Security',          weight: 3, inverted: false }
    ]
  },
  'buy-rent': {
    id: 'buy-rent',
    placeholder: 'e.g. Buy vs Rent',
    options: ['Buy', 'Rent'],
    criteria: [
      { name: 'Monthly Cost',       weight: 4, inverted: true  },
      { name: 'Long-term Value',    weight: 4, inverted: false },
      { name: 'Flexibility',        weight: 3, inverted: false },
      { name: 'Maintenance Burden', weight: 2, inverted: true  },
      { name: 'Location Quality',   weight: 3, inverted: false },
      { name: 'Financial Risk',     weight: 3, inverted: true  }
    ]
  },
  'city-move': {
    id: 'city-move',
    placeholder: 'e.g. City A vs City B',
    options: ['City A', 'City B'],
    criteria: [
      { name: 'Cost of Living',         weight: 4, inverted: true  },
      { name: 'Career Opportunities',   weight: 4, inverted: false },
      { name: 'Lifestyle & Culture',    weight: 3, inverted: false },
      { name: 'Proximity to Family',    weight: 3, inverted: false },
      { name: 'Safety',                 weight: 3, inverted: false },
      { name: 'Climate',                weight: 2, inverted: false }
    ]
  },
  'career-pivot': {
    id: 'career-pivot',
    placeholder: 'e.g. Stay vs Switch Careers',
    options: ['Current Path', 'New Path'],
    criteria: [
      { name: 'Income Stability',   weight: 4, inverted: false },
      { name: 'Passion Alignment',  weight: 4, inverted: false },
      { name: 'Growth Potential',   weight: 3, inverted: false },
      { name: 'Risk Level',         weight: 3, inverted: true  },
      { name: 'Work-Life Balance',  weight: 3, inverted: false },
      { name: 'Skill Match',        weight: 2, inverted: false }
    ]
  },
  'education': {
    id: 'education',
    placeholder: 'e.g. Program A vs Program B',
    options: ['Option A', 'Option B'],
    criteria: [
      { name: 'Tuition Cost',           weight: 4, inverted: true  },
      { name: 'Career ROI',             weight: 4, inverted: false },
      { name: 'Time Commitment',        weight: 3, inverted: true  },
      { name: 'Program Reputation',     weight: 3, inverted: false },
      { name: 'Flexibility / Online',   weight: 2, inverted: false },
      { name: 'Career Opportunities',   weight: 3, inverted: false }
    ]
  },
  'custom': {
    id: 'custom',
    placeholder: 'e.g. Option A vs Option B',
    options: ['Option A', 'Option B'],
    criteria: [
      { name: '', weight: 3, inverted: false },
      { name: '', weight: 3, inverted: false },
      { name: '', weight: 3, inverted: false }
    ]
  }
};
