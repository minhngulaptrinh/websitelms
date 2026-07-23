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
  emptyState,
  spinnerButton,
  skeletonCards,
  confirmDialog,
} from '../ui.js';
import { joinClassByCode, listClassesForStudent } from '../api/classes.js';
import { listLectures } from '../api/lectures.js';
import { listPublishedQuizzes, getStudentQuestions, countQuestions } from '../api/quizzes.js';
import { submitQuiz, listSubmissionsByStudent } from '../api/submissions.js';
import { getDirectory } from '../api/users.js';
import { renderLectureMedia, contentTypeMeta } from './shared.js';
import { renderMath } from '../math.js';
import { icon } from '../icons.js';

export async function StudentDashboard() {
  renderShell({ active: '#/student', title: 'Lớp học của tôi', content: skeletonCards(3) });
  const actor = getCurrentUser();

  async function refresh() {
    try {
      const [classes, directory] = await Promise.all([listClassesForStudent(actor.id), getDirectory()]);
      render(classes, directory);
    } catch (error) {
      toast(friendlyError(error), 'error');
    }
  }

  function render(classes, directory) {
    const grid =
      classes.length === 0
        ? emptyState('Bạn chưa tham gia lớp nào', 'Nhập mã lớp do giáo viên cung cấp để bắt đầu học.', 'graduation')
        : `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            ${classes
              .map((c) => {
                const teacher = directory.get(c.teacher_id);
                return `<a href="#/student/class/${c.id}" class="group flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-md">
                  <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">${icon('book', 'h-5 w-5')}</span>
                  <h3 class="mt-4 text-base font-bold text-slate-800 group-hover:text-brand-700">${escapeHtml(c.class_name)}</h3>
                  <p class="mt-1 text-sm text-slate-500">GV: ${escapeHtml(teacher ? teacher.name : 'Không rõ')}</p>
                  <span class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">Vào học →</span>
                </a>`;
              })
              .join('')}
          </div>`;

    setViewContent(`
      <div class="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <h3 class="text-base font-bold text-slate-800">Tham gia lớp học mới</h3>
        <p class="mt-1 text-sm text-slate-500">Nhập mã lớp (Class Code) mà giáo viên đã cung cấp.</p>
        <form id="join-form" class="mt-4 flex flex-col gap-3 sm:flex-row">
          <input id="join-code" required placeholder="VD: 4KP9ZT" class="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm uppercase tracking-widest outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
          <button id="join-btn" type="submit" class="flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Tham gia</button>
        </form>
      </div>
      ${grid}
    `);

    qs('#join-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = qs('#join-btn');
      btn.disabled = true;
      btn.innerHTML = spinnerButton('Đang tham gia...');
      try {
        const cls = await joinClassByCode(actor.id, qs('#join-code').value);
        toast(`Đã tham gia lớp "${cls.class_name}".`, 'success');
        refresh();
      } catch (error) {
        btn.disabled = false;
        btn.innerHTML = 'Tham gia';
        toast(friendlyError(error), 'error');
      }
    });
  }

  await refresh();
}

export async function StudentClass({ id }) {
  renderShell({ active: '#/student', title: 'Đang tải lớp học...', content: skeletonCards(2) });
  const actor = getCurrentUser();
  const classes = await listClassesForStudent(actor.id);
  const cls = classes.find((c) => c.id === id);
  if (!cls) {
    toast('Bạn chưa tham gia lớp học này.', 'error');
    navigate('#/student');
    return;
  }

  let activeTab = 'lectures';

  renderShell({
    active: '#/student',
    title: cls.class_name,
    content: `
      <a href="#/student" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">← Quay lại danh sách lớp</a>
      <div class="rounded-2xl bg-gradient-to-r from-brand-800 to-brand-600 p-6 text-white shadow-sm">
        <h2 class="text-2xl font-bold">${escapeHtml(cls.class_name)}</h2>
        <p class="mt-1 text-sm text-brand-100">Chọn bài giảng để học hoặc làm bài tập trắc nghiệm.</p>
      </div>
      <div class="mt-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-100" id="tab-nav">
        <button data-tab="lectures" class="tab-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">${icon('book', 'h-4 w-4')} Bài giảng</button>
        <button data-tab="quizzes" class="tab-btn inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold">${icon('doc', 'h-4 w-4')} Bài tập</button>
      </div>
      <div id="tab-body" class="mt-6"></div>
    `,
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
    else renderQuizzesTab();
  }

  qsa('.tab-btn').forEach((btn) => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  async function renderLecturesTab() {
    const body = qs('#tab-body');
    body.innerHTML = skeletonCards(2);
    try {
      const lectures = await listLectures(cls.id);
      if (lectures.length === 0) {
        body.innerHTML = emptyState('Chưa có bài giảng', 'Giáo viên chưa đăng bài giảng cho lớp này.', 'book');
        return;
      }
      body.innerHTML = `
        <div class="grid gap-4 lg:grid-cols-3">
          <div class="space-y-3 lg:col-span-1">
            ${lectures.map(lectureItem).join('')}
          </div>
          <div id="lecture-viewer" class="lg:col-span-2"></div>
        </div>`;
      const viewer = qs('#lecture-viewer');
      const showLecture = (lecture) => {
        qsa('[data-lec]').forEach((el) => {
          const on = el.dataset.lec === lecture.id;
          el.classList.toggle('ring-2', on);
          el.classList.toggle('ring-brand-500', on);
        });
        viewer.innerHTML = `
          <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 class="mb-4 text-lg font-bold text-slate-800">${escapeHtml(lecture.title)}</h3>
            ${renderLectureMedia(lecture)}
          </div>`;
      };
      qsa('[data-lec]').forEach((el) =>
        el.addEventListener('click', () => showLecture(lectures.find((l) => l.id === el.dataset.lec)))
      );
      showLecture(lectures[0]);
    } catch (error) {
      body.innerHTML = '';
      toast(friendlyError(error), 'error');
    }
  }

  function lectureItem(lecture) {
    const meta = contentTypeMeta(lecture.content_type);
    return `<button data-lec="${lecture.id}" class="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-slate-100 transition hover:ring-brand-300">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${meta.tint} text-lg">${meta.icon}</span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-slate-800">${escapeHtml(lecture.title)}</p>
        <p class="text-xs text-slate-400">${meta.label}</p>
      </div>
    </button>`;
  }

  async function renderQuizzesTab() {
    const body = qs('#tab-body');
    body.innerHTML = skeletonCards(2);
    try {
      const quizzes = await listPublishedQuizzes(cls.id);
      if (quizzes.length === 0) {
        body.innerHTML = emptyState('Chưa có bài tập', 'Giáo viên chưa mở bài tập trắc nghiệm nào.', 'doc');
        return;
      }
      const [subs, counts] = await Promise.all([
        listSubmissionsByStudent(actor.id, quizzes.map((q) => q.id)),
        Promise.all(quizzes.map((q) => countQuestions(q.id))),
      ]);
      const bestScore = {};
      subs.forEach((s) => {
        if (bestScore[s.quiz_id] === undefined || Number(s.score) > Number(bestScore[s.quiz_id])) {
          bestScore[s.quiz_id] = s.score;
        }
      });

      body.innerHTML = `<div class="space-y-3">${quizzes
        .map((q, i) => {
          const done = bestScore[q.id] !== undefined;
          return `<div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div class="min-w-0">
              <p class="truncate font-semibold text-slate-800">${escapeHtml(q.title)}</p>
              <p class="mt-1 text-xs text-slate-400">${counts[i]} câu hỏi${done ? ` · Điểm cao nhất: <b class="text-emerald-600">${bestScore[q.id]}/10</b>` : ''}</p>
            </div>
            <button data-quiz="${q.id}" data-title="${escapeHtml(q.title)}" class="rounded-lg px-4 py-2 text-sm font-semibold text-white ${done ? 'bg-slate-600 hover:bg-slate-700' : 'bg-brand-700 hover:bg-brand-800'}">${done ? 'Làm lại' : 'Làm bài'}</button>
          </div>`;
        })
        .join('')}</div>`;

      qsa('[data-quiz]').forEach((btn) =>
        btn.addEventListener('click', () => openQuiz(quizzes.find((q) => q.id === btn.dataset.quiz)))
      );
    } catch (error) {
      body.innerHTML = '';
      toast(friendlyError(error), 'error');
    }
  }

  async function openQuiz(quiz) {
    const body = qs('#tab-body');
    body.innerHTML = skeletonCards(1);
    try {
      const questions = await getStudentQuestions(quiz.id);
      if (questions.length === 0) {
        body.innerHTML = emptyState('Bài tập trống', 'Bài tập này chưa có câu hỏi.', 'doc');
        return;
      }
      const pdfPanel = quiz.pdf_url
        ? `<div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="inline-flex items-center gap-2 text-base font-bold text-ink">${icon('doc', 'h-5 w-5 text-terra-500')} Đề bài</h3>
              <a href="${encodeURI(quiz.pdf_url)}" target="_blank" rel="noopener" class="text-xs font-medium text-brand-700 hover:underline">Mở tab mới ↗</a>
            </div>
            <iframe src="${encodeURI(quiz.pdf_url)}" class="h-[72vh] w-full rounded-xl border border-slate-200" title="Đề bài"></iframe>
          </div>`
        : `<div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 class="text-base font-bold text-slate-800">Đề bài</h3>
            <p class="mt-2 text-sm text-slate-500">Bài tập này không có file đề. Xem nội dung ở phần phiếu trả lời bên cạnh.</p>
          </div>`;

      body.innerHTML = `
        <button id="quiz-back" class="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-brand-700">← Danh sách bài tập</button>
        <div class="grid gap-4 lg:grid-cols-2">
          <div class="lg:sticky lg:top-24 lg:self-start">${pdfPanel}</div>
          <form id="quiz-take" class="space-y-4">
            <div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <h3 class="text-lg font-bold text-slate-800">${escapeHtml(quiz.title)}</h3>
              <p class="mt-1 text-sm text-slate-500">Phiếu trả lời · ${questions.length} câu · Chọn một đáp án cho mỗi câu.</p>
            </div>
            ${questions.map(questionCard).join('')}
            <div class="sticky bottom-0 flex items-center justify-between rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100">
              <span id="progress" class="text-sm text-slate-500">Đã trả lời 0/${questions.length}</span>
              <button id="submit-quiz" type="submit" class="flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">Nộp bài</button>
            </div>
          </form>
        </div>`;

      const form = qs('#quiz-take');
      renderMath(form);
      const updateProgress = () => {
        const answered = new Set(qsa('input[type="radio"]:checked', form).map((el) => el.name)).size;
        qs('#progress').textContent = `Đã trả lời ${answered}/${questions.length}`;
      };
      form.addEventListener('change', updateProgress);
      qs('#quiz-back').addEventListener('click', renderQuizzesTab);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const answers = {};
        qsa('input[type="radio"]:checked', form).forEach((el) => {
          answers[el.name] = el.value;
        });
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < questions.length) {
          const ok = await confirmDialog(
            `Bạn còn ${questions.length - answeredCount} câu chưa trả lời. Vẫn nộp bài?`,
            { title: 'Nộp bài', confirmText: 'Nộp bài' }
          );
          if (!ok) return;
        }
        const btn = qs('#submit-quiz');
        btn.disabled = true;
        btn.innerHTML = spinnerButton('Đang chấm...');
        try {
          const result = await submitQuiz(quiz.id, actor.id, answers);
          showResult(quiz.title, result);
        } catch (error) {
          btn.disabled = false;
          btn.innerHTML = 'Nộp bài';
          toast(friendlyError(error), 'error');
        }
      });
    } catch (error) {
      body.innerHTML = '';
      toast(friendlyError(error), 'error');
    }
  }

  function questionCard(question, index) {
    const options = [
      ['A', question.option_a],
      ['B', question.option_b],
      ['C', question.option_c],
      ['D', question.option_d],
    ];
    const stem = question.question_text
      ? `<p class="mb-3 text-slate-700">${escapeHtml(question.question_text)}</p>`
      : '';
    return `<div class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p class="mb-2 text-sm font-bold text-brand-600">Câu ${index + 1}</p>
      ${stem}
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        ${options
          .map(([letter, text]) => {
            const hasText = text && text.trim() !== '';
            return `<label class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition hover:border-brand-400 hover:bg-brand-50 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 ${hasText ? 'sm:col-span-2' : 'justify-center'}">
              <input type="radio" name="${question.id}" value="${letter}" class="h-4 w-4 shrink-0 text-brand-600" />
              <span class="font-bold text-slate-500">${letter}</span>
              ${hasText ? `<span class="text-slate-700">${escapeHtml(text)}</span>` : ''}
            </label>`;
          })
          .join('')}
      </div>
    </div>`;
  }

  function showResult(title, result) {
    const score = Number(result.score);
    const passed = score >= 5;
    const body = qs('#tab-body');
    body.innerHTML = `
      <div class="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100 fade-in">
        <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full ${passed ? 'bg-emerald-50 text-emerald-600' : 'bg-accent-50 text-accent-600'}">${icon(passed ? 'award' : 'target', 'h-9 w-9')}</div>
        <h3 class="mt-5 text-lg font-bold text-slate-800">Đã nộp bài: ${escapeHtml(title)}</h3>
        <p class="mt-2 text-sm text-slate-500">Trả lời đúng ${result.correct}/${result.total} câu</p>
        <p class="mt-4 text-5xl font-extrabold ${passed ? 'text-emerald-600' : 'text-amber-600'}">${result.score}<span class="text-2xl text-slate-400">/10</span></p>
        <p class="mt-2 text-sm text-slate-500">${passed ? 'Làm tốt lắm! Kết quả đã được lưu.' : 'Cố gắng thêm nhé! Kết quả đã được lưu.'}</p>
        <div class="mt-6 flex justify-center gap-3">
          <button id="back-list" class="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Về danh sách</button>
        </div>
      </div>`;
    qs('#back-list').addEventListener('click', renderQuizzesTab);
  }

  paintTabs();
  renderLecturesTab();
}
