/* Electronics Inventory – Frontend App (Solar-R-Us style) */
const API = '/api';

function extractError(r) {
  return r.text().then((t) => {
    let msg = r.statusText;
    if (t) {
      try {
        const d = JSON.parse(t);
        msg = (d && (d.error || d.message || d.msg)) || msg;
      } catch {
        if (t.length < 200) msg = t;
      }
    }
    if (msg === 'Bad Request' || (r.status === 400 && !t)) {
      msg = 'Operation failed. Please check your input and try again.';
    }
    return msg;
  });
}

function get(url) {
  return fetch(API + url).then((r) => {
    if (!r.ok) return extractError(r).then((msg) => Promise.reject(msg));
    return r.json();
  });
}

function post(url, data) {
  return fetch(API + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) return extractError(r).then((msg) => Promise.reject(msg));
    return r.status === 204 ? null : r.json();
  });
}

function put(url, data) {
  return fetch(API + url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => {
    if (!r.ok) return extractError(r).then((msg) => Promise.reject(msg));
    return r.json();
  });
}

function del(url) {
  return fetch(API + url, { method: 'DELETE' }).then((r) => {
    if (!r.ok) return extractError(r).then((msg) => Promise.reject(msg));
    return r.status === 204 ? null : r.json();
  });
}

function toast(message, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast ' + type + ' show' + (type === 'success' ? ' toast-success-anim' : type === 'error' ? ' toast-error-anim' : '');
  setTimeout(() => {
    el.classList.remove('show', 'toast-success-anim', 'toast-error-anim');
  }, 3000);
}

function escapeHtml(s) {
  if (s == null) return '—';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function escapeAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMoney(v) {
  if (v == null) return '—';
  const n = parseFloat(v);
  return isNaN(n) ? '—' : '₹' + n.toFixed(2);
}

function productInitial(name) {
  return (name && name.charAt(0).toUpperCase()) || '?';
}

// Modal
const modal = {
  overlay: document.getElementById('modal-overlay'),
  title: document.getElementById('modal-title'),
  body: document.getElementById('modal-body'),
  open(title, content) {
    this.title.textContent = title;
    this.body.innerHTML = content;
    this.overlay.setAttribute('aria-hidden', 'false');
  },
  close() {
    this.overlay.setAttribute('aria-hidden', 'true');
  },
};

document.querySelector('.modal-close').addEventListener('click', () => modal.close());
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === modal.overlay) modal.close();
});

// Switch view and sync nav
function switchView(viewId) {
  if (viewId === 'more') viewId = 'categories';
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  const viewEl = document.getElementById('view-' + viewId);
  if (viewEl) viewEl.classList.add('active');

  document.querySelectorAll('.nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === viewId || (viewId === 'categories' && b.dataset.view === 'more'));
  });
  document.querySelectorAll('.bottom-nav-item').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === viewId || (viewId === 'categories' && b.dataset.view === 'more'));
  });

  if (viewId === 'dashboard') { loadOwnerBalance(); loadDashboard(); }
  if (viewId === 'products') loadProducts();
  if (viewId === 'categories') loadCategories();
  if (viewId === 'suppliers') loadSuppliers();
  if (viewId === 'sales') loadSales();
  if (viewId === 'purchases') loadPurchases();
  if (viewId === 'reports') loadReport('stock', 'report-content-standalone');
  if (viewId === 'about') updateUserProfile();
}

document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

document.querySelectorAll('.bottom-nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    switchView(btn.dataset.view);
    if (document.getElementById('sidebar')) document.getElementById('sidebar').classList.remove('open');
  });
});

document.querySelectorAll('.overview-card').forEach((card) => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(card.dataset.nav);
  });
});

document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// Dashboard content tabs
document.querySelectorAll('.content-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    const tabId = tab.dataset.tab;
    document.querySelectorAll('.content-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('tab-' + tabId);
    if (panel) panel.classList.add('active');
    if (tabId === 'reporting') loadReport('stock', 'report-content');
  });
});

// Report tabs (dashboard Reporting panel + standalone reports view)
function bindReportTabs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.closest('.card')?.querySelectorAll('.report-tab').forEach((tab) => {
    tab.onclick = () => {
      container.closest('.card').querySelectorAll('.report-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      loadReport(tab.dataset.report, containerId);
    };
  });
}

function loadReport(type, containerId) {
  const id = containerId || 'report-content';
  const container = document.getElementById(id);
  if (!container) return;

  if (type === 'stock') {
    get('/products').then((rows) => {
      container.innerHTML =
        '<table class="table">' +
        '<thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Min</th><th>Unit Price</th></tr></thead>' +
        '<tbody>' +
        rows
          .map(
            (p) =>
              '<tr class="' + (parseInt(p.quantity, 10) <= parseInt(p.min_stock, 10) ? 'low-stock' : '') + '">' +
              '<td>' + escapeHtml(p.display_name || p.name) + '</td><td><code>' + escapeHtml(p.sku || '—') + '</code></td>' +
              '<td class="cell-qty">' + p.quantity + '</td><td class="cell-qty">' + p.min_stock + '</td>' +
              '<td>' + formatMoney(p.unit_price) + '</td></tr>'
          )
          .join('') +
        '</tbody></table>';
    }).catch(() => { container.innerHTML = '<p class="empty-state">Failed to load report.</p>'; });
  } else if (type === 'low') {
    get('/products/low-stock').then((rows) => {
      if (rows.length === 0) {
        container.innerHTML = '<p class="empty-state">No low stock items.</p>';
        return;
      }
      container.innerHTML =
        '<table class="table">' +
        '<thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Min</th><th>Unit Price</th></tr></thead>' +
        '<tbody>' +
        rows
          .map(
            (p) =>
              '<tr class="low-stock"><td>' + escapeHtml(p.display_name || p.name) + '</td><td><code>' + escapeHtml(p.sku || '—') + '</code></td>' +
              '<td class="cell-qty">' + p.quantity + '</td><td class="cell-qty">' + p.min_stock + '</td>' +
              '<td>' + formatMoney(p.unit_price) + '</td></tr>'
          )
          .join('') +
        '</tbody></table>';
    }).catch(() => { container.innerHTML = '<p class="empty-state">Failed to load report.</p>'; });
  } else if (type === 'sales') {
    get('/sales').then((rows) => {
      if (rows.length === 0) {
        container.innerHTML = '<p class="empty-state">No sales records.</p>';
        return;
      }
      container.innerHTML =
        '<table class="table">' +
        '<thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Notes</th></tr></thead>' +
        '<tbody>' +
        rows
          .map((r) => {
            const d = r.sale_date ? new Date(r.sale_date).toLocaleString() : '—';
            return '<tr><td>' + d + '</td><td>' + escapeHtml(r.product_name) + '</td><td><code>' + escapeHtml(r.sku || '—') + '</code></td>' +
              '<td class="cell-qty">' + r.quantity + '</td><td>' + formatMoney(r.unit_price) + '</td><td>' + formatMoney(r.total_amount) + '</td>' +
              '<td>' + escapeHtml(r.notes || '—') + '</td></tr>';
          })
          .join('') +
        '</tbody></table>';
    }).catch(() => { container.innerHTML = '<p class="empty-state">Failed to load report.</p>'; });
  } else if (type === 'purchases') {
    get('/purchases').then((rows) => {
      if (rows.length === 0) {
        container.innerHTML = '<p class="empty-state">No purchase records.</p>';
        return;
      }
      container.innerHTML =
        '<table class="table">' +
        '<thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Notes</th></tr></thead>' +
        '<tbody>' +
        rows
          .map((r) => {
            const d = r.purchase_date ? new Date(r.purchase_date).toLocaleString() : '—';
            return '<tr><td>' + d + '</td><td>' + escapeHtml(r.product_name) + '</td><td><code>' + escapeHtml(r.sku || '—') + '</code></td>' +
              '<td class="cell-qty">' + r.quantity + '</td><td>' + formatMoney(r.unit_price) + '</td><td>' + formatMoney(r.total_amount) + '</td>' +
              '<td>' + escapeHtml(r.notes || '—') + '</td></tr>';
          })
          .join('') +
        '</tbody></table>';
    }).catch(() => { container.innerHTML = '<p class="empty-state">Failed to load report.</p>'; });
  }
}

// Build one product row (dashboard + products table)
function productRow(p, showActions) {
  const low = parseInt(p.quantity, 10) <= parseInt(p.min_stock, 10);
  const displayName = p.display_name || p.name;
  const initial = productInitial(displayName);
  const price = formatMoney(p.unit_price);
  const unitsSold = p.units_sold != null ? p.units_sold : 0;
  const typeConfig = [p.type_name, p.brand_name, p.config_name].filter(Boolean).join(' • ');
  const maxSellable = Math.max(0, parseInt(p.quantity, 10) - (parseInt(p.min_stock, 10) || 0));
  let actions = '';
  if (showActions) {
    actions =
      '<button type="button" class="btn btn-secondary btn-sm btn-edit-product" data-id="' + p.id + '">Edit</button>' +
      '<button type="button" class="btn btn-secondary btn-sm btn-stock-in" data-id="' + p.id + '" data-name="' + escapeAttr(displayName) + '" data-max="' + p.quantity + '">In</button>' +
      '<button type="button" class="btn btn-secondary btn-sm btn-stock-out" data-id="' + p.id + '" data-name="' + escapeAttr(displayName) + '" data-max="' + maxSellable + '" data-min-stock="' + (p.min_stock || 0) + '" data-quantity="' + p.quantity + '">Out</button>' +
      '<button type="button" class="btn btn-danger btn-sm btn-delete-product" data-id="' + p.id + '" data-name="' + escapeAttr(displayName) + '">Delete</button>';
  } else {
    actions = '<a class="link-open btn-open-product" href="#" data-id="' + p.id + '">Open</a>';
  }
  return (
    '<tr class="' + (low ? 'low-stock' : '') + '">' +
    '<td><div class="product-thumb">' + initial + '</div></td>' +
    '<td>' + escapeHtml(displayName) +
    (typeConfig ? '<span class="product-subtext">' + escapeHtml(typeConfig) + '</span>' : '') +
    '</td>' +
    '<td>' + price + '</td>' +
    '<td>' + price + '</td>' +
    '<td class="cell-qty">' + p.quantity + '</td>' +
    '<td class="cell-qty">' + unitsSold + '</td>' +
    '<td>' + actions + '</td></tr>'
  );
}

// Build product card (mobile)
function productCard(p) {
  const low = parseInt(p.quantity, 10) <= parseInt(p.min_stock, 10);
  const displayName = p.display_name || p.name;
  const initial = productInitial(displayName);
  const unitsSold = p.units_sold != null ? p.units_sold : 0;
  const typeConfig = [p.type_name, p.brand_name, p.config_name].filter(Boolean).join(' • ');
  const badge = low ? '<span class="product-card-badge low">Low</span>' : '<span class="product-card-badge high">High</span>';
  return (
    '<div class="product-card" data-id="' + p.id + '">' +
    '<div class="product-card-thumb ' + (low ? 'low-stock' : '') + '">' + badge + initial + '</div>' +
    '<div class="product-card-body">' +
    '<div class="product-card-name">' + escapeHtml(p.display_name || p.name) + '</div>' +
    (typeConfig ? '<div class="product-card-meta">' + escapeHtml(typeConfig) + '</div>' : '') +
    '<div class="product-card-meta">' +
    '<span>Units available: ' + p.quantity + '</span>' +
    '<span>Units sold: ' + unitsSold + '</span>' +
    '</div>' +
    '<button type="button" class="btn btn-secondary btn-sm open-product-card" data-id="' + p.id + '">Open</button>' +
    '</div></div>'
  );
}

function bindStockButtons(container) {
  if (!container) return;
  container.querySelectorAll('.btn-stock-in').forEach((btn) => {
    btn.onclick = () => openStockModal(btn.dataset.id, btn.dataset.name, btn.dataset.max, 'in');
  });
  container.querySelectorAll('.btn-stock-out').forEach((btn) => {
    btn.onclick = () => openStockModal(btn.dataset.id, btn.dataset.name, btn.dataset.max, 'out', btn.dataset.minStock, btn.dataset.quantity);
  });
}

function filterTableBySearch(tableId, searchInputId, rowTextIndex) {
  const table = document.getElementById(tableId);
  const input = document.getElementById(searchInputId);
  if (!table || !input) return;
  const tbody = table.querySelector('tbody');
  const rowTextIndexes = rowTextIndex || [1];
  input.addEventListener('input', () => {
    const q = (input.value || '').trim().toLowerCase();
    tbody.querySelectorAll('tr').forEach((tr) => {
      const text = rowTextIndexes.map((i) => tr.cells[i] && tr.cells[i].textContent).join(' ').toLowerCase();
      tr.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
    });
  });
}

function filterCardsBySearch(searchInputId, cardSelector) {
  const input = document.getElementById(searchInputId);
  const container = document.querySelector(cardSelector);
  if (!input || !container) return;
  input.addEventListener('input', () => {
    const q = (input.value || '').trim().toLowerCase();
    container.querySelectorAll('.product-card').forEach((card) => {
      const name = (card.querySelector('.product-card-name') || {}).textContent || '';
      card.style.display = !q || name.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
  });
}

// Dashboard
let allProductsCache = [];

function loadOwnerBalance() {
  get('/accounts/owner')
    .then((owner) => {
      const el = document.getElementById('owner-balance-value');
      if (el) el.textContent = formatMoney(owner.balance);
    })
    .catch(() => {
      const el = document.getElementById('owner-balance-value');
      if (el) el.textContent = '—';
    });
}

function loadDashboard() {
  loadOwnerBalance();
  get('/products')
    .then((products) => {
      allProductsCache = products;
      const tbody = document.querySelector('#dashboard-products tbody');
      tbody.innerHTML = products.map((p) => productRow(p, false)).join('');
      tbody.querySelectorAll('.btn-open-product').forEach((b) => {
        b.onclick = (e) => { e.preventDefault(); openProductModal(parseInt(b.dataset.id, 10)); };
      });
      bindReportTabs('report-content');
      filterTableBySearch('dashboard-products', 'search-inventory', [1]);
    })
    .catch((err) => toast(err || 'Failed to load dashboard', 'error'));
}

// Products
function loadProducts() {
  get('/products')
    .then((rows) => {
      const tbody = document.querySelector('#products-table tbody');
      tbody.innerHTML = rows.map((p) => productRow(p, true)).join('');
      tbody.querySelectorAll('.btn-edit-product').forEach((b) => {
        b.onclick = () => openProductModal(parseInt(b.dataset.id, 10));
      });
      tbody.querySelectorAll('.btn-delete-product').forEach((b) => {
        b.onclick = () => deleteProduct(parseInt(b.dataset.id, 10), b.dataset.name);
      });
      bindStockButtons(tbody);

      const cardsEl = document.getElementById('products-cards');
      if (cardsEl) {
        cardsEl.innerHTML = rows.map(productCard).join('');
        cardsEl.querySelectorAll('.open-product-card').forEach((b) => {
          b.onclick = () => openProductModal(parseInt(b.dataset.id, 10));
        });
      }
      filterTableBySearch('products-table', 'search-products', [1]);
      filterCardsBySearch('search-products', '#products-cards');
      updateUserProfile();
    })
    .catch((err) => toast(err || 'Failed to load products', 'error'));
}

function openStockModal(productId, productName, maxQty, type, minStock, totalQty) {
  const isOut = type === 'out';
  const content =
    '<p class="form-group"><strong>' + escapeHtml(productName) + '</strong></p>' +
    '<div class="form-group">' +
    '<label>Quantity</label>' +
    '<input type="number" id="stock-qty" min="1" max="' + (isOut ? Math.max(0, maxQty) : '') + '" value="1" required>' +
    (isOut ? '<small style="color:var(--text-muted)">Max you can sell: ' + Math.max(0, maxQty) + (minStock != null && parseInt(minStock, 10) > 0 ? ' (min stock: ' + minStock + ', total: ' + (totalQty != null ? totalQty : maxQty) + ')' : '') + '</small>' : '') +
    '</div>' +
    '<div class="form-group">' +
    '<label>Unit price ' + (isOut ? '(optional, uses product price if blank)' : '(required for purchase, or uses product price if blank)') + '</label>' +
    '<input type="number" id="stock-price" step="0.01" min="0" placeholder="Leave blank to use product price">' +
    '</div>' +
    '<div class="form-group"><label>Notes</label><input type="text" id="stock-notes" placeholder="Optional"></div>' +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-secondary" data-close>Cancel</button>' +
    '<button type="button" class="btn btn-primary" id="stock-submit">' + (isOut ? 'Stock Out' : 'Stock In') + '</button>' +
    '</div>';
  modal.open(isOut ? 'Stock Out' : 'Stock In', content);
  modal.body.querySelector('[data-close]').onclick = () => modal.close();
  modal.body.querySelector('#stock-submit').onclick = () => {
    const qty = parseInt(document.getElementById('stock-qty').value, 10);
    const price = document.getElementById('stock-price').value;
    const notes = document.getElementById('stock-notes').value;
    if (!qty || qty < 1) {
      toast('Enter a valid quantity', 'error');
      return;
    }
    const payload = { product_id: parseInt(productId, 10), quantity: qty, notes: notes || undefined };
    if (price !== '') payload.unit_price = parseFloat(price);
    const url = isOut ? '/sales' : '/purchases';
    post(url, payload)
      .then(() => {
        toast(isOut ? 'Sale recorded' : 'Purchase recorded');
        modal.close();
        loadOwnerBalance();
        loadDashboard();
        loadProducts();
        loadSuppliers();
        if (isOut) loadSales();
      })
      .catch((err) => toast(err || 'Failed', 'error'));
  };
}

function openProductModal(productId = null) {
  const isEdit = productId != null;
  Promise.all([get('/suppliers'), get('/product-types')])
    .then(([suppliers, types]) => {
      const supOpts = suppliers.map((s) => '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>').join('');
      const typeOpts = types.map((t) => '<option value="' + t.id + '">' + escapeHtml(t.name) + '</option>').join('');
      const content =
        '<div class="form-group"><label>Product type</label><select id="product-type"><option value="">— Select type —</option>' + typeOpts + '</select></div>' +
        '<div class="form-group"><label>Brand</label><select id="product-brand"><option value="">— Select type first —</option></select></div>' +
        '<div class="form-group"><label>Model name</label><select id="product-model"><option value="">— Select brand first —</option></select></div>' +
        '<div class="form-group"><label>Configuration</label><select id="product-config"><option value="">— Select type first —</option></select></div>' +
        '<div class="form-group"><label>Supplier</label><select id="product-supplier"><option value="">—</option>' + supOpts + '</select></div>' +
        '<div class="form-group"><label>Min stock (alert threshold)</label><input type="number" id="product-min" min="0" value="0"></div>' +
        '<div class="form-group"><label>Quantity</label><input type="number" id="product-qty" min="0" value="0"></div>' +
        '<div class="form-group"><label>Unit price</label><input type="number" id="product-price" step="0.01" min="0" value="0"></div>' +
        '<div class="form-actions">' +
        '<button type="button" class="btn btn-secondary" data-close>Cancel</button>' +
        '<button type="button" class="btn btn-primary" id="product-save">' + (isEdit ? 'Update' : 'Add') + ' Product</button></div>';
      modal.open(isEdit ? 'Edit Product' : 'Add Product', content);
      modal.body.querySelector('[data-close]').onclick = () => modal.close();

      const typeSelect = modal.body.querySelector('#product-type');
      const modelSelect = modal.body.querySelector('#product-model');
      const brandSelect = modal.body.querySelector('#product-brand');
      const configSelect = modal.body.querySelector('#product-config');

      function isLaptopType(typeId) {
        const t = types.find((x) => String(x.id) === String(typeId));
        return t && t.name === 'Laptop';
      }

      function loadDependentDropdowns(typeId, selectedModelId, selectedBrandId, selectedConfigId) {
        if (!typeId) {
          modelSelect.innerHTML = '<option value="">— Select brand first —</option>';
          brandSelect.innerHTML = '<option value="">— Select type first —</option>';
          configSelect.innerHTML = '<option value="">— Select type first —</option>';
          return Promise.resolve();
        }
        const laptopFlow = isLaptopType(typeId);
        return Promise.all([
          laptopFlow ? Promise.resolve([]) : get('/models?product_type_id=' + typeId),
          get('/brands?product_type_id=' + typeId),
          get('/configurations?product_type_id=' + typeId)
        ]).then(([models, brands, configs]) => {
          if (laptopFlow) {
            modelSelect.innerHTML = '<option value="">— Select brand first —</option>';
          } else {
            modelSelect.innerHTML =
              '<option value="">— Select model —</option>' +
              (models || []).map((m) => '<option value="' + m.id + '">' + escapeHtml(m.name) + '</option>').join('');
            if (selectedModelId) modelSelect.value = selectedModelId;
          }
          brandSelect.innerHTML =
            '<option value="">— Select brand —</option>' +
            brands.map((b) => '<option value="' + b.id + '">' + escapeHtml(b.name) + '</option>').join('');
          configSelect.innerHTML =
            '<option value="">— Select configuration —</option>' +
            configs.map((c) => '<option value="' + c.id + '">' + escapeHtml(c.name) + '</option>').join('');
          if (selectedBrandId) brandSelect.value = selectedBrandId;
          if (selectedConfigId) configSelect.value = selectedConfigId;
        });
      }

      function loadModelsByBrand(typeId, brandId, selectedModelId) {
        if (!typeId || !brandId) {
          modelSelect.innerHTML = '<option value="">— Select brand first —</option>';
          return;
        }
        get('/models?product_type_id=' + typeId + '&brand_id=' + brandId).then((models) => {
          modelSelect.innerHTML =
            '<option value="">— Select model —</option>' +
            models.map((m) => '<option value="' + m.id + '">' + escapeHtml(m.name) + '</option>').join('');
          if (selectedModelId) modelSelect.value = selectedModelId;
        });
      }

      typeSelect.addEventListener('change', () => {
        brandSelect.value = '';
        modelSelect.innerHTML = '<option value="">— Select brand first —</option>';
        loadDependentDropdowns(typeSelect.value);
      });

      brandSelect.addEventListener('change', () => {
        if (isLaptopType(typeSelect.value)) {
          loadModelsByBrand(typeSelect.value, brandSelect.value);
        }
      });

      if (isEdit) {
        get('/products/' + productId).then((p) => {
          document.getElementById('product-supplier').value = p.supplier_id || '';
          document.getElementById('product-type').value = p.type_id || '';
          loadDependentDropdowns(p.type_id, p.model_id, p.brand_id, p.config_id).then(() => {
            if (isLaptopType(p.type_id) && p.brand_id) {
              loadModelsByBrand(p.type_id, p.brand_id, p.model_id);
            }
          });
          document.getElementById('product-min').value = p.min_stock ?? 0;
          document.getElementById('product-qty').value = p.quantity ?? 0;
          document.getElementById('product-price').value = p.unit_price ?? 0;
        });
      }

      modal.body.querySelector('#product-save').onclick = () => {
        const modelId = document.getElementById('product-model').value;
        if (!modelId) {
          toast('Model is required', 'error');
          return;
        }
        const payload = {
          model_id: parseInt(modelId, 10),
          type_id: document.getElementById('product-type').value || undefined,
          brand_id: document.getElementById('product-brand').value || undefined,
          config_id: document.getElementById('product-config').value || undefined,
          supplier_id: document.getElementById('product-supplier').value || undefined,
          min_stock: parseInt(document.getElementById('product-min').value, 10) || 0,
          quantity: parseInt(document.getElementById('product-qty').value, 10) || 0,
          unit_price: parseFloat(document.getElementById('product-price').value) || 0,
        };
        const req = isEdit ? put('/products/' + productId, payload) : post('/products', payload);
        req
          .then(() => {
            toast(isEdit ? 'Product updated' : 'Product added');
            modal.close();
            loadOwnerBalance();
            loadProducts();
            loadDashboard();
            loadSuppliers();
          })
          .catch((err) => toast(err || 'Failed', 'error'));
      };
    })
    .catch((err) => toast(err || 'Failed to load form data', 'error'));
}

function deleteProduct(id, name) {
  if (!confirm('Delete product "' + name + '"? This cannot be undone.')) return;
  del('/products/' + id)
    .then(() => {
      toast('Product deleted');
      loadProducts();
      loadDashboard();
    })
    .catch((err) => toast(err || 'Delete failed', 'error'));
}

document.getElementById('btn-add-product').addEventListener('click', () => openProductModal());

// Sales list
function loadSales() {
  get('/sales')
    .then((rows) => {
      const container = document.getElementById('sales-list');
      if (!container) return;
      if (rows.length === 0) {
        container.innerHTML = '<p class="empty-state">No sales records.</p>';
        return;
      }
      container.innerHTML =
        '<table class="table">' +
        '<thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Notes</th></tr></thead>' +
        '<tbody>' +
        rows
          .map((r) => {
            const d = r.sale_date ? new Date(r.sale_date).toLocaleString() : '—';
            return '<tr><td>' + d + '</td><td>' + escapeHtml(r.product_name) + '</td><td><code>' + escapeHtml(r.sku || '—') + '</code></td>' +
              '<td class="cell-qty">' + r.quantity + '</td><td>' + formatMoney(r.unit_price) + '</td><td>' + formatMoney(r.total_amount) + '</td>' +
              '<td>' + escapeHtml(r.notes || '—') + '</td></tr>';
          })
          .join('') +
        '</tbody></table>';
    })
    .catch(() => {
      const c = document.getElementById('sales-list');
      if (c) c.innerHTML = '<p class="empty-state">Failed to load sales.</p>';
    });
}

// Purchases list
function loadPurchases() {
  get('/purchases')
    .then((rows) => {
      const container = document.getElementById('purchases-list');
      if (!container) return;
      if (rows.length === 0) {
        container.innerHTML = '<p class="empty-state">No purchase records.</p>';
        return;
      }
      container.innerHTML =
        '<table class="table">' +
        '<thead><tr><th>Date</th><th>Product</th><th>SKU</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Notes</th></tr></thead>' +
        '<tbody>' +
        rows
          .map((r) => {
            const d = r.purchase_date ? new Date(r.purchase_date).toLocaleString() : '—';
            return '<tr><td>' + d + '</td><td>' + escapeHtml(r.product_name) + '</td><td><code>' + escapeHtml(r.sku || '—') + '</code></td>' +
              '<td class="cell-qty">' + r.quantity + '</td><td>' + formatMoney(r.unit_price) + '</td><td>' + formatMoney(r.total_amount) + '</td>' +
              '<td>' + escapeHtml(r.notes || '—') + '</td></tr>';
          })
          .join('') +
        '</tbody></table>';
    })
    .catch(() => {
      const c = document.getElementById('purchases-list');
      if (c) c.innerHTML = '<p class="empty-state">Failed to load purchases.</p>';
    });
}

// Categories
function loadCategories() {
  get('/categories')
    .then((rows) => {
      const tbody = document.querySelector('#categories-table tbody');
      if (!tbody) return;
      tbody.innerHTML = rows
        .map(
          (c) =>
            '<tr><td>' + escapeHtml(c.name) + '</td><td>' + escapeHtml(c.description || '—') + '</td><td>' +
            '<button type="button" class="btn btn-secondary btn-sm btn-edit-cat" data-id="' + c.id + '">Edit</button> ' +
            '<button type="button" class="btn btn-danger btn-sm btn-delete-cat" data-id="' + c.id + '" data-name="' + escapeAttr(c.name) + '">Delete</button></td></tr>'
        )
        .join('');
      tbody.querySelectorAll('.btn-edit-cat').forEach((b) => {
        b.onclick = () => openCategoryModal(parseInt(b.dataset.id, 10));
      });
      tbody.querySelectorAll('.btn-delete-cat').forEach((b) => {
        b.onclick = () => deleteCategory(parseInt(b.dataset.id, 10), b.dataset.name);
      });
    })
    .catch((err) => toast(err || 'Failed to load categories', 'error'));
}

function openCategoryModal(categoryId = null) {
  const isEdit = categoryId != null;
  const content =
    '<div class="form-group"><label>Name *</label><input type="text" id="category-name" required></div>' +
    '<div class="form-group"><label>Description</label><textarea id="category-desc"></textarea></div>' +
    '<div class="form-actions">' +
    '<button type="button" class="btn btn-secondary" data-close>Cancel</button>' +
    '<button type="button" class="btn btn-primary" id="category-save">' + (isEdit ? 'Update' : 'Add') + ' Category</button></div>';
  modal.open(isEdit ? 'Edit Category' : 'Add Category', content);
  modal.body.querySelector('[data-close]').onclick = () => modal.close();
  if (isEdit) {
    get('/categories/' + categoryId).then((c) => {
      document.getElementById('category-name').value = c.name || '';
      document.getElementById('category-desc').value = c.description || '';
    });
  }
  modal.body.querySelector('#category-save').onclick = () => {
    const name = document.getElementById('category-name').value.trim();
    if (!name) { toast('Category name is required', 'error'); return; }
    const payload = { name, description: document.getElementById('category-desc').value.trim() || undefined };
    const req = isEdit ? put('/categories/' + categoryId, payload) : post('/categories', payload);
    req.then(() => { toast(isEdit ? 'Category updated' : 'Category added'); modal.close(); loadCategories(); }).catch((err) => toast(err || 'Failed', 'error'));
  };
}

function deleteCategory(id, name) {
  if (!confirm('Delete category "' + name + '"?')) return;
  del('/categories/' + id).then(() => { toast('Category deleted'); loadCategories(); }).catch((err) => toast(err || 'Delete failed', 'error'));
}

document.getElementById('btn-add-category').addEventListener('click', () => openCategoryModal());

// Suppliers
function loadSuppliers() {
  get('/suppliers')
    .then((rows) => {
      const tbody = document.querySelector('#suppliers-table tbody');
      if (!tbody) return;
      tbody.innerHTML = rows
        .map(
          (s) =>
            '<tr><td>' + escapeHtml(s.name) + '</td><td>' + formatMoney(s.balance) + '</td><td>' + escapeHtml(s.contact || '—') + '</td><td>' + escapeHtml(s.email || '—') + '</td><td>' + escapeHtml(s.address || '—') + '</td><td>' +
            '<button type="button" class="btn btn-secondary btn-sm btn-edit-sup" data-id="' + s.id + '">Edit</button> ' +
            '<button type="button" class="btn btn-danger btn-sm btn-delete-sup" data-id="' + s.id + '" data-name="' + escapeAttr(s.name) + '">Delete</button></td></tr>'
        )
        .join('');
      tbody.querySelectorAll('.btn-edit-sup').forEach((b) => { b.onclick = () => openSupplierModal(parseInt(b.dataset.id, 10)); });
      tbody.querySelectorAll('.btn-delete-sup').forEach((b) => { b.onclick = () => deleteSupplier(parseInt(b.dataset.id, 10), b.dataset.name); });
    })
    .catch((err) => toast(err || 'Failed to load suppliers', 'error'));
}

function updateUserProfile() {
  const user = localStorage.getItem('user');
  if (!user) return;
  try {
    const parsed = JSON.parse(user);
    const initials = parsed.full_name ? parsed.full_name.trim().charAt(0).toUpperCase() : 'U';
    const name = parsed.full_name || 'User';
    const email = parsed.email || 'user@example.com';
    document.querySelectorAll('.user-avatar').forEach((el) => { el.textContent = initials; });
    document.querySelectorAll('.user-name').forEach((el) => { el.textContent = name; });
    document.querySelectorAll('.user-email').forEach((el) => { el.textContent = email; });
    document.querySelectorAll('.bottom-nav-avatar').forEach((el) => { el.textContent = initials; });
  } catch {
    // ignore parsing errors
  }
}

function openSupplierModal(supplierId = null) {
  const isEdit = supplierId != null;
  const content =
    '<div class="form-group"><label>Name *</label><input type="text" id="supplier-name" required></div>' +
    '<div class="form-group"><label>Contact</label><input type="text" id="supplier-contact"></div>' +
    '<div class="form-group"><label>Email</label><input type="email" id="supplier-email"></div>' +
    '<div class="form-group"><label>Address</label><textarea id="supplier-address"></textarea></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Cancel</button>' +
    '<button type="button" class="btn btn-primary" id="supplier-save">' + (isEdit ? 'Update' : 'Add') + ' Supplier</button></div>';
  modal.open(isEdit ? 'Edit Supplier' : 'Add Supplier', content);
  modal.body.querySelector('[data-close]').onclick = () => modal.close();
  if (isEdit) {
    get('/suppliers/' + supplierId).then((s) => {
      document.getElementById('supplier-name').value = s.name || '';
      document.getElementById('supplier-contact').value = s.contact || '';
      document.getElementById('supplier-email').value = s.email || '';
      document.getElementById('supplier-address').value = s.address || '';
    });
  }
  modal.body.querySelector('#supplier-save').onclick = () => {
    const name = document.getElementById('supplier-name').value.trim();
    if (!name) { toast('Supplier name is required', 'error'); return; }
    const payload = {
      name,
      contact: document.getElementById('supplier-contact').value.trim() || undefined,
      email: document.getElementById('supplier-email').value.trim() || undefined,
      address: document.getElementById('supplier-address').value.trim() || undefined,
    };
    const req = isEdit ? put('/suppliers/' + supplierId, payload) : post('/suppliers', payload);
    req.then(() => { toast(isEdit ? 'Supplier updated' : 'Supplier added'); modal.close(); loadSuppliers(); }).catch((err) => toast(err || 'Failed', 'error'));
  };
}

function deleteSupplier(id, name) {
  if (!confirm('Delete supplier "' + name + '"?')) return;
  del('/suppliers/' + id).then(() => { toast('Supplier deleted'); loadSuppliers(); }).catch((err) => toast(err || 'Delete failed', 'error'));
}

document.getElementById('btn-add-supplier').addEventListener('click', () => openSupplierModal());

// Standalone reports view
document.querySelectorAll('#view-reports .report-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#view-reports .report-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    loadReport(tab.dataset.report, 'report-content-standalone');
  });
});

// Initial load
if (!localStorage.getItem('user')) {
  window.location.href = '/login.html';
} else {
  switchView('dashboard');
}
