const $ = id => document.getElementById(id);

function show(id) { $(id).classList.remove('hidden'); }
function hide(id) { $(id).classList.add('hidden'); }

function getFormData() {
  return {
    electricity: {
      providerType: $('provider').value,
      monthlyBill: Number($('elecBill').value),
      solarPanels: $('solar').value,
      standbyHabits: $('standby').value,
      householdSize: Number($('people').value),
      homeSize: Number($('homeSize').value),
    },
    heating: {
      heatingType: $('heatingType').value,
      thermostatCelsius: Number($('thermostat').value),
      insulation: $('insulation').value,
      showerMinutes: Number($('showerLen').value),
      bathsPerWeek: Number($('baths').value),
    },
    recycling: {
      recyclingHabit: $('recycling')?.value || 'none',
      composting: $('compost')?.value || 'none',
      electronicsFreq: $('electronics')?.value || 'none',
    }
  };
}

$('ecoForm').addEventListener('submit', async e => {
  e.preventDefault();
  hide('formSection');
  show('loading');

  try {
    const res = await fetch('/api/gemini', {
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
    alert('Error: ' + err.message);
    hide('loading');
    show('formSection');
  }
});

function render(data) {
  $('scoreNum').textContent = data.score || '?';
  $('scoreGrade').textContent = data.grade || 'N/A';
  $('summaryText').textContent = `Est. ~${data.estimatedKgCO2PerYear || '?'} kg CO₂/year. ${data.summary || ''}`;

  const bars = $('impactBars');
  bars.innerHTML = '';
  (data.breakdown || []).forEach(b => {
    const color = b.score >= 70 ? '#4ade80' : b.score >= 45 ? '#fbbf24' : '#f87171';
    bars.innerHTML += `
      <div>
        <strong>${b.area} (${b.score}/100)</strong>
        <div class="bar-track">
          <div class="bar-fill" style="width:${b.score}%;background:${color}"></div>
        </div>
        <small>${b.note}</small>
      </div>`;
  });

  const tips = $('tipsList');
  tips.innerHTML = '';
  (data.tips || []).forEach(t => {
    tips.innerHTML += `
      <div class="tip ${t.priority?.toLowerCase() || 'low'}">
        <strong>${t.title}</strong><br>
        ${t.description}<br>
        <em>${t.estimatedSaving || ''}</em>
      </div>`;
  });
}

$('resetBtn').addEventListener('click', () => {
  hide('results');
  show('formSection');
});
