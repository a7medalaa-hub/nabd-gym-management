/**
 * views/members.js — شاشة إدارة المشتركين، متصلة بالكامل بـ /api/members
 * و/api/subscription-types و/api/subscriptions. لا توجد أي مصفوفة بيانات
 * محلية هنا — كل عرض هو نتيجة استدعاء API مباشر.
 */

// حالة الشاشة في الذاكرة فقط (ليست بيانات، بل موضع الصفحة/الفلتر الحاليين)
const membersState = { page: 1, limit: 10, search: '', status: 'all' };
let cachedSubscriptionTypes = []; // تُحمَّل مرة وتُعاد استخدامها في نموذجي الإضافة والتجديد

function setMemberFilter(status) {
  membersState.status = status;
  membersState.page = 1;
  document.querySelectorAll('.filter-btn').forEach((b) => {
    const active = b.dataset.filter === status;
    b.classList.toggle('bg-accent-green', active);
    b.classList.toggle('text-slate-950', active);
    b.classList.toggle('text-ink-500', !active);
  });
  renderMembersTable();
}

function goToPage(delta) {
  membersState.page = Math.max(1, membersState.page + delta);
  renderMembersTable();
}

async function renderMembersTable() {
  membersState.search = document.getElementById('members-search')?.value.trim() || '';
  const tbody = document.getElementById('members-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-6"><div class="skeleton-row"></div></td></tr>`;

  try {
    const { data: rows, meta } = await window.MembersAPI.list({
      page: membersState.page,
      limit: membersState.limit,
      search: membersState.search || undefined,
      status: membersState.status,
    });

    document.getElementById('members-count').textContent = `عرض ${rows.length} من ${meta.total}`;
    document.getElementById('members-page-label').textContent = `صفحة ${meta.page} من ${meta.totalPages}`;
    document.getElementById('members-prev-btn').disabled = meta.page <= 1;
    document.getElementById('members-next-btn').disabled = meta.page >= meta.totalPages;

    tbody.innerHTML = rows.map((m) => {
      const active = m.status === 'active';
      const badge = active
        ? `<span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full bg-accent-green/15 text-accent-green border border-accent-green/30"><span class="w-1.5 h-1.5 rounded-full bg-accent-green"></span>نشط</span>`
        : `<span class="inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-full bg-accent-red/15 text-accent-red border border-accent-red/30"><span class="w-1.5 h-1.5 rounded-full bg-accent-red"></span>منتهي</span>`;
      const typeName = m.currentSubscription?.typeName || '—';
      const endDate = m.currentSubscription?.endDate;
      const isVip = m.currentSubscription?.typeName?.includes('VIP');

      return `
        <tr class="border-b border-border/60 hover:bg-white/[0.025] transition-colors group">
          <td class="px-6 py-3.5">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-surface2 border border-border flex items-center justify-center text-xs font-mono font-bold shrink-0 overflow-hidden">
                ${m.photoUrl ? `<img src="http://localhost:4000${m.photoUrl}" class="w-full h-full object-cover" />` : m.fullName[0]}
              </div>
              <div>
                <p class="text-sm font-semibold flex items-center gap-1.5">${m.fullName} ${isVip ? '<i data-lucide="crown" class="w-3.5 h-3.5 text-accent-amber"></i>' : ''}</p>
                <p class="text-[11px] text-ink-700 font-mono ltr-num">${m.id.slice(0, 8)}</p>
              </div>
            </div>
          </td>
          <td class="px-4 py-3.5 font-mono text-xs text-ink-500 ltr-num">${m.phone}</td>
          <td class="px-4 py-3.5 text-ink-300 text-xs">${typeName}</td>
          <td class="px-4 py-3.5 font-mono text-xs ${active ? 'text-ink-300' : 'text-accent-red'} ltr-num">${formatDateAr(endDate)}</td>
          <td class="px-4 py-3.5">${badge}</td>
          <td class="px-6 py-3.5">
            <div class="flex items-center justify-start gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
              <button onclick="openRenewModal('${m.id}', '${m.fullName.replace(/'/g, "\\'")}')" title="تجديد" class="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-ink-500 hover:text-accent-amber transition-colors"><i data-lucide="rotate-cw" class="w-4 h-4"></i></button>
            </div>
          </td>
        </tr>`;
    }).join('') || `<tr><td colspan="6" class="px-6 py-8 text-center text-ink-700 text-sm">لا توجد نتائج مطابقة</td></tr>`;

    lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-accent-red text-sm">${err.message}</td></tr>`;
    showApiError(err);
  }
}

/* ---------------------------------------------------------------------
   نموذج إضافة مشترك جديد
--------------------------------------------------------------------- */
async function loadSubscriptionTypesInto(selectEl) {
  if (!cachedSubscriptionTypes.length) {
    const { data } = await window.SubscriptionTypesAPI.list();
    cachedSubscriptionTypes = data;
  }
  selectEl.innerHTML = cachedSubscriptionTypes
    .map((t) => `<option value="${t.id}">${t.name} — ${formatMoney(t.price)} ج.م / ${t.durationDays} يوم</option>`)
    .join('');
}

async function openMemberModal() {
  document.getElementById('mf-start').value = new Date().toISOString().slice(0, 10);
  document.getElementById('member-modal').classList.remove('hidden');
  document.getElementById('member-modal').classList.add('flex');
  try {
    await loadSubscriptionTypesInto(document.getElementById('mf-type'));
  } catch (err) {
    showApiError(err);
  }
}
function closeMemberModal() {
  document.getElementById('member-modal').classList.add('hidden');
  document.getElementById('member-modal').classList.remove('flex');
  document.getElementById('member-form').reset();
  document.getElementById('mf-error').classList.add('hidden');
}

async function submitMemberForm(e) {
  e.preventDefault();
  const errorEl = document.getElementById('mf-error');
  errorEl.classList.add('hidden');

  const payload = {
    fullName: document.getElementById('mf-name').value.trim(),
    phone: document.getElementById('mf-phone').value.trim(),
    subscriptionTypeId: document.getElementById('mf-type').value,
    startDate: new Date(document.getElementById('mf-start').value).toISOString(),
    paymentMethod: document.getElementById('mf-payment').value,
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const { data: member } = await window.MembersAPI.create(payload);
    closeMemberModal();
    showToast('تمت إضافة المشترك بنجاح', member.fullName, 'user-check');
    renderMembersTable();
    if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
  } catch (err) {
    if (err.details?.length) {
      errorEl.textContent = err.details.map((d) => d.message).join(' — ');
    } else {
      errorEl.textContent = err.message;
    }
    errorEl.classList.remove('hidden');
  } finally {
    submitBtn.disabled = false;
  }
}

/* ---------------------------------------------------------------------
   نموذج تجديد الاشتراك
--------------------------------------------------------------------- */
let renewTargetMemberId = null;

async function openRenewModal(memberId, memberName) {
  renewTargetMemberId = memberId;
  document.getElementById('renew-member-name').textContent = memberName;
  document.getElementById('renew-modal').classList.remove('hidden');
  document.getElementById('renew-modal').classList.add('flex');
  try {
    await loadSubscriptionTypesInto(document.getElementById('rf-type'));
  } catch (err) {
    showApiError(err);
  }
}
function closeRenewModal() {
  document.getElementById('renew-modal').classList.add('hidden');
  document.getElementById('renew-modal').classList.remove('flex');
  renewTargetMemberId = null;
}

async function submitRenewForm(e) {
  e.preventDefault();
  if (!renewTargetMemberId) return;

  const payload = {
    subscriptionTypeId: document.getElementById('rf-type').value,
    paymentMethod: document.getElementById('rf-payment').value,
  };
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const { data } = await window.SubscriptionsAPI.renew(renewTargetMemberId, payload);
    closeRenewModal();
    showToast('تم تجديد الاشتراك وتسجيل الدفعة', `حتى ${formatDateAr(data.subscription.endDate)}`, 'rotate-cw');
    renderMembersTable();
    if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
  } catch (err) {
    showApiError(err);
  } finally {
    submitBtn.disabled = false;
  }
}
