/**
 * views/vip.js — قسم الـ VIP، متصل بالكامل بـ /api/workout-plans،
 * /api/diet-plans، و/api/weight-logs. لا توجد أي خطط أو بيانات ثابتة هنا.
 */
let cachedCoaches = [];
let currentVipMemberId = null;
let workoutRowCount = 0;
let dietRowCount = 0;

async function initVipView() {
  const sel = document.getElementById('vip-member-select');
  try {
    const { data: members } = await window.MembersAPI.list({ limit: 100, status: 'all' });
    const vipMembers = members.filter((m) => m.isVip);

    document.getElementById('vip-empty').classList.toggle('hidden', vipMembers.length > 0);
    document.getElementById('vip-content').classList.toggle('hidden', vipMembers.length === 0);
    if (!vipMembers.length) return;

    sel.innerHTML = vipMembers.map((m) => `<option value="${m.id}">${m.fullName}</option>`).join('');
    renderVipView();
  } catch (err) {
    showApiError(err);
  }
}

async function renderVipView() {
  const memberId = document.getElementById('vip-member-select').value;
  if (!memberId) return;
  currentVipMemberId = memberId;

  try {
    const [{ data: member }, { data: workoutPlan }, { data: dietPlan }, { data: weightData }] = await Promise.all([
      window.MembersAPI.getById(memberId),
      window.WorkoutPlansAPI.current(memberId),
      window.DietPlansAPI.current(memberId),
      window.WeightLogsAPI.listByMember(memberId),
    ]);

    renderVipProfileCard(member);
    renderWorkoutTable(workoutPlan);
    renderDietPlanCard(dietPlan);
    renderVipWeeklyLog(weightData.logs);
    lucide.createIcons();
  } catch (err) {
    showApiError(err);
  }
}

function renderVipProfileCard(m) {
  document.getElementById('vip-profile-card').innerHTML = `
    <div class="flex items-start gap-5 flex-wrap">
      <div class="pulse-ring rounded-full" style="--pulse-color:#f59e0b">
        <div class="w-16 h-16 rounded-full bg-surface2 border border-accent-amber/40 flex items-center justify-center text-lg font-mono font-bold relative z-10">${m.fullName[0]}</div>
      </div>
      <div class="flex-1 min-w-[200px]">
        <p class="font-extrabold text-lg flex items-center gap-2">${m.fullName} <i data-lucide="badge-check" class="w-4 h-4 text-accent-amber"></i></p>
        <p class="text-xs font-mono text-ink-500 mt-0.5 ltr-num">${m.phone}</p>
        <p class="text-xs text-accent-amber font-semibold mt-2">${m.currentSubscription?.typeName || '—'}</p>
      </div>
      <div class="flex gap-6 text-center">
        <div><p class="text-[11px] text-ink-500">ينتهي في</p><p class="font-mono font-bold ltr-num">${formatDateAr(m.currentSubscription?.endDate)}</p></div>
      </div>
    </div>`;
}

function renderWorkoutTable(plan) {
  const container = document.getElementById('vip-workout-table');
  if (!plan) {
    container.innerHTML = `<p class="text-xs text-ink-700 text-center py-8">لا توجد خطة تمرين مسجَّلة لهذا العضو بعد.</p>`;
    return;
  }
  container.innerHTML = plan.days.map((w) => `
    <div class="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
      <span class="text-xs font-bold w-16 shrink-0 text-accent-amber">${w.dayLabel}</span>
      <div class="min-w-0">
        <p class="text-sm font-semibold">${w.focus}</p>
        ${w.notes ? `<p class="text-[11px] text-ink-500 truncate">${w.notes}</p>` : ''}
      </div>
    </div>`).join('');
}

function renderDietPlanCard(plan) {
  const container = document.getElementById('vip-diet-plan');
  if (!plan) {
    container.innerHTML = `<p class="text-xs text-ink-700 text-center py-8">لا يوجد نظام غذائي مسجَّل لهذا العضو بعد.</p>`;
    return;
  }
  container.innerHTML = plan.meals.map((d) => `
    <div class="flex gap-3">
      <div class="w-1.5 rounded-full bg-accent-green/50 shrink-0"></div>
      <div>
        <p class="text-sm font-bold text-accent-green">${d.mealName}</p>
        <p class="text-xs text-ink-300 mt-0.5 leading-relaxed">${d.items}</p>
      </div>
    </div>`).join('');
}

function renderVipWeeklyLog(logs) {
  const recent = logs.slice(-4);
  document.getElementById('vip-weekly-log').innerHTML = recent.map((log) => `
    <div class="bg-surface2 border border-border rounded-xl p-4 text-center">
      <p class="text-[11px] text-ink-500 font-mono ltr-num">${formatDateAr(log.recordedAt)}</p>
      <p class="text-xl font-mono font-extrabold mt-1 ltr-num">${log.weightKg}</p>
      <p class="text-[10px] text-ink-700 mt-0.5">كجم</p>
    </div>`).join('') || `<p class="text-xs text-ink-700 col-span-full text-center py-4">لا يوجد سجل وزن بعد لهذا العضو.</p>`;
}

/* ---------------------------------------------------------------------
   مودال خطة التمرين — صفوف أيام ديناميكية (إضافة/حذف)
--------------------------------------------------------------------- */
async function loadCoachesInto(selectEl) {
  if (!cachedCoaches.length) {
    const { data } = await window.CoachesAPI.list();
    cachedCoaches = data;
  }
  selectEl.innerHTML = `<option value="">بدون مدرب محدَّد</option>` +
    cachedCoaches.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
}

function addWorkoutDayRow(dayLabel = '', focus = '', notes = '') {
  workoutRowCount += 1;
  const id = `wd-${workoutRowCount}`;
  const row = document.createElement('div');
  row.id = id;
  row.className = 'grid grid-cols-12 gap-2 items-start';
  row.innerHTML = `
    <input placeholder="اليوم" value="${dayLabel}" class="wd-day col-span-2 bg-surface2 border border-border rounded-lg px-2 py-2 text-xs" />
    <input placeholder="محور التمرين" value="${focus}" class="wd-focus col-span-4 bg-surface2 border border-border rounded-lg px-2 py-2 text-xs" />
    <input placeholder="تفاصيل (اختياري)" value="${notes}" class="wd-notes col-span-5 bg-surface2 border border-border rounded-lg px-2 py-2 text-xs" />
    <button type="button" onclick="document.getElementById('${id}').remove()" class="col-span-1 text-ink-700 hover:text-accent-red transition-colors flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button>`;
  document.getElementById('workout-days-container').appendChild(row);
  lucide.createIcons();
}

function openWorkoutPlanModal() {
  document.getElementById('wp-start').value = new Date().toISOString().slice(0, 10);
  document.getElementById('workout-days-container').innerHTML = '';
  ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].forEach((d) => addWorkoutDayRow(d));
  loadCoachesInto(document.getElementById('wp-coach'));
  document.getElementById('workout-plan-modal').classList.remove('hidden');
  document.getElementById('workout-plan-modal').classList.add('flex');
}
function closeWorkoutPlanModal() {
  document.getElementById('workout-plan-modal').classList.add('hidden');
  document.getElementById('workout-plan-modal').classList.remove('flex');
}
async function submitWorkoutPlanForm(e) {
  e.preventDefault();
  const days = [...document.querySelectorAll('#workout-days-container > div')].map((row) => ({
    dayLabel: row.querySelector('.wd-day').value.trim(),
    focus: row.querySelector('.wd-focus').value.trim(),
    notes: row.querySelector('.wd-notes').value.trim() || null,
  })).filter((d) => d.dayLabel && d.focus);

  if (!days.length) { showToast('أضف يوماً واحداً على الأقل', '', 'alert-triangle', 'error'); return; }

  const payload = {
    memberId: currentVipMemberId,
    coachId: document.getElementById('wp-coach').value || null,
    title: document.getElementById('wp-title').value.trim(),
    startDate: new Date(document.getElementById('wp-start').value).toISOString(),
    days,
  };

  try {
    await window.WorkoutPlansAPI.create(payload);
    closeWorkoutPlanModal();
    showToast('تم حفظ خطة التمرين بنجاح', '', 'dumbbell');
    renderVipView();
  } catch (err) {
    showApiError(err);
  }
}

/* ---------------------------------------------------------------------
   مودال النظام الغذائي — صفوف وجبات ديناميكية
--------------------------------------------------------------------- */
function addDietMealRow(mealName = '', items = '') {
  dietRowCount += 1;
  const id = `dm-${dietRowCount}`;
  const row = document.createElement('div');
  row.id = id;
  row.className = 'grid grid-cols-12 gap-2 items-start';
  row.innerHTML = `
    <input placeholder="اسم الوجبة" value="${mealName}" class="dm-name col-span-3 bg-surface2 border border-border rounded-lg px-2 py-2 text-xs" />
    <input placeholder="التفاصيل" value="${items}" class="dm-items col-span-8 bg-surface2 border border-border rounded-lg px-2 py-2 text-xs" />
    <button type="button" onclick="document.getElementById('${id}').remove()" class="col-span-1 text-ink-700 hover:text-accent-red transition-colors flex items-center justify-center"><i data-lucide="x" class="w-4 h-4"></i></button>`;
  document.getElementById('diet-meals-container').appendChild(row);
  lucide.createIcons();
}

function openDietPlanModal() {
  document.getElementById('dp-start').value = new Date().toISOString().slice(0, 10);
  document.getElementById('diet-meals-container').innerHTML = '';
  ['الإفطار', 'وجبة خفيفة', 'الغداء', 'العشاء'].forEach((m) => addDietMealRow(m));
  loadCoachesInto(document.getElementById('dp-coach'));
  document.getElementById('diet-plan-modal').classList.remove('hidden');
  document.getElementById('diet-plan-modal').classList.add('flex');
}
function closeDietPlanModal() {
  document.getElementById('diet-plan-modal').classList.add('hidden');
  document.getElementById('diet-plan-modal').classList.remove('flex');
}
async function submitDietPlanForm(e) {
  e.preventDefault();
  const meals = [...document.querySelectorAll('#diet-meals-container > div')].map((row) => ({
    mealName: row.querySelector('.dm-name').value.trim(),
    items: row.querySelector('.dm-items').value.trim(),
  })).filter((m) => m.mealName && m.items);

  if (!meals.length) { showToast('أضف وجبة واحدة على الأقل', '', 'alert-triangle', 'error'); return; }

  const payload = {
    memberId: currentVipMemberId,
    coachId: document.getElementById('dp-coach').value || null,
    title: document.getElementById('dp-title').value.trim(),
    startDate: new Date(document.getElementById('dp-start').value).toISOString(),
    meals,
  };

  try {
    await window.DietPlansAPI.create(payload);
    closeDietPlanModal();
    showToast('تم حفظ النظام الغذائي بنجاح', '', 'salad');
    renderVipView();
  } catch (err) {
    showApiError(err);
  }
}
