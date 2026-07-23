import { getCurrentUser, logout } from './auth.js';
import { mount, qs, qsa, escapeHtml } from './ui.js';
import { icon } from './icons.js';

const NAV = {
  admin: [
    { href: '#/admin', label: 'Tổng quan', icon: 'grid' },
    { href: '#/admin/teachers', label: 'Giáo viên', icon: 'board' },
    { href: '#/admin/students', label: 'Học sinh', icon: 'graduation' },
    { href: '#/admin/classes', label: 'Tất cả lớp học', icon: 'school' },
  ],
  teacher: [{ href: '#/teacher', label: 'Lớp học của tôi', icon: 'book' }],
  student: [{ href: '#/student', label: 'Lớp học của tôi', icon: 'book' }],
};

const ROLE_LABEL = {
  admin: 'Quản trị viên',
  teacher: 'Giáo viên',
  student: 'Học sinh',
};

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function renderShell({ active, title, content }) {
  const user = getCurrentUser();
  const links = (NAV[user.role] || [])
    .map((item) => {
      const isActive = item.href === active;
      return `<a href="${item.href}" class="nav-link ${isActive ? 'active' : ''} flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-brand-100 transition hover:bg-white/10 hover:text-white">
        ${icon(item.icon, 'h-5 w-5')}
        <span>${item.label}</span>
      </a>`;
    })
    .join('');

  mount(`
    <div class="flex min-h-screen">
      <div id="sidebar-overlay" class="fixed inset-0 z-30 hidden bg-ink/50 md:hidden"></div>
      <aside id="sidebar" class="sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col overflow-y-auto bg-brand-900 px-4 py-6 transition-transform duration-200 md:static md:translate-x-0">
        <a href="#/home" class="flex items-center gap-3 px-2">
          <span class="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-lg font-bold text-white">M<img src="./assets/logo.png" alt="Logo" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" /></span>
          <div>
            <p class="font-display text-base font-bold text-white">Học toán cùng Minh</p>
            <p class="text-xs text-brand-200">Hệ thống học tập</p>
          </div>
        </a>
        <nav class="mt-8 flex flex-1 flex-col gap-1">${links}</nav>
        <div class="mt-4 rounded-2xl bg-white/5 p-3">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">${escapeHtml(initials(user.name))}</div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-white">${escapeHtml(user.name)}</p>
              <p class="truncate text-xs text-brand-200">${ROLE_LABEL[user.role]}</p>
            </div>
          </div>
          <button id="logout-btn" class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20">${icon('logout', 'h-4 w-4')} Đăng xuất</button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-paper-50/90 px-4 py-3.5 backdrop-blur md:px-8">
          <div class="flex items-center gap-3">
            <button id="sidebar-toggle" class="rounded-lg p-2 text-ink/70 hover:bg-ink/5 md:hidden" aria-label="Menu">${icon('menu', 'h-5 w-5')}</button>
            <h1 class="font-display text-xl font-bold text-ink md:text-2xl">${escapeHtml(title)}</h1>
          </div>
          <div class="hidden items-center gap-2 rounded-full border border-brand-200/60 bg-white px-4 py-1.5 text-sm font-medium text-brand-800 sm:flex">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            ${ROLE_LABEL[user.role]}
          </div>
        </header>
        <main id="view-content" class="fade-in flex-1 px-4 py-6 md:px-8 md:py-8"></main>
      </div>
    </div>
  `);

  qs('#view-content').innerHTML = content;

  qs('#logout-btn').addEventListener('click', logout);

  const sidebar = qs('#sidebar');
  const overlay = qs('#sidebar-overlay');
  const toggle = qs('#sidebar-toggle');
  const openSidebar = () => {
    sidebar.classList.remove('-translate-x-full');
    overlay.classList.remove('hidden');
  };
  const closeSidebar = () => {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  };
  toggle.addEventListener('click', openSidebar);
  overlay.addEventListener('click', closeSidebar);
  qsa('#sidebar .nav-link').forEach((link) => link.addEventListener('click', closeSidebar));
}

export function setViewContent(html) {
  const el = qs('#view-content');
  if (el) el.innerHTML = html;
}
