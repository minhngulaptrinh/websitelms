import { icon } from './icons.js';

export const app = document.getElementById('app');

export function qs(selector, root = document) {
  return root.querySelector(selector);
}

export function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

export function setGlobalLoading(active) {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.toggle('show', active);
}

export function mount(html) {
  app.innerHTML = html;
}

export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    el.style.opacity = '0';
    el.style.transform = 'translateX(24px)';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

export function friendlyError(error) {
  const message = (error && (error.message || error.error_description)) || String(error);
  const map = {
    NOT_AUTHORIZED: 'Bạn không có quyền thực hiện thao tác này.',
    INVALID_ROLE: 'Vai trò không hợp lệ.',
    'Failed to fetch': 'Lỗi kết nối mạng. Vui lòng kiểm tra đường truyền và thử lại.',
  };
  if (map[message]) return map[message];
  if (message.includes('duplicate key') && message.includes('users_email')) {
    return 'Email này đã được sử dụng.';
  }
  if (message.includes('duplicate key')) {
    return 'Dữ liệu đã tồn tại.';
  }
  return message;
}

export function openModal(innerHtml, options = {}) {
  closeModal();
  const width = options.width || 'max-w-lg';
  const wrapper = document.createElement('div');
  wrapper.id = 'app-modal';
  wrapper.className =
    'fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-ink/55 backdrop-blur-sm p-4 py-10';
  wrapper.innerHTML = `
    <div class="modal-scroll w-full ${width} rounded-2xl border border-ink/8 bg-white shadow-lift fade-in">
      ${innerHtml}
    </div>`;
  wrapper.addEventListener('mousedown', (e) => {
    if (e.target === wrapper) closeModal();
  });
  document.body.appendChild(wrapper);
  return wrapper;
}

export function closeModal() {
  const existing = document.getElementById('app-modal');
  if (existing) existing.remove();
}

export function confirmDialog(message, options = {}) {
  return new Promise((resolve) => {
    const modal = openModal(
      `<div class="p-6">
        <h3 class="text-lg font-semibold text-slate-800">${escapeHtml(options.title || 'Xác nhận')}</h3>
        <p class="mt-2 text-sm text-slate-600">${escapeHtml(message)}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button data-act="cancel" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button data-act="ok" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">${escapeHtml(options.confirmText || 'Xác nhận')}</button>
        </div>
      </div>`,
      { width: 'max-w-md' }
    );
    modal.querySelector('[data-act="cancel"]').addEventListener('click', () => {
      closeModal();
      resolve(false);
    });
    modal.querySelector('[data-act="ok"]').addEventListener('click', () => {
      closeModal();
      resolve(true);
    });
  });
}

export function spinnerButton(label) {
  return `<span class="spinner-sm"></span><span>${escapeHtml(label)}</span>`;
}

export function emptyState(title, subtitle, iconName = 'sparkle') {
  return `
    <div class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/12 bg-white/50 px-6 py-14 text-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper-200 text-brand-700">${icon(iconName, 'h-7 w-7')}</div>
      <p class="mt-4 text-base font-semibold text-ink">${escapeHtml(title)}</p>
      <p class="mt-1 max-w-sm text-sm text-ink/55">${escapeHtml(subtitle)}</p>
    </div>`;
}

export function skeletonCards(count = 3) {
  return `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${Array.from({ length: count })
    .map(
      () => `<div class="animate-pulse rounded-2xl border border-ink/8 bg-white p-5 shadow-card">
        <div class="h-4 w-2/3 rounded bg-paper-200"></div>
        <div class="mt-3 h-3 w-1/2 rounded bg-paper-100"></div>
        <div class="mt-6 h-8 w-full rounded bg-paper-100"></div>
      </div>`
    )
    .join('')}</div>`;
}
