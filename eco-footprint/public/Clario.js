// =============================================
//  ECOSCOPE — PURE CALCULATION ENGINE
// =============================================

const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

// ══════════════════════════════════════
//  THEME SWITCHER
// ══════════════════════════════════════
const THEMES = ['dark', 'light', 'cb'];
const themeButtons = {
  dark:  $('themeDark'),
  light: $('themeLight'),
  cb:    $('themeCb'),
};

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem('ecoscope-theme', theme);
  Object.entries(themeButtons).forEach(([t, btn]) => {
    btn.classList.toggle('active', t === theme);
  });
  // Re-render results bars with new colours if results are visible
  if (!$('results').classList.contains('hidden')) {
    document.querySelectorAll('.cmp-fill, .bar-fill').forEach(b => {
      if (b.dataset.w) b.style.width = b.dataset.w;
    });
  }
}

// Load saved preference or default to dark
const savedTheme = localStorage.getItem('ecoscope-theme') || 'dark';
setTheme(savedTheme);

$('themeDark').onclick  = () => setTheme('dark');
$('themeLight').onclick = () => setTheme('light');
$('themeCb').onclick    = () => setTheme('cb');

// ── NAVIGATION ──
$('startBtn').onclick = () => { hide('landing'); show('progressWrap'); goStep(1); };
$('back1').onclick   = () => { hide('step1'); hide('progressWrap'); show('landing'); };
$('next1').onclick   = () => { if (validate('step1')) { hide('step1'); goStep(2); } };
$('back2').onclick   = () => { hide('step2'); goStep(1); };
$('next2').onclick   = () => { if (validate('step2')) { hide('step2'); goStep(3); } };
$('back3').onclick   = () => { hide('step3'); goStep(2); };
$('calcBtn').onclick = () => { if (validate('step3')) { hide('step3'); hide('progressWrap'); calculate(); } };
$('resetBtn').onclick = () => {
  hide('results');
  document.querySelectorAll('input[type=radio]').forEach(r => r.checked = false);
  show('progressWrap');
  goStep(1);
};

function goStep(n) {
  ['step1', 'step2', 'step3'].forEach(s => hide(s));
  show('step' + n);
  $('progFill').style.width = (n === 1 ? '16' : n === 2 ? '50' : '83') + '%';
  document.querySelectorAll('.step-dot').forEach(d => {
    const s = Number(d.dataset.s);
    d.classList.toggle('active', s === n);
    d.classList.toggle('done', s < n);
  });
}

// ── VALIDATION ──
function validate(sectionId) {
  const sec = $(sectionId);
  let ok = true;
  sec.querySelectorAll('.pills[data-name]').forEach(g => {
    if (!g.querySelector('input:checked')) {
      g.classList.add('error');
      setTimeout(() => g.classList.remove('error'), 800);
      ok = false;
    }
  });
  return ok;
}

// ── GET SELECTED VALUE ──
function v(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

// =============================================
//  CARBON CALCULATION ENGINE
//  All values in kg CO₂ equivalent per year
// =============================================
function calculate() {
  const d = {
    provider:   v('provider'),
    elecBill:   v('elecBill'),
    standby:    v('standby'),
    people:     v('people'),
    homeSize:   v('homeSize'),
    heating:    v('heating'),
    thermostat: v('thermostat'),
    insulation: v('insulation'),
    shower:     v('shower'),
    transport:  v('transport'),
    diet:       v('diet'),
    flights:    v('flights'),
    recycle:    v('recycle'),
    shopping:   v('shopping'),
  };

  // ── ELECTRICITY ──
  const billKg     = { vlow: 300, low: 600, med: 1200, high: 2200 }[d.elecBill] || 800;
  const providerM  = { grid: 1, green: 0.35, solar: 0.1 }[d.provider] || 1;
  const standbyM   = { always: 0.9, sometimes: 1, rarely: 1.12 }[d.standby] || 1;
  const homeM      = { sm: 0.8, md: 1, lg: 1.4 }[d.homeSize] || 1;
  const elecKg     = billKg * providerM * standbyM * homeM;

  // ── HEATING ──
  const heatBase   = { gas: 2200, oil: 2800, elec: 1800, pump: 900, none: 200 }[d.heating] || 1500;
  const thermM     = { cool: 0.75, comfy: 1, warm: 1.2, hot: 1.45 }[d.thermostat] || 1;
  const insulM     = { great: 0.7, good: 0.85, avg: 1, poor: 1.3 }[d.insulation] || 1;
  const sizeM      = { sm: 0.75, md: 1, lg: 1.45 }[d.homeSize] || 1;
  const heatingKg  = heatBase * thermM * insulM * sizeM;

  // ── WATER / SHOWERS ──
  const showerKg   = { short: 80, med: 180, long: 380, xlong: 600 }[d.shower] || 200;

  // ── TRANSPORT ──
  const transportKg = { walk: 50, transit: 600, ev: 700, hybrid: 1400, car: 2800 }[d.transport] || 1500;

  // ── DIET ──
  const dietKg     = { vegan: 1000, veggie: 1500, flex: 2000, omni: 2500, meat: 3300 }[d.diet] || 2000;

  // ── FLIGHTS ──
  const flightKg   = { never: 0, one: 500, few: 1800, lots: 4500 }[d.flights] || 0;

  // ── WASTE / RECYCLING ──
  const recycleKg  = { always: 100, mostly: 200, some: 350, never: 500 }[d.recycle] || 300;

  // ── SHOPPING / CONSUMPTION ──
  const shoppingKg = { min: 400, avg: 900, lots: 1600 }[d.shopping] || 800;

  const cats = [
    { name: 'Electricity', kg: Math.round(elecKg),     icon: '⚡' },
    { name: 'Heating',     kg: Math.round(heatingKg),  icon: '🔥' },
    { name: 'Transport',   kg: Math.round(transportKg),icon: '🚗' },
    { name: 'Diet',        kg: Math.round(dietKg),      icon: '🍽️' },
    { name: 'Flights',     kg: Math.round(flightKg),    icon: '✈️' },
    { name: 'Water',       kg: Math.round(showerKg),    icon: '💧' },
    { name: 'Shopping',    kg: Math.round(shoppingKg),  icon: '🛍️' },
    { name: 'Waste',       kg: Math.round(recycleKg),   icon: '♻️' },
  ];

  const totalKg = cats.reduce((s, c) => s + c.kg, 0);
  const totalT  = (totalKg / 1000).toFixed(1);

  // Score: 100 = near-zero, 0 = 20,000 kg+
  const score = Math.max(0, Math.min(100, Math.round(100 - (totalKg / 20000) * 100)));

  const grade =
    score >= 80 ? 'Excellent 🌟' :
    score >= 65 ? 'Good 🌿' :
    score >= 50 ? 'Average 🟡' :
    score >= 35 ? 'Below Average 🟠' :
    'High Impact 🔴';

  const summary =
    score >= 80 ? "Your footprint is well below the global average. You're a role model for sustainable living." :
    score >= 65 ? "You're doing better than most. A few targeted changes could make a big difference." :
    score >= 50 ? "You're around the global average. There's real room to improve with some lifestyle shifts." :
    score >= 35 ? "Your footprint is above average. Focusing on your top categories could have a big impact." :
    "Your footprint is significantly above average. The good news: high scores mean the most room to improve.";

  const tips = generateTips(d, cats);

  render({ score, grade, totalKg, totalT, summary, cats, tips });
}

// ── GENERATE PERSONALISED TIPS ──
function generateTips(d, cats) {
  const tips = [];

  if (d.transport === 'car') {
    tips.push({ p: 'high', title: 'Switch to an EV or hybrid', desc: 'Switching from a petrol car to an EV could cut your transport emissions by over 50%, saving roughly 1,400 kg CO₂/year.', save: '~1,400 kg CO₂/year' });
    tips.push({ p: 'medium', title: 'Try public transit twice a week', desc: 'Replacing two car commutes per week with bus or train can save 300–600 kg CO₂ annually.', save: '~400 kg CO₂/year' });
  } else if (d.transport === 'hybrid') {
    tips.push({ p: 'medium', title: 'Consider going fully electric', desc: 'Upgrading from a hybrid to an EV reduces emissions by a further 700 kg CO₂/year on average.', save: '~700 kg CO₂/year' });
  }

  if (d.diet === 'meat') {
    tips.push({ p: 'high', title: 'Try meat-free Mondays', desc: 'Cutting meat to 3–4 days a week reduces your diet footprint by ~1,300 kg CO₂/year.', save: '~1,300 kg CO₂/year' });
  } else if (d.diet === 'omni') {
    tips.push({ p: 'medium', title: 'Reduce red meat consumption', desc: 'Swapping beef and lamb for chicken or plant proteins 2x/week could save 500–800 kg CO₂/year.', save: '~600 kg CO₂/year' });
  }

  if (d.flights === 'lots') {
    tips.push({ p: 'high', title: 'Offset or reduce flights', desc: 'Frequent flying is one of the most carbon-intensive activities. Replacing one long-haul flight with rail or a video call saves ~1,800 kg CO₂.', save: '~1,800 kg CO₂/trip' });
  } else if (d.flights === 'few') {
    tips.push({ p: 'medium', title: 'Consider train travel', desc: 'For European distances, rail emits ~90% less CO₂ than flying. One replaced flight saves ~500–1,000 kg.', save: '~700 kg CO₂/trip' });
  }

  if (d.heating === 'gas' || d.heating === 'oil') {
    tips.push({ p: 'high', title: 'Upgrade to a heat pump', desc: 'Air-source heat pumps are 3× more efficient than gas boilers and run on electricity (which can be renewable).', save: '~1,500 kg CO₂/year' });
  }
  if (d.insulation === 'poor' || d.insulation === 'avg') {
    tips.push({ p: 'medium', title: 'Improve home insulation', desc: 'Loft and wall insulation cuts heating demand by 20–40%, saving 300–800 kg CO₂/year and reducing bills.', save: '~500 kg CO₂/year' });
  }
  if (d.thermostat === 'hot' || d.thermostat === 'warm') {
    tips.push({ p: 'low', title: 'Turn down the thermostat 1–2°C', desc: 'Each degree reduction saves roughly 200–300 kg CO₂/year and around 6–10% on heating bills.', save: '~250 kg CO₂/year' });
  }

  if (d.provider === 'grid') {
    tips.push({ p: 'high', title: 'Switch to a renewable energy tariff', desc: 'Moving to a green electricity supplier can cut your electricity emissions by up to 65% with zero lifestyle change.', save: '~400–800 kg CO₂/year' });
  }
  if (d.standby === 'rarely') {
    tips.push({ p: 'low', title: 'Eliminate standby power', desc: 'Devices on standby account for 5–10% of home electricity use. Smart plugs or switching off saves 60–150 kg CO₂/year.', save: '~100 kg CO₂/year' });
  }

  if (d.shopping === 'lots') {
    tips.push({ p: 'medium', title: 'Buy less, buy second-hand', desc: 'Fast fashion and frequent purchases carry hidden carbon costs. Halving new purchases saves ~600 kg CO₂/year.', save: '~600 kg CO₂/year' });
  }

  if (d.shower === 'long' || d.shower === 'xlong') {
    tips.push({ p: 'low', title: 'Shorten your shower by 3 minutes', desc: 'A 3-minute reduction saves ~50–100 litres of hot water per day, cutting emissions by ~100 kg/year.', save: '~100 kg CO₂/year' });
  }

  return tips.slice(0, 6);
}

// =============================================
//  RENDER RESULTS
// =============================================
function render({ score, grade, totalKg, totalT, summary, cats, tips }) {
  show('results');

  $('rScore').textContent = score;
  $('rGrade').textContent = grade;
  $('rCO2').textContent   = `~${totalT} tonnes CO₂e per year (${Math.round(totalKg).toLocaleString()} kg)`;
  $('rSummary').textContent = summary;

  // Theme-aware colours
  const theme = document.body.dataset.theme || 'dark';
  const palette = theme === 'cb'
    ? { good: '#4d9fff', warn: '#ffd700', bad: '#e07b00' }
    : theme === 'light'
    ? { good: '#2e8b2e', warn: '#d4870a', bad: '#c0392b' }
    : { good: '#5db85d', warn: '#ffc94d', bad: '#ff6b6b' };

  // Animate score ring
  const ring  = $('ringCircle');
  const circ  = 377;
  const col   = score >= 65 ? palette.good : score >= 45 ? palette.warn : palette.bad;
  ring.style.stroke = col;
  setTimeout(() => { ring.style.strokeDashoffset = circ - (score / 100) * circ; }, 80);

  // Comparison chart
  const comparisons = [
    { lbl: 'You',       kg: totalKg, col },
    { lbl: 'World Avg', kg: 4700,    col: palette.good },
    { lbl: 'EU Avg',    kg: 7200,    col: palette.warn },
    { lbl: 'US Avg',    kg: 14000,   col: palette.bad  },
  ];
  const maxKg = Math.max(...comparisons.map(c => c.kg)) * 1.05;
  $('compareBars').innerHTML = comparisons.map(c => `
    <div class="cmp-row">
      <div class="cmp-lbl">${c.lbl}</div>
      <div class="cmp-track">
        <div class="cmp-fill" style="width:0%;background:${c.col}" data-w="${(c.kg / maxKg * 100).toFixed(1)}%"></div>
      </div>
      <div class="cmp-val">${(c.kg / 1000).toFixed(1)}t</div>
    </div>`).join('');

  // Breakdown bars
  const maxCat = Math.max(...cats.map(c => c.kg));
  $('breakdownBars').innerHTML = cats.map(c => {
    const pct  = maxCat > 0 ? (c.kg / maxCat * 100).toFixed(1) : 0;
    const col2 = c.kg < 500 ? palette.good : c.kg < 1500 ? palette.warn : palette.bad;
    return `<div class="bar-row">
      <div class="bar-top"><strong>${c.icon} ${c.name}</strong><span>${Math.round(c.kg).toLocaleString()} kg</span></div>
      <div class="bar-track"><div class="bar-fill" style="background:${col2}" data-w="${pct}%"></div></div>
    </div>`;
  }).join('');

  // Tips
  $('tipsList').innerHTML = tips.map(t => `
    <div class="tip ${t.p}">
      <div class="tip-title">${t.title}</div>
      <div class="tip-desc">${t.desc}</div>
      ${t.save ? `<div class="tip-save">💚 ${t.save}</div>` : ''}
    </div>`).join('');

  // Animate all bars
  requestAnimationFrame(() => setTimeout(() => {
    document.querySelectorAll('.cmp-fill, .bar-fill').forEach(b => {
      b.style.width = b.dataset.w;
    });
  }, 150));
}
