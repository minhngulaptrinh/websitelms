import { login, homeRouteFor } from '../auth.js';
import { mount, qs, toast, friendlyError, escapeHtml, spinnerButton } from '../ui.js';
import { isConfigured } from '../config.js';
import { icon } from '../icons.js';

export async function LoginView() {
  const configWarning = isConfigured()
    ? ''
    : `<div class="mb-5 rounded-xl border border-accent-300 bg-accent-50 px-4 py-3 text-sm text-accent-800">
        Chưa cấu hình Supabase. Mở <b>js/config.js</b> và điền <b>SUPABASE_URL</b> cùng <b>SUPABASE_ANON_KEY</b>.
      </div>`;

  const highlights = [
    ['book', 'Bài giảng &amp; đề thi PDF, kèm công thức LaTeX'],
    ['checkCircle', 'Trắc nghiệm tự chấm điểm tức thì'],
    ['chart', 'Theo dõi tiến bộ theo từng bài'],
  ];

  mount(`
    <div class="flex min-h-screen bg-paper">
      <div class="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 to-brand-700 p-12 text-white lg:flex">
        <div class="paper-grain pointer-events-none absolute inset-0 opacity-40"></div>
        <div class="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl"></div>
        <div class="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-500/40 blur-3xl"></div>
        <a href="#/home" class="relative flex items-center gap-3">
          <span class="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-lg font-bold">M<img src="./assets/logo.png" alt="Logo" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" /></span>
          <span class="font-display text-xl font-bold">Học toán cùng Minh</span>
        </a>
        <div class="relative">
          <span class="text-accent-300">${icon('quote', 'h-10 w-10')}</span>
          <h2 class="mt-4 font-display text-4xl font-bold leading-tight">Mỗi bài Toán,<br/>một bước tiến.</h2>
          <p class="mt-4 max-w-md text-brand-100">Nền tảng dạy và học Toán trực tuyến dành cho giáo viên và học sinh Việt Nam.</p>
          <ul class="mt-8 space-y-3">
            ${highlights
              .map(
                ([ic, text]) => `<li class="flex items-center gap-3 text-sm text-brand-50"><span class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-accent-200">${icon(ic, 'h-4 w-4')}</span>${text}</li>`
              )
              .join('')}
          </ul>
        </div>
        <p class="relative text-xs text-brand-300">© 2026 Học toán cùng Minh</p>
      </div>

      <div class="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div class="w-full max-w-md">
          <div class="mb-8 flex items-center justify-between">
            <a href="#/home" class="flex items-center gap-2.5 lg:hidden">
              <span class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-900 text-lg font-bold text-white">M<img src="./assets/logo.png" alt="Logo" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" /></span>
              <span class="font-display text-lg font-bold text-ink">Học toán cùng Minh</span>
            </a>
            <a href="#/home" class="ml-auto inline-flex items-center gap-1 text-sm font-medium text-ink/50 transition hover:text-ink">← Về trang chủ</a>
          </div>
          <div class="rounded-3xl border border-ink/8 bg-white p-8 shadow-card">
            <h1 class="font-display text-3xl font-bold text-ink">Đăng nhập</h1>
            <p class="mt-2 text-sm text-ink/55">Sử dụng tài khoản được cấp bởi quản trị viên.</p>
            <div class="mt-6">${configWarning}</div>
            <form id="login-form" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-ink/80">Email</label>
                <input id="email" type="email" required autocomplete="username" placeholder="ban@vidu.com"
                  class="w-full rounded-xl border border-ink/15 bg-paper-50 px-4 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-ink/80">Mật khẩu</label>
                <div class="relative">
                  <input id="password" type="password" required autocomplete="current-password" placeholder="••••••••"
                    class="w-full rounded-xl border border-ink/15 bg-paper-50 px-4 py-2.5 pr-14 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100" />
                  <button type="button" id="toggle-pass" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand-700">Hiện</button>
                </div>
              </div>
              <button id="submit-btn" type="submit"
                class="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:opacity-60">
                Đăng nhập
              </button>
            </form>
          </div>
          <p class="mt-6 text-center text-xs text-ink/40">Chưa có tài khoản? Liên hệ quản trị viên của trường/trung tâm để được cấp.</p>
        </div>
      </div>
    </div>
  `);

  const form = qs('#login-form');
  const submitBtn = qs('#submit-btn');
  const passInput = qs('#password');

  qs('#toggle-pass').addEventListener('click', () => {
    const showing = passInput.type === 'text';
    passInput.type = showing ? 'password' : 'text';
    qs('#toggle-pass').textContent = showing ? 'Hiện' : 'Ẩn';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('#email').value;
    const password = passInput.value;
    submitBtn.disabled = true;
    submitBtn.innerHTML = spinnerButton('Đang đăng nhập...');
    try {
      const user = await login(email, password);
      toast(`Xin chào, ${escapeHtml(user.name)}!`, 'success');
      window.location.hash = homeRouteFor(user.role);
    } catch (error) {
      toast(friendlyError(error), 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Đăng nhập';
    }
  });
}
