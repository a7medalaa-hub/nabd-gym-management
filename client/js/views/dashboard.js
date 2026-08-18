/**
 * views/dashboard.js — يعرض لوحة التحكم بالكامل من بيانات حقيقية عبر
 * GET /api/dashboard/stats. لا توجد أي أرقام محسوبة محلياً أو ثابتة هنا.
 */
async function renderDashboard() {
  document.getElementById('dashboard-date').textContent =
    new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) + ' — نظرة عامة على اليوم';

  const tbody = document.getElementById('expiring-tbody');
  tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6"><div class="skeleton-row"></div></td></tr>`;

  try {
    const { data: stats } = await window.DashboardAPI.stats();

    document.getElementById('stat-active').textContent = stats.activeMembers;
    document.getElementById('stat-total').textContent = stats.totalMembers;
    document.getElementById('stat-revenue').textContent = formatMoney(stats.todayRevenue);
    document.getElementById('stat-sales-count').textContent = stats.todaySalesCount;
    document.getElementById('stat-expiring').textContent = stats.expiringSoonCount;
    document.getElementById('hdr-active').textContent = stats.activeMembers;
    document.getElementById('hdr-expiring').textContent = stats.expiringSoonCount;

    tbody.innerHTML = stats.expiringSoonList.map((row) => {
      const d = daysUntil(row.endDate);
      const daysLabel = d === 0 ? 'ينتهي اليوم' : `${d} يوم`;
      return `
        <tr class="border-b border-border/60 hover:bg-white/[0.025] transition-colors">
          <td class="px-6 py-3.5 font-medium">${row.memberName}</td>
          <td class="px-4 py-3.5 font-mono text-xs text-ink-500 ltr-num">${row.phone}</td>
          <td class="px-4 py-3.5 font-mono text-xs text-ink-300 ltr-num">${formatDateAr(row.endDate)}</td>
          <td class="px-4 py-3.5"><span class="text-xs font-bold text-accent-amber font-mono ltr-num">${daysLabel}</span></td>
          <td class="px-6 py-3.5 text-left">
            <button onclick="openRenewModal('${row.memberId}', '${row.memberName.replace(/'/g, "\\'")}')" class="inline-flex items-center gap-1.5 bg-accent-amber/15 text-accent-amber text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-accent-amber/25 transition-colors">
              <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i> تجديد
            </button>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="5" class="px-6 py-8 text-center text-ink-700 text-sm">لا توجد اشتراكات قريبة من الانتهاء 🎉</td></tr>`;

    lucide.createIcons();
    document.getElementById('qa-count').textContent = stats.todayAttendanceCount;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-accent-red text-sm">${err.message}</td></tr>`;
    showApiError(err);
  }
}

/* =========================================================================
   الحضور السريع — بحث عن عضو، معاينة حالته، وتسجيل حضوره بضغطة واحدة.
   هذا هو نفس المكوّن المحوري من النموذج الأولي الإنجليزي الأول، مبنياً الآن
   على /api/members (بحث) و/api/attendance/check-in (تسجيل) حقيقيَّين.
========================================================================= */
let quickSearchDebounce = null;

function handleQuickSearch(rawQuery) {
  clearTimeout(quickSearchDebounce);
  const resultsEl = document.getElementById('qa-results');
  const query = rawQuery.trim();
  if (!query) { resultsEl.innerHTML = ''; return; }

  quickSearchDebounce = setTimeout(async () => {
    try {
      const { data: matches } = await window.MembersAPI.list({ search: query, limit: 5, status: 'all' });
      if (!matches.length) {
        resultsEl.innerHTML = `<p class="text-xs text-ink-700 px-1 py-2">لا يوجد مشتركون مطابقون لـ "${query}".</p>`;
        return;
      }
      resultsEl.innerHTML = matches.map((m) => {
        const dotColor = m.status === 'active' ? 'bg-accent-green' : 'bg-accent-red';
        return `
          <button onclick="showAttendancePreview('${m.id}')" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.04] text-right transition-colors fade-in">
            <span class="w-2 h-2 rounded-full ${dotColor} shrink-0"></span>
            <span class="text-sm font-medium truncate">${m.fullName}</span>
            <span class="text-xs font-mono text-ink-700 mr-auto shrink-0 ltr-num">${m.phone}</span>
          </button>`;
      }).join('');
      lucide.createIcons();
    } catch (err) {
      showApiError(err);
    }
  }, 300);
}

async function showAttendancePreview(memberId) {
  try {
    const { data: m } = await window.MembersAPI.getById(memberId);
    document.getElementById('qa-empty').classList.add('hidden');
    const preview = document.getElementById('qa-preview');
    preview.classList.remove('hidden');

    const isActive = m.status === 'active';
    const statusColor = isActive ? '#10b981' : '#ef4444';
    const badgeClasses = isActive ? 'bg-accent-green/15 text-accent-green border-accent-green/30' : 'bg-accent-red/15 text-accent-red border-accent-red/30';

    preview.innerHTML = `
      <div class="h-full rounded-xl border border-border bg-surface2/60 p-5 flex flex-col gap-5 fade-in">
        <div class="flex items-start gap-4">
          <div class="pulse-ring rounded-full" style="--pulse-color:${statusColor}">
            <div class="w-14 h-14 rounded-full bg-surface flex items-center justify-center text-base font-mono font-bold border border-border relative z-10">${m.fullName[0]}</div>
          </div>
          <div class="min-w-0">
            <p class="font-semibold text-base truncate">${m.fullName}</p>
            <p class="text-xs font-mono text-ink-700 mt-0.5 ltr-num">${m.phone} · ${m.currentSubscription?.typeName || '—'}</p>
            <span class="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${badgeClasses}">
              <span class="w-1.5 h-1.5 rounded-full" style="background:${statusColor}"></span>
              ${isActive ? 'نشط' : 'منتهي'} ${m.currentSubscription ? '· ينتهي ' + formatDateAr(m.currentSubscription.endDate) : ''}
            </span>
          </div>
        </div>
        <button onclick="markAttendance('${m.id}')"
          class="mt-auto w-full flex items-center justify-center gap-2 ${isActive ? 'bg-accent-green text-slate-950 shadow-glow-green hover:brightness-110' : 'bg-accent-red/90 text-white hover:brightness-110'} font-semibold text-sm py-3.5 rounded-xl active:scale-[0.98] transition-all">
          <i data-lucide="${isActive ? 'check-circle-2' : 'alert-octagon'}" class="w-[18px] h-[18px]"></i>
          ${isActive ? 'تسجيل الحضور' : 'الاشتراك منتهٍ — التجديد مطلوب'}
        </button>
      </div>`;
    lucide.createIcons();
  } catch (err) {
    showApiError(err);
  }
}

async function markAttendance(memberId) {
  try {
    const { data } = await window.AttendanceAPI.checkIn(memberId);
    showToast('تم تسجيل الحضور', data.member.fullName, 'check-circle-2');
    document.getElementById('qa-search').value = '';
    document.getElementById('qa-results').innerHTML = '';
    document.getElementById('qa-preview').classList.add('hidden');
    document.getElementById('qa-empty').classList.remove('hidden');
    renderDashboard(); // يحدّث عدّاد حضور اليوم
  } catch (err) {
    showApiError(err); // مثال: "تم تسجيل حضور هذا العضو اليوم بالفعل"
  }
}
