import { getCurrentUser } from '../auth.js';
import { renderShell, setViewContent } from '../layout.js';
import { navigate } from '../router.js';
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
import {
  createClass,
  listClassesByTeacher,
  getClass,
  listStudentsInClass,
  removeStudent,
  countStudents,
} from '../api/classes.js';
import { listLectures, createLecture, deleteLecture } from '../api/lectures.js';
import {
  listQuizzes,
  createQuizWithQuestions,
  setQuizPublished,
  deleteQuiz,
  countQuestions,
  getTeacherQuestions,
} from '../api/quizzes.js';
import { listSubmissionsByQuiz } from '../api/submissions.js';
import { getDirectory } from '../api/users.js';
import { uploadFile } from '../storage.js';
import { renderLectureMedia, contentTypeMeta } from './shared.js';
import { icon } from '../icons.js';

export async function TeacherDashboard() {
  renderShell({ active: '#/teacher', title: 'Lớp học của tôi', content: skeletonCards(3) });
  const actor = getCurrentUser();

  async function refresh() {
    setViewContent(skeletonCards(3));
    try {
      const classes = await listClassesByTeacher(actor.id);
      const counts = await Promise.all(classes.map((c) => countStudents(c.id)));
      render(classes, counts);
    } catch (error) {
      toast(friendlyError(error), 'error');
    }
  }

  function render(classes, counts) {
    const grid =
      classes.length === 0
        ? emptyState('Bạn chưa có lớp học nào', 'Tạo lớp học đầu tiên và chia sẻ mã lớp cho học sinh.', 'school')
        : `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            ${classes
              .map(
                (c, i) => `<a href="#/teacher/class/${c.id}" class="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div class="flex items-start justify-between">
                    <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">${icon('school', 'h-5 w-5')}</span>
                    <span class="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold tracking-wider text-slate-600">${escapeHtml(c.class_code)}</span>
                  </div>
                  <h3 class="mt-4 text-base font-bold text-slate-800 group-hover:text-brand-700">${escapeHtml(c.class_name)}</h3>
                  <p class="mt-1 text-sm text-slate-500">Tạo ngày ${formatDate(c.created_at)}</p>
                  <div class="mt-4 flex items-center gap-1.5 border-t border-ink/8 pt-4 text-sm text-ink/55">${icon('users', 'h-4 w-4')} ${counts[i]} học sinh</div>
                </a>`
              )
              .join('')}
          </div>`;

    setViewContent(`
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-500">Bạn đang quản lý <b class="text-slate-700">${classes.length}</b> lớp học.</p>
        <button id="add-class" class="rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800">+ Tạo lớp học mới</button>
      </div>
      ${grid}
    `);

    qs('#add-class').addEventListener('click', openCreateModal);
  }

  function openCreateModal() {
    const modal = openModal(`
      <form id="class-form" class="p-6">
        <h3 class="text-lg font-bold text-slate-800">Tạo lớp học mới</h3>
        <p class="mt-1 text-sm text-slate-500">Mã lớp sẽ được tạo tự động và duy nhất.</p>
        <div class="mt-5">
          <label class="mb-1.5 block text-sm font-medium text-slate-700">Tên lớp / môn học</label>
          <input id="class-name" required placeholder="VD: Toán 12 - Lớp A" class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button id="create-class-btn" type="submit" class="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Tạo lớp</button>
        </div>
      </form>
    `);
    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    modal.querySelector('#class-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#create-class-btn');
      btn.disabled = true;
      btn.innerHTML = spinnerButton('Đang tạo...');
      try {
        const cls = await createClass(actor.id, modal.querySelector('#class-name').value);
        closeModal();
        toast(`Đã tạo lớp. Mã lớp: ${cls.class_code}`, 'success');
        refresh();
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Tạo lớp';
        toast(friendlyError(error), 'error');
      }
    });
  }

  await refresh();
}

export async function TeacherClass({ id }) {
  renderShell({ active: '#/teacher', title: 'Đang tải lớp học...', content: skeletonCards(2) });
  const actor = getCurrentUser();
  const cls = await getClass(id);
  if (!cls || cls.teacher_id !== actor.id) {
    toast('Không tìm thấy lớp học hoặc bạn không có quyền truy cập.', 'error');
    navigate('#/teacher');
    return;
  }

  let activeTab = 'lectures';

  renderShell({
    active: '#/teacher',
    title: cls.class_name,
    content: `
      <a href="#/teacher" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">← Quay lại danh sách lớp</a>
      <div class="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold">${escapeHtml(cls.class_name)}</h2>
            <p class="mt-1 text-sm text-brand-100">Chia sẻ mã lớp để học sinh tham gia</p>
          </div>
          <div class="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2">
            <span class="font-mono text-2xl font-bold tracking-widest">${escapeHtml(cls.class_code)}</span>
            <button id="copy-code" class="rounded-lg bg-white/20 px-3 py-1 text-xs font-medium hover:bg-white/30">Sao chép</button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100" id="tab-nav">
        <button data-tab="lectures" class="tab-btn inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold">${icon('book', 'h-4 w-4')} Bài giảng</button>
        <button data-tab="quizzes" class="tab-btn inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold">${icon('doc', 'h-4 w-4')} Bài tập</button>
        <button data-tab="grades" class="tab-btn inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold">${icon('chart', 'h-4 w-4')} Học sinh & Điểm</button>
      </div>
      <div id="tab-body" class="mt-6"></div>
    `,
  });

  qs('#copy-code').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(cls.class_code);
      toast('Đã sao chép mã lớp.', 'success');
    } catch {
      toast('Không thể sao chép tự động.', 'error');
    }
  });

  function paintTabs() {
    qsa('.tab-btn').forEach((btn) => {
      const on = btn.dataset.tab === activeTab;
      btn.classList.toggle('bg-brand-700', on);
      btn.classList.toggle('text-white', on);
      btn.classList.toggle('text-slate-600', !on);
      btn.classList.toggle('hover:bg-slate-100', !on);
    });
  }

  function switchTab(tab) {
    activeTab = tab;
    paintTabs();
    if (tab === 'lectures') renderLecturesTab();
    else if (tab === 'quizzes') renderQuizzesTab();
    else renderGradesTab();
  }

  qsa('.tab-btn').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  async function renderLecturesTab() {
    const body = qs('#tab-body');
    body.innerHTML = skeletonCards(2);
    try {
      const lectures = await listLectures(cls.id);
      body.innerHTML = `
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-800">Bài giảng lý thuyết</h3>
          <button id="add-lecture" class="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">+ Thêm bài giảng</button>
        </div>
        ${
          lectures.length === 0
            ? emptyState('Chưa có bài giảng', 'Tải PDF, video hoặc nhúng liên kết YouTube/Drive.', 'book')
            : `<div class="space-y-3">${lectures.map(lectureRow).join('')}</div>`
        }`;
      qs('#add-lecture').addEventListener('click', openLectureModal);
      qsa('[data-view-lecture]').forEach((btn) =>
        btn.addEventListener('click', () => openLectureViewer(lectures.find((l) => l.id === btn.dataset.viewLecture)))
      );
      qsa('[data-del-lecture]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog('Xoá bài giảng này?', { title: 'Xoá bài giảng', confirmText: 'Xoá' });
          if (!ok) return;
          try {
            await deleteLecture(btn.dataset.delLecture);
            toast('Đã xoá bài giảng.', 'success');
            renderLecturesTab();
          } catch (error) {
            toast(friendlyError(error), 'error');
          }
        })
      );
    } catch (error) {
      body.innerHTML = '';
      toast(friendlyError(error), 'error');
    }
  }

  function lectureRow(lecture) {
    const meta = contentTypeMeta(lecture.content_type);
    return `<div class="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.tint} text-xl">${meta.icon}</span>
      <div class="min-w-0 flex-1">
        <p class="truncate font-semibold text-slate-800">${escapeHtml(lecture.title)}</p>
        <p class="text-xs text-slate-400">${meta.label} · ${formatDate(lecture.created_at)}</p>
      </div>
      <button data-view-lecture="${lecture.id}" class="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">Xem</button>
      <button data-del-lecture="${lecture.id}" class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Xoá</button>
    </div>`;
  }

  function openLectureViewer(lecture) {
    openModal(`
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">${escapeHtml(lecture.title)}</h3>
          <button data-close class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        ${renderLectureMedia(lecture)}
      </div>
    `, { width: 'max-w-4xl' }).querySelector('[data-close]').addEventListener('click', closeModal);
  }

  function openLectureModal() {
    const modal = openModal(`
      <form id="lecture-form" class="p-6">
        <h3 class="text-lg font-bold text-slate-800">Thêm bài giảng</h3>
        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Tiêu đề</label>
            <input id="lec-title" required placeholder="VD: Chương 1 - Giới hạn" class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Loại nội dung</label>
            <div class="grid grid-cols-3 gap-2" id="lec-type">
              <button type="button" data-type="pdf" class="lec-type-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/15 px-3 py-2 text-sm font-medium">${icon('doc', 'h-4 w-4')} PDF</button>
              <button type="button" data-type="video" class="lec-type-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/15 px-3 py-2 text-sm font-medium">${icon('video', 'h-4 w-4')} Video</button>
              <button type="button" data-type="link" class="lec-type-btn inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink/15 px-3 py-2 text-sm font-medium">${icon('link', 'h-4 w-4')} Liên kết</button>
            </div>
          </div>
          <div id="upload-block">
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Chọn tệp</label>
            <input id="lec-file" type="file" class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700" />
          </div>
          <div id="link-block" class="hidden">
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Dán liên kết (YouTube / Google Drive)</label>
            <input id="lec-link" type="url" placeholder="https://..." class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
        </div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button id="save-lecture" type="submit" class="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Lưu bài giảng</button>
        </div>
      </form>
    `);

    let selectedType = 'pdf';
    const uploadBlock = modal.querySelector('#upload-block');
    const linkBlock = modal.querySelector('#link-block');
    const fileInput = modal.querySelector('#lec-file');

    function paintType() {
      modal.querySelectorAll('.lec-type-btn').forEach((b) => {
        const on = b.dataset.type === selectedType;
        b.classList.toggle('border-brand-600', on);
        b.classList.toggle('bg-brand-50', on);
        b.classList.toggle('text-brand-700', on);
      });
      const isLink = selectedType === 'link';
      linkBlock.classList.toggle('hidden', !isLink);
      uploadBlock.classList.toggle('hidden', isLink);
      fileInput.accept = selectedType === 'pdf' ? 'application/pdf' : selectedType === 'video' ? 'video/*' : '';
    }

    modal.querySelectorAll('.lec-type-btn').forEach((b) =>
      b.addEventListener('click', () => {
        selectedType = b.dataset.type;
        paintType();
      })
    );
    paintType();

    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    modal.querySelector('#lecture-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = modal.querySelector('#save-lecture');
      const title = modal.querySelector('#lec-title').value;
      btn.disabled = true;
      btn.innerHTML = spinnerButton('Đang lưu...');
      try {
        let fileUrl;
        if (selectedType === 'link') {
          fileUrl = modal.querySelector('#lec-link').value.trim();
          if (!fileUrl) throw new Error('Vui lòng dán liên kết.');
        } else {
          const file = fileInput.files[0];
          if (!file) throw new Error('Vui lòng chọn tệp để tải lên.');
          btn.innerHTML = spinnerButton('Đang tải tệp...');
          fileUrl = await uploadFile(file, `class-${cls.id}`);
        }
        await createLecture({ classId: cls.id, title, contentType: selectedType, fileUrl });
        closeModal();
        toast('Đã thêm bài giảng.', 'success');
        renderLecturesTab();
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Lưu bài giảng';
        toast(friendlyError(error), 'error');
      }
    });
  }

  async function renderQuizzesTab() {
    const body = qs('#tab-body');
    body.innerHTML = skeletonCards(2);
    try {
      const quizzes = await listQuizzes(cls.id);
      const stats = await Promise.all(
        quizzes.map(async (q) => ({
          questions: await countQuestions(q.id),
          submissions: (await listSubmissionsByQuiz(q.id)).length,
        }))
      );
      body.innerHTML = `
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-800">Bài tập trắc nghiệm</h3>
          <button id="add-quiz" class="rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">+ Tạo bài tập</button>
        </div>
        ${
          quizzes.length === 0
            ? emptyState('Chưa có bài tập', 'Tạo bài trắc nghiệm với câu hỏi và đáp án đúng.', 'doc')
            : `<div class="space-y-3">${quizzes.map((q, i) => quizRow(q, stats[i])).join('')}</div>`
        }`;
      qs('#add-quiz').addEventListener('click', openQuizBuilder);
      qsa('[data-toggle-quiz]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          try {
            await setQuizPublished(btn.dataset.toggleQuiz, btn.dataset.next === 'true');
            toast(btn.dataset.next === 'true' ? 'Đã hiển thị bài tập cho học sinh.' : 'Đã ẩn bài tập.', 'success');
            renderQuizzesTab();
          } catch (error) {
            toast(friendlyError(error), 'error');
          }
        })
      );
      qsa('[data-results-quiz]').forEach((btn) =>
        btn.addEventListener('click', () => openQuizResults(btn.dataset.resultsQuiz, btn.dataset.title))
      );
      qsa('[data-del-quiz]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          const ok = await confirmDialog('Xoá bài tập cùng toàn bộ câu hỏi và kết quả?', {
            title: 'Xoá bài tập',
            confirmText: 'Xoá',
          });
          if (!ok) return;
          try {
            await deleteQuiz(btn.dataset.delQuiz);
            toast('Đã xoá bài tập.', 'success');
            renderQuizzesTab();
          } catch (error) {
            toast(friendlyError(error), 'error');
          }
        })
      );
    } catch (error) {
      body.innerHTML = '';
      toast(friendlyError(error), 'error');
    }
  }

  function quizRow(quiz, stat) {
    const badge = quiz.is_published
      ? '<span class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Đang hiển thị</span>'
      : '<span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Bản nháp</span>';
    return `<div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <p class="truncate font-semibold text-slate-800">${escapeHtml(quiz.title)}</p>
            ${badge}
          </div>
          <p class="mt-1 text-xs text-ink/45">${stat.questions} câu · ${stat.submissions} lượt nộp${quiz.pdf_url ? ' · Đề PDF' : ''} · ${formatDate(quiz.created_at)}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button data-results-quiz="${quiz.id}" data-title="${escapeHtml(quiz.title)}" class="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">Kết quả</button>
          <button data-toggle-quiz="${quiz.id}" data-next="${(!quiz.is_published).toString()}" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">${quiz.is_published ? 'Ẩn' : 'Hiển thị'}</button>
          <button data-del-quiz="${quiz.id}" class="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Xoá</button>
        </div>
      </div>
    </div>`;
  }

  function openQuizBuilder() {
    const modal = openModal(`
      <form id="quiz-form" class="p-6">
        <h3 class="text-lg font-bold text-slate-800">Tạo bài tập trắc nghiệm</h3>
        <p class="mt-1 text-sm text-slate-500">Tải lên PDF đề bài, rồi với mỗi câu chọn đáp án đúng để hệ thống tự chấm.</p>
        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">Tiêu đề bài tập</label>
            <input id="quiz-title" required placeholder="VD: Kiểm tra 15 phút - Chương 1" class="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">File PDF đề bài</label>
            <input id="quiz-pdf" type="file" accept="application/pdf" required class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand-700" />
            <p class="mt-1 text-xs text-slate-400">Đề bài và các phương án A/B/C/D nằm trong file này (học sinh sẽ đọc trực tiếp).</p>
          </div>
          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input id="quiz-publish" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
            Hiển thị ngay cho học sinh
          </label>
        </div>
        <div class="mt-5 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-slate-700">Đáp án từng câu</h4>
          <button type="button" id="add-question" class="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">+ Thêm câu</button>
        </div>
        <p class="mt-1 text-xs text-slate-400">Bắt buộc chọn đáp án đúng. Nội dung phương án có thể để trống (đã có trong PDF) hoặc gõ vào, hỗ trợ LaTeX như <span class="font-mono">$x^2$</span>.</p>
        <div id="questions" class="mt-3 space-y-4"></div>
        <div class="mt-6 flex justify-end gap-3">
          <button type="button" data-close class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Huỷ</button>
          <button id="save-quiz" type="submit" class="flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Lưu bài tập</button>
        </div>
      </form>
    `, { width: 'max-w-2xl' });

    const questionsWrap = modal.querySelector('#questions');

    function optionInput(letter, field) {
      return `<label class="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
        <input type="radio" data-correct value="${letter}" class="h-4 w-4 text-brand-600" />
        <span class="w-4 text-sm font-bold text-slate-500">${letter}</span>
        <input data-field="${field}" placeholder="Nội dung ${letter} (tuỳ chọn)" class="w-full border-0 p-0 text-sm outline-none placeholder:text-slate-300" />
      </label>`;
    }

    function addQuestion() {
      const uid = crypto.randomUUID();
      const row = document.createElement('div');
      row.className = 'question-row rounded-xl border border-slate-200 bg-slate-50/60 p-4';
      row.dataset.uid = uid;
      row.innerHTML = `
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-700">Câu <span class="q-num"></span></span>
          <button type="button" data-remove class="text-xs font-medium text-red-600 hover:underline">Xoá</button>
        </div>
        <textarea data-field="question_text" rows="2" placeholder="Nội dung câu hỏi (tuỳ chọn, hỗ trợ LaTeX)" class="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"></textarea>
        <p class="mt-3 text-xs font-medium text-slate-500">Chọn nút tròn ở đáp án đúng (bắt buộc):</p>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          ${optionInput('A', 'option_a')}
          ${optionInput('B', 'option_b')}
          ${optionInput('C', 'option_c')}
          ${optionInput('D', 'option_d')}
        </div>`;
      row.querySelectorAll('[data-correct]').forEach((r) => (r.name = `correct-${uid}`));
      row.querySelector('[data-remove]').addEventListener('click', () => {
        row.remove();
        renumber();
      });
      questionsWrap.appendChild(row);
      renumber();
    }

    function renumber() {
      questionsWrap.querySelectorAll('.question-row').forEach((row, i) => {
        row.querySelector('.q-num').textContent = i + 1;
      });
    }

    modal.querySelector('#add-question').addEventListener('click', addQuestion);
    addQuestion();
    modal.querySelector('[data-close]').addEventListener('click', closeModal);

    modal.querySelector('#quiz-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const rows = Array.from(questionsWrap.querySelectorAll('.question-row'));
      if (rows.length === 0) {
        toast('Cần ít nhất 1 câu.', 'error');
        return;
      }
      const pdfFile = modal.querySelector('#quiz-pdf').files[0];
      if (!pdfFile) {
        toast('Vui lòng tải lên file PDF đề bài.', 'error');
        return;
      }
      const questions = [];
      for (const row of rows) {
        const correct = row.querySelector('[data-correct]:checked');
        if (!correct) {
          toast(`Chưa chọn đáp án đúng cho câu ${row.querySelector('.q-num').textContent}.`, 'error');
          return;
        }
        questions.push({
          question_text: row.querySelector('[data-field="question_text"]').value,
          option_a: row.querySelector('[data-field="option_a"]').value,
          option_b: row.querySelector('[data-field="option_b"]').value,
          option_c: row.querySelector('[data-field="option_c"]').value,
          option_d: row.querySelector('[data-field="option_d"]').value,
          correct_option: correct.value,
        });
      }
      const btn = modal.querySelector('#save-quiz');
      btn.disabled = true;
      btn.innerHTML = spinnerButton('Đang tải PDF...');
      try {
        const pdfUrl = await uploadFile(pdfFile, `quiz-${cls.id}`);
        btn.innerHTML = spinnerButton('Đang lưu...');
        await createQuizWithQuestions(
          cls.id,
          modal.querySelector('#quiz-title').value,
          modal.querySelector('#quiz-publish').checked,
          pdfUrl,
          questions
        );
        closeModal();
        toast('Đã tạo bài tập.', 'success');
        renderQuizzesTab();
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Lưu bài tập';
        toast(friendlyError(error), 'error');
      }
    });
  }

  async function openQuizResults(quizId, title) {
    const modal = openModal(`
      <div class="p-6">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-bold text-slate-800">Kết quả: ${escapeHtml(title)}</h3>
          <button data-close class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        <div id="results-body">${skeletonCards(1)}</div>
      </div>
    `, { width: 'max-w-2xl' });
    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    try {
      const [subs, directory] = await Promise.all([listSubmissionsByQuiz(quizId), getDirectory()]);
      const latest = latestByStudent(subs);
      const rows = latest.length
        ? latest
            .map((s) => {
              const student = directory.get(s.student_id);
              return `<tr class="border-t border-slate-100">
                <td class="px-4 py-3 font-medium text-slate-700">${escapeHtml(student ? student.name : 'Ẩn danh')}</td>
                <td class="px-4 py-3 text-center"><span class="rounded-full ${scoreTint(s.score)} px-3 py-1 text-sm font-bold">${s.score}</span></td>
                <td class="px-4 py-3 text-right text-sm text-slate-400">${formatDate(s.submitted_at)}</td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="3" class="px-4 py-8 text-center text-sm text-slate-400">Chưa có học sinh nộp bài.</td></tr>`;
      modal.querySelector('#results-body').innerHTML = `
        <div class="overflow-hidden rounded-xl ring-1 ring-slate-100">
          <table class="w-full text-left">
            <thead class="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr><th class="px-4 py-3">Học sinh</th><th class="px-4 py-3 text-center">Điểm (/10)</th><th class="px-4 py-3 text-right">Thời gian nộp</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    } catch (error) {
      modal.querySelector('#results-body').innerHTML = `<p class="text-sm text-red-600">${escapeHtml(friendlyError(error))}</p>`;
    }
  }

  async function renderGradesTab() {
    const body = qs('#tab-body');
    body.innerHTML = skeletonCards(2);
    try {
      const [students, quizzes, directory] = await Promise.all([
        listStudentsInClass(cls.id),
        listQuizzes(cls.id),
        getDirectory(),
      ]);
      const subsPerQuiz = await Promise.all(quizzes.map((q) => listSubmissionsByQuiz(q.id)));
      const scoreMap = {};
      quizzes.forEach((q, i) => {
        latestByStudent(subsPerQuiz[i]).forEach((s) => {
          scoreMap[`${s.student_id}:${q.id}`] = s.score;
        });
      });

      const studentList =
        students.length === 0
          ? emptyState('Chưa có học sinh', 'Học sinh tham gia bằng mã lớp sẽ xuất hiện ở đây.', 'graduation')
          : `<div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
              <div class="overflow-x-auto">
                <table class="w-full min-w-[520px] text-left">
                  <thead class="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th class="sticky left-0 bg-slate-50 px-4 py-3">Học sinh</th>
                      ${quizzes.map((q) => `<th class="px-4 py-3 text-center">${escapeHtml(q.title)}</th>`).join('')}
                    </tr>
                  </thead>
                  <tbody>
                    ${students
                      .map((row) => {
                        const student = directory.get(row.student_id);
                        return `<tr class="border-t border-slate-100 hover:bg-slate-50">
                          <td class="sticky left-0 bg-white px-4 py-3">
                            <p class="font-semibold text-slate-800">${escapeHtml(student ? student.name : 'Ẩn danh')}</p>
                            <p class="text-xs text-slate-400">Tham gia ${formatDate(row.joined_at)}</p>
                          </td>
                          ${quizzes
                            .map((q) => {
                              const score = scoreMap[`${row.student_id}:${q.id}`];
                              return `<td class="px-4 py-3 text-center">${
                                score === undefined
                                  ? '<span class="text-slate-300">—</span>'
                                  : `<span class="rounded-full ${scoreTint(score)} px-2.5 py-1 text-sm font-bold">${score}</span>`
                              }</td>`;
                            })
                            .join('')}
                        </tr>`;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>`;

      body.innerHTML = `
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-800">Danh sách học sinh & Bảng điểm</h3>
          <span class="text-sm text-slate-500">${students.length} học sinh · ${quizzes.length} bài tập</span>
        </div>
        ${studentList}`;
    } catch (error) {
      body.innerHTML = '';
      toast(friendlyError(error), 'error');
    }
  }

  paintTabs();
  renderLecturesTab();
}

function latestByStudent(subs) {
  const seen = new Set();
  const result = [];
  subs.forEach((s) => {
    if (!seen.has(s.student_id)) {
      seen.add(s.student_id);
      result.push(s);
    }
  });
  return result;
}

function scoreTint(score) {
  const n = Number(score);
  if (n >= 8) return 'bg-emerald-50 text-emerald-700';
  if (n >= 5) return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-700';
}
