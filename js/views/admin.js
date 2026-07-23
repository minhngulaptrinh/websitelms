import { getCurrentUser } from '../auth.js';
import { renderShell, setViewContent } from '../layout.js';
import {
  qs,
  qsa,
  toast,
  friendlyError,
  escapeHtml,
  formatDate,
  openModal,
  closeModal,
  confirmDialog,
  emptyState,
  spinnerButton,
  skeletonCards,
} from '../ui.js';
import { listUsers, createUser, deleteUser, resetPassword, getDirectory } from '../api/users.js';
import { listAllClasses, deleteClass, countStudents } from '../api/classes.js';
import { icon } from '../icons.js';

export async function AdminDashboard() {
  renderShell({ active: '#/admin', title: 'Tổng quan hệ thống', content: skeletonCards(4) });
  const actor = getCurrentUser();
  try {
    const [teachers, students, classes] = await Promise.all([
      listUsers(actor.id, 'teacher'),
      listUsers(actor.id, 'student'),
      listAllClasses(),
    ]);
    const cards = [
      { label: 'Giáo viên', value: teachers.length, icon: 'board', href: '#/admin/teachers', tint: 'bg-brand-50 text-brand-700' },
      { label: 'Học sinh', value: students.length, icon: 'graduation', href: '#/admin/students', tint: 'bg-emerald-50 text-emerald-700' },
      { label: 'Lớp học', value: classes.length, icon: 'school', href: '#/admin/classes', tint: 'bg-accent-50 text-accent-700' },
      { label: 'Tài khoản', value: teachers.length + students.length + 1, icon: 'users', href: '#/admin/teachers', tint: 'bg-terra-500/10 text-terra-600' },
    ];
    setViewContent(`
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        ${cards
          .map(
            (c) => `<a href="${c.href}" class="group rounded-2xl border border-ink/8 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lift">
              <div class="flex items-center justify-between">
                <span class="flex h-12 w-12 items-center justify-center rounded-xl ${c.tint}">${icon(c.icon, 'h-6 w-6')}</span>
                <span class="font-display text-4xl font-bold text-ink">${c.value}</span>
              </div>
              <p class="mt-4 text-sm font-medium text-ink/55">${c.label}</p>
            </a>`
          )
          .join('')}
      </div>
      <div class="mt-8 rounded-2xl border border-ink/8 bg-white p-6 shadow-card">
        <h2 class="font-display text-xl font-bold text-ink">Bắt đầu nhanh</h2>
        <ul class="mt-4 space-y-3 text-sm text-ink/70">
          <li class="flex gap-3"><span class="font-bold text-accent-600">1.</span> Tạo tài khoản <a href="#/admin/teachers" class="font-semibold text-brand-700 underline">Giáo viên</a> và cấp thông tin đăng nhập.</li>
          <li class="flex gap-3"><span class="font-bold text-accent-600">2.</span> Tạo tài khoản <a href="#/admin/students" class="font-semibold text-brand-700 underline">Học sinh</a>.</li>
          <li class="flex gap-3"><span class="font-bold text-accent-600">3.</span> Giáo viên đăng nhập, tạo lớp và chia sẻ mã lớp cho học sinh.</li>
        </ul>
      </div>
    `);
  } catch (error) {
    setViewContent(errorPanel(error));
  }
}

export async function AdminTeachers() {
  await renderUserManager({
    role: 'teacher',
    active: '#/admin/teachers',
    title: 'Quản lý giáo viên',
    labelSingular: 'giáo viên',
  });
}

export async function AdminStudents() {
  await renderUserManager({
    role: 'student',
    active: '#/admin/students',
    title: 'Quản lý học sinh',
    labelSingular: 'học sinh',
  });
}

async function renderUserManager({ role, active, title, labelSingular }) {
  renderShell({ active, title, content: skeletonCards(3) });
  const actor = getCurrentUser();

  async function refresh() {
    setViewContent(skeletonCards(3));
    try {
      const users = await listUsers(actor.id, role);
      renderList(users);
    } catch (error) {
      setViewContent(errorPanel(error));
    }
  }

  function renderList(users) {
    const rows =
      users.length === 0
        ? `<tr><td colspan="4" class="px-4 py-10">${emptyState(
            `Chưa có ${labelSingular}`,
            `Nhấn "Thêm ${labelSingular}" để tạo tài khoản mới.`,
            'users'
          )}</td></tr>`
        : users
            .map(
              (u) => `<tr class="border-t border-slate-100 hover:bg-slate-50">
                <td class="px-4 py-3">
                  <p class="font-semibold text-slate-800">${escapeHtml(u.name)}</p>
                  <p class="text-xs text-slate-500">${escapeHtml(u.email)}</p>
                </td>
                <td class="px-4 py-3 text-sm text-slate-500">${formatDate(u.created_at)}</td>
                <td class="px-4 py-3 text-right">
                  <button data-reset="${u.id}" data-name="${escapeHtml(u.name)}" class="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50">Đổi mật khẩu</button>
                  <button data-del="${u.id}" data-name="${escapeHtml(u.name)}" class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Xoá</button>
                </td>
              </tr>`
            )
            .join('');

    setViewContent(`
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-500">Tổng cộng <b class="text-slate-700">${users.length}</b> ${labelSingular}.</p>
        <button id="add-user" class="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">+ Thêm ${labelSingular}</button>
      </div>
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[520px] text-left">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Tài khoản</th>
                <th class="px-4 py-3">Ngày tạo</th>
                <th class="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `);

    qs('#add-user').addEventListener('click', () => openCreateModal());
    qsa('[data-del]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const ok = await confirmDialog(
          `Xoá tài khoản "${btn.dataset.name}"? Mọi dữ liệu liên quan sẽ bị xoá.`,
          { title: `Xoá ${labelSingular}`, confirmText: 'Xoá' }
        );
        if (!ok) return;
        try {
          await deleteUser(actor.id, btn.dataset.del);
          toast('Đã xoá tài khoản.', 'success');
          refresh();
        } catch (error) {
          toast(friendlyError(error), 'error');
        }
      })
    );
    qsa('[data-reset]').forEach((btn) =>
      btn.addEventListener('click', () => openResetModal(btn.dataset.reset, btn.dataset.name))
    );
  }

  function openCreateModal() {
    const modal = openModal(`
      <form id="create-form" class="p-6">
        <h3 class="text-lg font-bold text-slate-800">Thêm ${labelSingular}</h3>
        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
            <input id="f-name" required class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Email đăng nhập</label>
            <input id="f-email" type="email" required class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu</label>
            <div class="flex gap-2">
              <input id="f-pass" required minlength="6" class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
              <button type="button" id="gen-pass" class="whitespace-nowrap rounded-xl border border-slate-300 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50">Tạo ngẫu nhiên</button>
            </div>
            <p class="mt-1 text-xs text-slate-400">Tối thiểu 6 ký tự. Hãy lưu lại để cấp cho ${labelSingular}.</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button id="create-btn" type="submit" class="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Tạo tài khoản</button>
        </div>
      </form>
    `);

    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    modal.querySelector('#gen-pass').addEventListener('click', () => {
      modal.querySelector('#f-pass').value = Math.random().toString(36).slice(2, 10);
    });
    modal.querySelector('#create-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#create-btn');
      btn.disabled = true;
      btn.innerHTML = spinnerButton('Đang tạo...');
      try {
        await createUser(actor.id, {
          name: modal.querySelector('#f-name').value,
          email: modal.querySelector('#f-email').value,
          password: modal.querySelector('#f-pass').value,
          role,
        });
        closeModal();
        toast(`Đã tạo tài khoản ${labelSingular}.`, 'success');
        refresh();
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Tạo tài khoản';
        toast(friendlyError(error), 'error');
      }
    });
  }

  function openResetModal(userId, name) {
    const modal = openModal(`
      <form id="reset-form" class="p-6">
        <h3 class="text-lg font-bold text-slate-800">Đổi mật khẩu</h3>
        <p class="mt-1 text-sm text-slate-500">Cho tài khoản <b>${escapeHtml(name)}</b></p>
        <div class="mt-5">
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
          <input id="r-pass" required minlength="6" class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button id="reset-btn" type="submit" class="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Cập nhật</button>
        </div>
      </form>
    `, { width: 'max-w-md' });

    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    modal.querySelector('#reset-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#reset-btn');
      btn.disabled = true;
      btn.innerHTML = spinnerButton('Đang lưu...');
      try {
        await resetPassword(actor.id, userId, modal.querySelector('#r-pass').value);
        closeModal();
        toast('Đã cập nhật mật khẩu.', 'success');
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Cập nhật';
        toast(friendlyError(error), 'error');
      }
    });
  }

  await refresh();
}

export async function AdminClasses() {
  renderShell({ active: '#/admin/classes', title: 'Tất cả lớp học', content: skeletonCards(3) });
  try {
    const [classes, directory] = await Promise.all([listAllClasses(), getDirectory()]);
    const counts = await Promise.all(classes.map((c) => countStudents(c.id)));

    const content =
      classes.length === 0
        ? emptyState('Chưa có lớp học nào', 'Giáo viên tạo lớp học sau khi đăng nhập.', 'school')
        : `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            ${classes
              .map((c, i) => {
                const teacher = directory.get(c.teacher_id);
                return `<div class="flex flex-col rounded-2xl border border-ink/8 bg-white p-5 shadow-card">
                  <div class="flex items-start justify-between">
                    <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">${icon('school', 'h-5 w-5')}</span>
                    <span class="rounded-full bg-paper-100 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-ink/60">${escapeHtml(c.class_code)}</span>
                  </div>
                  <h3 class="mt-4 text-base font-bold text-ink">${escapeHtml(c.class_name)}</h3>
                  <p class="mt-1 text-sm text-ink/55">GV: ${escapeHtml(teacher ? teacher.name : 'Không rõ')}</p>
                  <div class="mt-4 flex items-center justify-between border-t border-ink/8 pt-4 text-sm text-ink/55">
                    <span class="inline-flex items-center gap-1.5">${icon('users', 'h-4 w-4')} ${counts[i]} học sinh</span>
                    <button data-del="${c.id}" data-name="${escapeHtml(c.class_name)}" class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Xoá lớp</button>
                  </div>
                </div>`;
              })
              .join('')}
          </div>`;

    setViewContent(content);
    qsa('[data-del]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        const ok = await confirmDialog(`Xoá lớp "${btn.dataset.name}" cùng toàn bộ bài giảng, bài tập và điểm?`, {
          title: 'Xoá lớp học',
          confirmText: 'Xoá',
        });
        if (!ok) return;
        try {
          await deleteClass(btn.dataset.del);
          toast('Đã xoá lớp học.', 'success');
          AdminClasses();
        } catch (error) {
          toast(friendlyError(error), 'error');
        }
      })
    );
  } catch (error) {
    setViewContent(errorPanel(error));
  }
}

function errorPanel(error) {
  return `<div class="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
    <span class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">${icon('alert', 'h-6 w-6')}</span>
    <p class="mt-3 font-semibold text-red-700">Không tải được dữ liệu</p>
    <p class="mt-1 text-sm text-red-600">${escapeHtml(friendlyError(error))}</p>
    <button onclick="location.reload()" class="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Tải lại</button>
  </div>`;
}
