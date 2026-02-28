// ===========================
//   ECO SCOPE — MAIN JS
// ===========================

const $ = id => document.getElementById(id);
const show = id => $(id).classList.remove('hidden');
const hide = id => $(id).classList.add('hidden');

let currentStep = 0;

// ---- Navigation ----
$('startBtn').addEventListener('click', () => {
  hide('landing');
  show('progressWrap');
  goStep(1);
});

$('back1').addEventListener('click', () => {
  hide('step1');
  hide('progressWrap');
  show('landing');
  currentStep = 0;
});

$('next1').addEventListener('click', () => {
  if (!validateStep('step1')) return;
  hide('step1');
  goStep(2);
});

$('back2').addEventListener('click', () => {
  hide('step2');
  goStep(1);
});

$('next2').addEventListener('click', () => {
  if (!validateStep('step2')) return;
  hide('step2');
  goStep(3);
});

$('back3').addEventListener('click', () => {
  hide('step3');
  goStep(2);
});

$('submitBtn').addEventListener('click', async () => {
  if (!validateStep('step3')) return;
  hide('step3');
  hide('progressWrap');
  show('loading');
  await submit();
});

$('resetBtn').addEventListener('click', () => {
  hide('results');
  // Clear all radio selections
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  show('progressWrap');
  goStep(1);
});

// ---- Step management ----
function goStep(n) {
  currentStep = n;
  show('step' + n);
  updateProgress(n);
  // Update step indicators
  document.querySelectorAll('.step').forEach(el => {
    el.classList.toggle('active', Number(el.dataset.step) === n);
  });
}

function updateProgress(n) {
  const pct = ((n - 1) / 3) * 100 + 16;
  $('progressFill').style.width = pct + '%';
}

// ---- Validation ----
function validateStep(sectionId) {
  const section = $(sectionId);
  const groups = section.querySelectorAll('.pill-group');
  let valid = true;
  groups.forEach(g => {
    const name = g.querySelector('input[type="radio"]')?.name;
    if (name && !document.querySelector(`input[name="${name}"]:checked`)) {
      g.style.animation = 'shake 0.4s ease';
      setTimeout(() => g.style.animation = '', 400);
      valid = false;
    }
  });
  if (!valid) {
    // Add shake keyframe dynamically if not present
    if (!document.querySelector('#shakeStyle')) {
      const style = document.createElement('style');
      style.id = 'shakeStyle';
      style.textContent = `@keyframes shake {
        0%,100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }`;
      document.head.appendChild(style);
    }
  }
  return valid;
}

// ---- Collect form data ----
function getVal(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || null;
}

function getFormData() {
  return {
    electricity: {
      providerType: getVal('provider'),
      monthlyBill: getVal('elecBill'),
      solarPanels: getVal('solar'),
      standbyHabits: getVal('standby'),
      householdSize: getVal('people'),
      homeSize: getVal('homeSize'),
    },
    heating: {
      heatingType: getVal('heatingType'),
      thermostatSetting: getVal('thermostat'),
      insulation: getVal('insulation'),
      showerLength: getVal('showerLen'),
      bathFrequency: getVal('baths'),
    },
    lifestyle: {
      recyclingHabit: getVal('recycling'),
      composting: getVal('compost'),
      electronicsFreq: getVal('electronics'),
      diet: getVal('diet'),
      transport: getVal('transport'),
    }
  };
}

// ---- Submit to API ----
async function submit() {
  try {
    const res = await fetch('/api/gemini.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getFormData())
    });
    const data = await res.json();
    hide('loading');
    show('results');
    render(data);
  } catch (err) {
    console.error(err);
    alert('Something went wrong: ' + err.message);
    hide('loading');
    show('progressWrap');
    goStep(3);
  }
}

// ---- Render results ----
function render(data) {
  const score = data.score || 0;
  $('scoreNum').textContent = score;
  $('scoreGrade').textContent = data.grade || 'N/A';
  $('summaryText').textContent = `Est. ~${data.estimatedKgCO2PerYear?.toLocaleString() || '?'} kg CO₂/year. ${data.summary || ''}`;

  // Animate score ring
  const circle = $('scoreCircle');
  const circumference = 327;
  const offset = circumference - (score / 100) * circumference;
  const ringColor = score >= 70 ? '#4ab44a' : score >= 45 ? '#fbbf24' : '#f87171';
  circle.style.stroke = ringColor;
  setTimeout(() => { circle.style.strokeDashoffset = offset; }, 100);

  // Breakdown bars
  const bars = $('impactBars');
  bars.innerHTML = '';
  (data.breakdown || []).forEach(b => {
    const color = b.score >= 70 ? '#4ab44a' : b.score >= 45 ? '#fbbf24' : '#f87171';
    const div = document.createElement('div');
    div.className = 'bar-item';
    div.innerHTML = `
      <div class="bar-meta">
        <strong>${b.area}</strong>
        <span>${b.score}/100</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;background:${color}" data-w="${b.score}%"></div>
      </div>
      <div class="bar-note">${b.note}</div>`;
    bars.appendChild(div);
  });
  // Animate bars
  setTimeout(() => {
    bars.querySelectorAll('.bar-fill').forEach(b => {
      b.style.width = b.dataset.w;
    });
  }, 200);

  // Tips
  const tips = $('tipsList');
  tips.innerHTML = '';
  (data.tips || []).forEach(t => {
    const priority = (t.priority || 'low').toLowerCase();
    const div = document.createElement('div');
    div.className = `tip-item ${priority}`;
    div.innerHTML = `
      <div class="tip-title">${t.title}</div>
      <div class="tip-desc">${t.description}</div>
      ${t.estimatedSaving ? `<div class="tip-saving">💚 ${t.estimatedSaving}</div>` : ''}`;
    tips.appendChild(div);
  });
}

