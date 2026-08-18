/**
 * views/weight.js — شاشة متابعة الوزن، متصلة بالكامل بـ /api/weight-logs.
 * لا توجد بيانات محلية — القائمة المنسدلة والسجل والرسم البياني كلها
 * نتيجة استدعاءات API مباشرة.
 */

async function initWeightView() {
  const select = document.getElementById('weight-member-select');
  select.innerHTML = `<option>جارِ التحميل...</option>`;
  try {
    // حد أقصى ١٠٠ عضو في القائمة المنسدلة (سقف الترقيم في الخادم) — كافٍ
    // لحجم جيم واحد عملياً؛ قائمة بحث حية بديلة يمكن إضافتها لاحقاً لو لزم.
    const { data: members } = await window.MembersAPI.list({ limit: 100, status: 'all' });
    select.innerHTML = members.map((m) => `<option value="${m.id}">${m.fullName}</option>`).join('');
    if (members.length) renderWeightView();
    else document.getElementById('weight-empty').classList.remove('hidden');
  } catch (err) {
    showApiError(err);
  }
}

async function renderWeightView() {
  const memberId = document.getElementById('weight-member-select').value;
  if (!memberId) return;

  document.getElementById('weight-goal-card').innerHTML = `<div class="skeleton-row"></div>`;
  document.getElementById('weight-chart').innerHTML = '';
  document.getElementById('weight-log-tbody').innerHTML = `<tr><td colspan="4" class="px-6 py-6"><div class="skeleton-row"></div></td></tr>`;

  try {
    const { data } = await window.WeightLogsAPI.listByMember(memberId);
    const { member, logs } = data;
    const goal = member.goalWeightKg ? Number(member.goalWeightKg) : null;
    const start = member.startWeightKg ? Number(member.startWeightKg) : (logs[0] ? Number(logs[0].weightKg) : null);
    const current = logs.length ? Number(logs[logs.length - 1].weightKg) : start;

    renderGoalCard(member, start, current, goal);
    document.getElementById('weight-chart').innerHTML = buildWeightChartSvg(logs, goal);
    renderLogTable(logs, goal);
    lucide.createIcons();
  } catch (err) {
    showApiError(err);
  }
}

function renderGoalCard(member, start, current, goal) {
  const pct = start != null && goal != null && start !== goal
    ? Math.max(0, Math.min(100, Math.round((Math.abs(start - current) / Math.abs(start - goal)) * 100)))
    : null;

  document.getElementById('weight-goal-card').innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-full bg-surface2 border border-border flex items-center justify-center text-sm font-mono font-bold">${member.fullName[0]}</div>
      <div><p class="font-semibold text-sm">${member.fullName}</p></div>
    </div>
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="bg-surface2 rounded-lg p-2.5"><p class="text-[10px] text-ink-500">الوزن الأولي</p><p class="font-mono font-bold text-sm ltr-num">${start ?? '—'}</p></div>
      <div class="bg-surface2 rounded-lg p-2.5"><p class="text-[10px] text-ink-500">الحالي</p><p class="font-mono font-bold text-sm text-accent-green ltr-num">${current ?? '—'}</p></div>
      <div class="bg-surface2 rounded-lg p-2.5"><p class="text-[10px] text-ink-500">المستهدف</p><p class="font-mono font-bold text-sm ltr-num">${goal ?? '—'}</p></div>
    </div>
    ${pct !== null ? `
      <div>
        <div class="h-2 w-full rounded-full bg-surface2 overflow-hidden border border-border">
          <div class="h-full rounded-full bg-gradient-to-l from-accent-green to-emerald-300 transition-all duration-700" style="width:${pct}%"></div>
        </div>
        <p class="text-[11px] text-ink-700 mt-1.5 ltr-num">${pct}% من الطريق نحو الهدف</p>
      </div>` : `<p class="text-[11px] text-ink-700">لا يوجد وزن مستهدف مسجَّل لهذا العضو بعد.</p>`}
  `;
}

function buildWeightChartSvg(logs, goal) {
  if (!logs.length) return `<p class="text-xs text-ink-700">لا توجد قياسات مسجَّلة بعد لهذا العضو.</p>`;
  const W = 640, H = 200, pad = 30;
  const weights = logs.map((l) => Number(l.weightKg));
  const allValues = goal ? [...weights, goal] : weights;
  const min = Math.min(...allValues) - 2;
  const max = Math.max(...allValues) + 2;
  const xStep = (W - pad * 2) / (logs.length - 1 || 1);
  const yFor = (v) => H - pad - ((v - min) / (max - min)) * (H - pad * 2);

  const points = logs.map((l, i) => `${pad + i * xStep},${yFor(Number(l.weightKg))}`).join(' ');
  const dots = logs.map((l, i) => `<circle cx="${pad + i * xStep}" cy="${yFor(Number(l.weightKg))}" r="4" fill="#10b981" stroke="#09090f" stroke-width="2"/>`).join('');
  const labels = logs.map((l, i) => `<text x="${pad + i * xStep}" y="${H - 6}" font-size="9" fill="#63636f" text-anchor="middle" font-family="Cairo">${formatDateAr(l.recordedAt)}</text>`).join('');
  const goalLine = goal ? `
    <line x1="${pad}" y1="${yFor(goal)}" x2="${W - pad}" y2="${yFor(goal)}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.6"/>
    <text x="${W - pad}" y="${yFor(goal) - 6}" font-size="10" fill="#f59e0b" text-anchor="end" font-family="Cairo">الهدف: ${goal} كجم</text>` : '';

  return `
    <svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" style="direction:ltr">
      ${goalLine}
      <polyline points="${points}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      ${labels}
    </svg>`;
}

function renderLogTable(logs, goal) {
  const tbody = document.getElementById('weight-log-tbody');
  tbody.innerHTML = [...logs].reverse().map((log, i, arr) => {
    const w = Number(log.weightKg);
    const diff = goal != null ? (w - goal).toFixed(1) : null;
    const prev = arr[i + 1] ? Number(arr[i + 1].weightKg) : w;
    const trendDown = w <= prev;
    return `
      <tr class="border-b border-border/60 hover:bg-white/[0.025] transition-colors">
        <td class="px-6 py-3 font-semibold font-mono ltr-num">${formatDateAr(log.recordedAt)}</td>
        <td class="px-4 py-3 font-mono ltr-num">${w} كجم</td>
        <td class="px-4 py-3 font-mono ltr-num ${diff === null ? 'text-ink-500' : diff > 0 ? 'text-accent-amber' : 'text-accent-green'}">${diff === null ? '—' : (diff > 0 ? '+' : '') + diff + ' كجم'}</td>
        <td class="px-4 py-3"><span class="inline-flex items-center gap-1 text-xs font-semibold ${trendDown ? 'text-accent-green' : 'text-accent-red'}"><i data-lucide="${trendDown ? 'trending-down' : 'trending-up'}" class="w-3.5 h-3.5"></i> ${trendDown ? 'تحسن' : 'ارتفاع'}</span></td>
      </tr>`;
  }).join('') || `<tr><td colspan="4" class="px-6 py-8 text-center text-ink-700 text-sm">لا توجد قياسات بعد</td></tr>`;
}

function openWeightModal() {
  document.getElementById('wf-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('weight-modal').classList.remove('hidden');
  document.getElementById('weight-modal').classList.add('flex');
}
function closeWeightModal() {
  document.getElementById('weight-modal').classList.add('hidden');
  document.getElementById('weight-modal').classList.remove('flex');
}
async function submitWeightForm(e) {
  e.preventDefault();
  const memberId = document.getElementById('weight-member-select').value;
  const weightKg = document.getElementById('wf-weight').value;
  const recordedAt = new Date(document.getElementById('wf-date').value).toISOString();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    await window.WeightLogsAPI.create({ memberId, weightKg, recordedAt });
    closeWeightModal();
    document.getElementById('wf-weight').value = '';
    showToast('تم تسجيل القياس بنجاح', `${weightKg} كجم`, 'scale');
    renderWeightView();
  } catch (err) {
    showApiError(err);
  } finally {
    submitBtn.disabled = false;
  }
}
