/**
 * views/reports.js — المصروفات والتقارير المالية، متصلة بالكامل بـ
 * /api/reports و/api/expenses. رابط تصدير Excel يُبنى برمز الدخول كـ
 * query param (راجع التعليق التوضيحي في auth.middleware.js للسبب).
 */
async function initReportsView() {
  document.getElementById('export-members-link').href =
    `${window.Http.baseUrl}/exports/members.xlsx?token=${encodeURIComponent(window.Auth.getToken())}`;

  await Promise.all([renderReportSummary(), renderExpensesTable()]);
}

async function renderReportSummary() {
  try {
    const { data } = await window.ReportsAPI.summary();
    document.getElementById('rep-total-revenue').textContent = formatMoney(data.totalRevenue) + ' ج.م';
    document.getElementById('rep-total-expenses').textContent = formatMoney(data.totalExpenses) + ' ج.م';
    const netEl = document.getElementById('rep-net-profit');
    netEl.textContent = formatMoney(data.netProfit) + ' ج.م';
    netEl.className = `text-2xl font-extrabold font-mono mt-2 ltr-num ${data.netProfit >= 0 ? 'text-accent-green' : 'text-accent-red'}`;

    document.getElementById('rep-revenue-chart').innerHTML = buildRevenueBarChart(data.revenueByDay);
  } catch (err) {
    showApiError(err);
  }
}

function buildRevenueBarChart(days) {
  if (!days.length) return `<p class="text-xs text-ink-700">لا توجد بيانات كافية بعد.</p>`;
  const W = 720, H = 180, pad = 24;
  const max = Math.max(...days.map((d) => d.total), 1);
  const barWidth = (W - pad * 2) / days.length;

  const bars = days.map((d, i) => {
    const barHeight = (d.total / max) * (H - pad * 2 - 16);
    const x = pad + i * barWidth;
    const y = H - pad - barHeight;
    return `<rect x="${x + barWidth * 0.15}" y="${y}" width="${barWidth * 0.7}" height="${barHeight}" rx="3" fill="#10b981" opacity="0.85"/>`;
  }).join('');

  // نعرض تسمية كل ٥ أيام فقط حتى لا يتزاحم النص على مدى ٣٠ يوماً
  const labels = days.map((d, i) => (i % 5 === 0
    ? `<text x="${pad + i * barWidth + barWidth / 2}" y="${H - 4}" font-size="9" fill="#63636f" text-anchor="middle" font-family="Cairo">${new Date(d.date).getDate()}</text>`
    : '')).join('');

  return `<svg viewBox="0 0 ${W} ${H}" class="w-full h-auto" style="direction:ltr">${bars}${labels}</svg>`;
}

async function renderExpensesTable() {
  const tbody = document.getElementById('expenses-tbody');
  tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6"><div class="skeleton-row"></div></td></tr>`;
  try {
    const { data: rows } = await window.ExpensesAPI.list({ limit: 30 });
    tbody.innerHTML = rows.map((e) => `
      <tr class="border-b border-border/60 hover:bg-white/[0.025] transition-colors group">
        <td class="px-6 py-3 font-medium">${e.category}</td>
        <td class="px-4 py-3 text-ink-500 text-xs">${e.description || '—'}</td>
        <td class="px-4 py-3 font-mono text-xs text-ink-500 ltr-num">${formatDateAr(e.expenseDate)}</td>
        <td class="px-6 py-3 text-left font-mono font-bold text-accent-red ltr-num">${formatMoney(e.amount)} ج.م</td>
        <td class="px-4 py-3 text-left">
          <button onclick="deleteExpense('${e.id}')" class="text-ink-700 hover:text-accent-red transition-colors opacity-0 group-hover:opacity-100"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </td>
      </tr>`).join('') || `<tr><td colspan="5" class="px-6 py-8 text-center text-ink-700 text-sm">لا توجد مصروفات مسجَّلة بعد</td></tr>`;
    lucide.createIcons();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-accent-red text-sm">${err.message}</td></tr>`;
    showApiError(err);
  }
}

function openExpenseModal() {
  document.getElementById('expense-modal').classList.remove('hidden');
  document.getElementById('expense-modal').classList.add('flex');
}
function closeExpenseModal() {
  document.getElementById('expense-modal').classList.add('hidden');
  document.getElementById('expense-modal').classList.remove('flex');
}
async function submitExpenseForm(e) {
  e.preventDefault();
  const payload = {
    category: document.getElementById('ef-category').value.trim(),
    description: document.getElementById('ef-description').value.trim() || null,
    amount: document.getElementById('ef-amount').value,
  };
  try {
    await window.ExpensesAPI.create(payload);
    closeExpenseModal();
    document.getElementById('ef-category').value = '';
    document.getElementById('ef-description').value = '';
    document.getElementById('ef-amount').value = '';
    showToast('تم تسجيل المصروف بنجاح', payload.category, 'receipt');
    renderExpensesTable();
    renderReportSummary();
  } catch (err) {
    showApiError(err);
  }
}

async function deleteExpense(id) {
  try {
    await window.ExpensesAPI.remove(id);
    showToast('تم حذف المصروف', '', 'trash-2');
    renderExpensesTable();
    renderReportSummary();
  } catch (err) {
    showApiError(err);
  }
}
