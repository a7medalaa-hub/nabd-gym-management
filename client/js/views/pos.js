/**
 * views/pos.js — المالية والمبيعات، متصلة بالكامل بـ /api/payments (إيراد
 * الاشتراكات) و/api/products و/api/sales (بار الجيم). لا توجد أصناف أو
 * أسعار ثابتة هنا — الكتالوج بأكمله من قاعدة البيانات.
 */
let posProducts = [];
let posCart = []; // حالة الفاتورة الحالية فقط (ليست بيانات مخزَّنة، تُفرَّغ بعد كل عملية بيع)

function dayRangeIso() {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end = new Date(); end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

async function initPosView() {
  await Promise.all([renderSubRevenueTable(), renderProductGrid()]);
  renderCart();
}

async function renderSubRevenueTable() {
  const tbody = document.getElementById('subrevenue-tbody');
  tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6"><div class="skeleton-row"></div></td></tr>`;
  try {
    const { from, to } = dayRangeIso();
    const { data: rows } = await window.PaymentsAPI.list({ from, to, limit: 50 });
    document.getElementById('sub-revenue-total').textContent = formatMoney(rows.reduce((s, r) => s + Number(r.amount), 0));

    tbody.innerHTML = rows.map((r) => `
      <tr class="border-b border-border/60 hover:bg-white/[0.025] transition-colors">
        <td class="px-6 py-3 font-medium">${r.member?.fullName || '—'}</td>
        <td class="px-4 py-3 text-ink-300 text-xs">${r.type === 'RENEWAL' ? 'تجديد اشتراك' : 'اشتراك جديد'}</td>
        <td class="px-4 py-3 text-ink-500 text-xs">${paymentMethodAr(r.method)}</td>
        <td class="px-4 py-3 font-mono text-xs text-ink-500 ltr-num">${new Date(r.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</td>
        <td class="px-6 py-3 text-left font-mono font-bold ltr-num">${formatMoney(r.amount)} ج.م</td>
      </tr>`).join('') || `<tr><td colspan="5" class="px-6 py-8 text-center text-ink-700 text-sm">لا توجد إيرادات اشتراكات اليوم بعد</td></tr>`;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-accent-red text-sm">${err.message}</td></tr>`;
    showApiError(err);
  }
}

function paymentMethodAr(m) {
  return { CASH: 'نقدي', CARD: 'فيزا', WALLET: 'محفظة إلكترونية', OTHER: 'أخرى' }[m] || m;
}

const PRODUCT_ICONS = {
  'مشروبات': 'glass-water', 'وجبات خفيفة': 'cookie', 'مكملات': 'flask-conical',
  'ملابس': 'shirt', 'إكسسوارات': 'hand',
};

async function renderProductGrid() {
  const grid = document.getElementById('pos-items-grid');
  grid.innerHTML = `<div class="skeleton-row col-span-3"></div>`;
  try {
    const { data } = await window.ProductsAPI.list();
    posProducts = data;
    grid.innerHTML = posProducts.map((p) => `
      <button onclick="addToCart('${p.id}')" ${p.stockQuantity <= 0 ? 'disabled' : ''}
        class="flex flex-col items-center gap-2 bg-surface2 border border-border hover:border-accent-green/40 rounded-xl p-4 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
        <div class="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
          <i data-lucide="${PRODUCT_ICONS[p.category] || 'package'}" class="w-5 h-5 text-accent-green"></i>
        </div>
        <p class="text-xs font-semibold text-center">${p.name}</p>
        <p class="text-[11px] font-mono text-ink-500 ltr-num">${formatMoney(p.price)} ج.م</p>
        ${p.stockQuantity <= p.lowStockThreshold ? `<p class="text-[10px] text-accent-amber ltr-num">متبقٍ ${p.stockQuantity}</p>` : ''}
      </button>`).join('');
    lucide.createIcons();
  } catch (err) {
    grid.innerHTML = `<p class="text-xs text-accent-red col-span-3 text-center py-6">${err.message}</p>`;
    showApiError(err);
  }
}

function addToCart(productId) {
  const product = posProducts.find((p) => p.id === productId);
  if (!product) return;
  const existing = posCart.find((c) => c.productId === productId);
  const currentQty = existing ? existing.quantity : 0;
  if (currentQty + 1 > product.stockQuantity) {
    showToast('الكمية غير متاحة', `المتاح من "${product.name}": ${product.stockQuantity}`, 'alert-triangle', 'error');
    return;
  }
  if (existing) existing.quantity += 1;
  else posCart.push({ productId, name: product.name, price: Number(product.price), quantity: 1 });
  renderCart();
}

function changeCartQty(productId, delta) {
  const item = posCart.find((c) => c.productId === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) posCart = posCart.filter((c) => c.productId !== productId);
  renderCart();
}

function renderCart() {
  const root = document.getElementById('cart-items');
  const emptyMsg = document.getElementById('cart-empty');
  if (!posCart.length) {
    root.innerHTML = '';
    emptyMsg.classList.remove('hidden');
  } else {
    emptyMsg.classList.add('hidden');
    root.innerHTML = posCart.map((c) => `
      <div class="flex items-center gap-2 bg-surface2 border border-border rounded-lg px-3 py-2 fade-in">
        <p class="text-xs font-semibold flex-1 truncate">${c.name}</p>
        <button onclick="changeCartQty('${c.productId}',-1)" class="w-6 h-6 rounded-md bg-surface flex items-center justify-center text-ink-500 hover:text-accent-red transition-colors">−</button>
        <span class="text-xs font-mono w-4 text-center ltr-num">${c.quantity}</span>
        <button onclick="changeCartQty('${c.productId}',1)" class="w-6 h-6 rounded-md bg-surface flex items-center justify-center text-ink-500 hover:text-accent-green transition-colors">+</button>
        <span class="text-xs font-mono text-ink-300 w-16 text-left ltr-num">${formatMoney(c.price * c.quantity)} ج.م</span>
      </div>`).join('');
  }
  const total = posCart.reduce((s, c) => s + c.price * c.quantity, 0);
  document.getElementById('cart-total').textContent = formatMoney(total);
}

async function completeInvoice() {
  if (!posCart.length) { showToast('السلة فارغة', 'أضف عناصر قبل إتمام الفاتورة', 'alert-circle', 'error'); return; }

  const paymentMethod = document.getElementById('pos-payment-method').value;
  const items = posCart.map((c) => ({ productId: c.productId, quantity: c.quantity }));

  try {
    const { data: sale } = await window.SalesAPI.create({ items, paymentMethod });
    showToast('تم إصدار الفاتورة', `${sale.invoiceNumber} — ${formatMoney(sale.totalAmount)} ج.م`, 'receipt-text');
    posCart = [];
    renderCart();
    await renderProductGrid(); // تحديث الكميات المتاحة بعد خصم المخزون
    if (document.getElementById('view-dashboard').classList.contains('active')) renderDashboard();
  } catch (err) {
    showApiError(err); // مثال: "لا يوجد مخزون كافٍ من ..."
  }
}
