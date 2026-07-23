import { mount, qs, qsa } from '../ui.js';
import { getCurrentUser, homeRouteFor } from '../auth.js';
import { navigate } from '../router.js';
import { icon } from '../icons.js';
import { initReveal } from '../reveal.js';

const HERO_ART = `
<svg viewBox="0 0 520 470" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto" role="img" aria-label="Minh hoạ dạy và học Toán">
  <defs>
    <linearGradient id="board" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1f3a5a"/>
      <stop offset="1" stop-color="#132540"/>
    </linearGradient>
  </defs>
  <circle cx="410" cy="90" r="70" fill="#f6e6c2"/>
  <path d="M60 40l14 0M67 33l0 14" stroke="#bd8526" stroke-width="3" stroke-linecap="round"/>
  <path d="M470 300l12 0M476 294l0 12" stroke="#a9542f" stroke-width="3" stroke-linecap="round"/>
  <rect x="70" y="70" width="360" height="250" rx="20" fill="url(#board)"/>
  <rect x="70" y="70" width="360" height="250" rx="20" stroke="#0c1830" stroke-width="2"/>
  <path d="M104 268V116" stroke="#7f9dc4" stroke-width="2" stroke-linecap="round"/>
  <path d="M104 268h280" stroke="#7f9dc4" stroke-width="2" stroke-linecap="round"/>
  <path d="M104 250C160 250 176 150 232 150s72 40 152 -70" stroke="#e3b459" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M120 244l58-34 52 18 62-40 70 20" stroke="#f5efe3" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="3 8"/>
  <circle cx="178" cy="210" r="5" fill="#f5efe3"/>
  <circle cx="230" cy="228" r="5" fill="#f5efe3"/>
  <circle cx="292" cy="188" r="5" fill="#f5efe3"/>
  <circle cx="362" cy="208" r="5" fill="#e3b459"/>
  <text x="150" y="120" font-family="Playfair Display, serif" font-size="30" fill="#f6e6c2" font-style="italic">f(x)</text>
  <text x="330" y="118" font-family="Playfair Display, serif" font-size="28" fill="#8db4ff">√</text>
  <g transform="rotate(-7 96 300)">
    <rect x="40" y="300" width="176" height="96" rx="16" fill="#ffffff"/>
    <rect x="40" y="300" width="176" height="96" rx="16" stroke="#ece2ce" stroke-width="1.5"/>
    <rect x="58" y="320" width="70" height="9" rx="4.5" fill="#1e3a5a"/>
    <rect x="58" y="338" width="120" height="7" rx="3.5" fill="#d7e0ee"/>
    <circle cx="64" cy="368" r="8" fill="#fbf4e4" stroke="#bd8526" stroke-width="2"/>
    <path d="M60 368l3 3 5-6" stroke="#bd8526" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="80" y="362" width="112" height="12" rx="6" fill="#f5efe3"/>
  </g>
  <g transform="rotate(8 400 360)">
    <rect x="316" y="330" width="150" height="86" rx="16" fill="#1e3a5a"/>
    <path d="M338 356l12-9v18z" fill="#e3b459"/>
    <rect x="360" y="350" width="86" height="8" rx="4" fill="#84a0c2"/>
    <rect x="360" y="366" width="64" height="7" rx="3.5" fill="#365b86"/>
    <rect x="338" y="388" width="108" height="10" rx="5" fill="#132540"/>
  </g>
  <path d="M250 46l20 0M260 36l0 20" stroke="#1e3a5a" stroke-width="3" stroke-linecap="round"/>
  <path d="M12 9l9-4 9 4-9 4-9-4z" transform="translate(438 380) scale(2.1)" fill="#bd8526"/>
</svg>`;

function navBar(user) {
  const authCta = user
    ? `<button data-go="${homeRouteFor(user.role)}" class="rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900">Vào học</button>`
    : `<button data-go="#/login" class="rounded-full border border-brand-800/25 px-5 py-2.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-800 hover:text-white">Đăng nhập</button>`;
  const links = [
    ['method', 'Cách học'],
    ['features', 'Tính năng'],
    ['students', 'Trải nghiệm'],
    ['reviews', 'Đánh giá'],
  ];
  return `
    <header id="site-nav" class="fixed inset-x-0 top-0 z-40 transition-all duration-300">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <button data-go="#/home" class="flex items-center gap-2.5">
          <span class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-900 text-lg font-bold text-white">M<img src="./assets/logo.png" alt="Logo" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" /></span>
          <span class="font-display text-lg font-bold text-ink">Học toán cùng Minh</span>
        </button>
        <nav class="hidden items-center gap-8 lg:flex">
          ${links
            .map(
              ([id, label]) =>
                `<button data-scroll="${id}" class="link-underline text-sm font-medium text-ink/70 transition hover:text-ink">${label}</button>`
            )
            .join('')}
        </nav>
        <div class="hidden items-center gap-3 lg:flex">${authCta}</div>
        <button id="nav-toggle" class="rounded-lg p-2 text-ink lg:hidden" aria-label="Mở menu">${icon('menu', 'h-6 w-6')}</button>
      </div>
      <div id="nav-mobile" class="hidden border-t border-ink/10 bg-paper-50/95 backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-3">
          ${links
            .map(
              ([id, label]) =>
                `<button data-scroll="${id}" class="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink/80 hover:bg-ink/5">${label}</button>`
            )
            .join('')}
          <div class="mt-1">${authCta}</div>
        </div>
      </div>
    </header>`;
}

function hero(user) {
  const primary = user
    ? `<button data-go="${homeRouteFor(user.role)}" class="group inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-accent-600">Vào học ngay ${icon('arrowRight', 'h-4 w-4 transition-transform group-hover:translate-x-1')}</button>`
    : `<button data-go="#/login" class="group inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lift transition hover:bg-accent-600">Đăng nhập để học ${icon('arrowRight', 'h-4 w-4 transition-transform group-hover:translate-x-1')}</button>`;
  return `
    <section class="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      <div class="paper-grain pointer-events-none absolute inset-0 opacity-70"></div>
      <div class="absolute -right-40 top-10 -z-0 h-[420px] w-[420px] rounded-full bg-accent-100/50 blur-3xl"></div>
      <div class="relative mx-auto grid max-w-6xl items-center gap-12 px-5 md:px-8 lg:grid-cols-2">
        <div class="reveal">
          <span class="inline-flex items-center gap-2 rounded-full border border-accent-300/60 bg-accent-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-700">${icon('sparkle', 'h-3.5 w-3.5')} Nền tảng học Toán cho học sinh Việt</span>
          <h1 class="mt-6 font-display text-5xl font-bold leading-[1.05] text-ink md:text-6xl">
            Học Toán <span class="relative whitespace-nowrap text-brand-800">rõ ràng<svg class="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M2 7C60 2 140 2 198 6" stroke="#bd8526" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg></span>.<br/>Tiến bộ <span class="italic text-accent-600">mỗi ngày</span>.
          </h1>
          <p class="mt-6 max-w-xl text-lg leading-relaxed text-ink/70">
            Vào lớp bằng mã, học bài giảng theo tiến độ của riêng bạn, làm trắc nghiệm và biết điểm ngay lập tức. Mọi thứ bạn cần để giỏi Toán, gọn trong một nơi.
          </p>
          <div class="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            ${primary}
            <button data-scroll="method" class="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-3.5 text-sm font-semibold text-ink transition hover:border-ink/40 hover:bg-white">Xem phương pháp</button>
          </div>
          <p class="mt-8 flex items-center gap-2 text-sm text-ink/55">${icon('users', 'h-4 w-4 text-brand-600')} Hàng nghìn học sinh Việt Nam đang học mỗi ngày.</p>
        </div>
        <div class="reveal" style="--reveal-delay: 140ms">
          ${HERO_ART}
        </div>
      </div>
    </section>`;
}

const STATS = [
  { target: 1200, suffix: '+', label: 'Học sinh đang học' },
  { target: 480, suffix: '+', label: 'Bài giảng &amp; đề thi' },
  { target: 35000, suffix: '+', label: 'Lượt trắc nghiệm đã chấm' },
  { target: 2.4, prefix: '+', decimals: 1, label: 'Điểm trung bình cải thiện' },
];

function statsBand() {
  return `
    <section class="border-y border-ink/10 bg-white/60">
      <div class="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 md:px-8 lg:grid-cols-4">
        ${STATS.map(
          (s, i) => `<div class="reveal text-center lg:text-left" style="--reveal-delay: ${i * 90}ms">
            <p class="count-up font-display text-4xl font-bold text-brand-800 md:text-5xl" data-count-target="${s.target}" data-prefix="${s.prefix || ''}" data-suffix="${s.suffix || ''}" data-decimals="${s.decimals || 0}">${s.prefix || ''}0${s.suffix || ''}</p>
            <p class="mt-2 text-sm text-ink/60">${s.label}</p>
          </div>`
        ).join('')}
      </div>
    </section>`;
}

const METHOD_STEPS = [
  {
    icon: 'school',
    title: 'Tham gia lớp học',
    body: 'Nhập mã lớp thầy cô cung cấp để vào lớp và thấy toàn bộ bài giảng, bài tập của mình.',
  },
  {
    icon: 'book',
    title: 'Học bài giảng',
    body: 'Đọc PDF, xem video bài giảng theo tiến độ của riêng bạn và xem lại bất cứ lúc nào.',
  },
  {
    icon: 'checkCircle',
    title: 'Làm bài &amp; biết điểm ngay',
    body: 'Làm trắc nghiệm trực tuyến, nộp bài và nhận điểm tức thì — biết ngay mình sai ở đâu để ôn lại.',
  },
];

function methodSection() {
  return `
    <section id="method" class="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
      <div class="reveal mx-auto max-w-2xl text-center">
        <span class="text-sm font-semibold uppercase tracking-wider text-accent-600">Cách học</span>
        <h2 class="mt-3 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">Bắt đầu học chỉ với ba bước.</h2>
        <p class="mt-4 text-lg text-ink/65">Đơn giản và rõ ràng — để bạn tập trung hoàn toàn vào việc học.</p>
      </div>
      <div class="mt-16 grid gap-6 md:grid-cols-3">
        ${METHOD_STEPS.map(
          (s, i) => `<div class="reveal group relative rounded-3xl border border-ink/8 bg-white p-8 shadow-card hover-lift" style="--reveal-delay: ${i * 110}ms">
            <span class="font-display text-6xl font-bold text-paper-300 transition group-hover:text-accent-200">0${i + 1}</span>
            <div class="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-900 text-white">${icon(s.icon, 'h-6 w-6')}</div>
            <h3 class="mt-5 text-xl font-bold text-ink">${s.title}</h3>
            <p class="mt-2 leading-relaxed text-ink/65">${s.body}</p>
          </div>`
        ).join('')}
      </div>
    </section>`;
}

const FEATURES = [
  { icon: 'book', title: 'Bài giảng đa dạng', body: 'Đọc PDF, xem video bài giảng — học lại bao nhiêu lần tuỳ thích, trên mọi thiết bị.' },
  { icon: 'doc', title: 'Đề bài rõ ràng', body: 'Đề thi giữ nguyên bản PDF, công thức toán hiển thị sắc nét bằng LaTeX.' },
  { icon: 'checkCircle', title: 'Biết điểm tức thì', body: 'Nộp bài là có điểm ngay theo thang 10, không phải chờ đợi.' },
  { icon: 'chart', title: 'Theo dõi tiến bộ', body: 'Xem lại điểm cao nhất của mình qua từng bài và cố gắng vượt qua chính mình.' },
  { icon: 'school', title: 'Vào lớp bằng mã', body: 'Chỉ cần một mã lớp là tham gia được ngay, không rườm rà.' },
  { icon: 'clock', title: 'Học mọi lúc, mọi nơi', body: 'Máy tính hay điện thoại, ở nhà hay trên đường — việc học luôn sẵn sàng.' },
];

function featuresSection() {
  return `
    <section id="features" class="bg-white/60 py-20 md:py-28">
      <div class="mx-auto max-w-6xl px-5 md:px-8">
        <div class="reveal max-w-2xl">
          <span class="text-sm font-semibold uppercase tracking-wider text-accent-600">Tính năng</span>
          <h2 class="mt-3 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">Mọi thứ bạn cần để học Toán tốt hơn.</h2>
        </div>
        <div class="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          ${FEATURES.map(
            (f, i) => `<div class="reveal" style="--reveal-delay: ${(i % 3) * 90}ms">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-accent-200/60">${icon(f.icon, 'h-6 w-6')}</div>
              <h3 class="mt-5 text-lg font-bold text-ink">${f.title}</h3>
              <p class="mt-2 leading-relaxed text-ink/65">${f.body}</p>
            </div>`
          ).join('')}
        </div>
      </div>
    </section>`;
}

function roleSection({ id, eyebrow, title, body, bullets, cta, reversed, art }) {
  const text = `
    <div class="reveal ${reversed ? 'lg:order-2' : ''}">
      <span class="text-sm font-semibold uppercase tracking-wider text-accent-600">${eyebrow}</span>
      <h2 class="mt-3 font-display text-4xl font-bold leading-tight text-ink md:text-[2.75rem]">${title}</h2>
      <p class="mt-4 text-lg text-ink/65">${body}</p>
      <ul class="mt-7 space-y-3.5">
        ${bullets
          .map(
            (b) => `<li class="flex items-start gap-3"><span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-900 text-white">${icon('check', 'h-3.5 w-3.5', 2.4)}</span><span class="text-ink/80">${b}</span></li>`
          )
          .join('')}
      </ul>
      <button data-go="#/login" class="group mt-9 inline-flex items-center gap-2 rounded-full bg-brand-800 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-900">${cta} ${icon('arrowRight', 'h-4 w-4 transition-transform group-hover:translate-x-1')}</button>
    </div>`;
  const visual = `<div class="reveal ${reversed ? 'lg:order-1' : ''}" style="--reveal-delay: 120ms">${art}</div>`;
  return `
    <section id="${id}" class="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-24">
      <div class="grid items-center gap-12 lg:grid-cols-2">
        ${text}
        ${visual}
      </div>
    </section>`;
}

const STUDENT_ART = `
<div class="relative rounded-3xl border border-ink/8 bg-white p-6 shadow-lift">
  <div class="flex items-center gap-3 border-b border-ink/8 pb-4">
    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-700">${icon('doc', 'h-5 w-5')}</span>
    <div><p class="font-semibold text-ink">Kiểm tra 15 phút — Chương 3</p><p class="text-xs text-ink/50">6 câu · Phiếu trả lời</p></div>
  </div>
  <div class="mt-4 space-y-3">
    <p class="text-sm text-ink/70">Câu 1. Nghiệm của phương trình bậc hai:</p>
    <div class="grid grid-cols-2 gap-2">
      <div class="rounded-xl border border-ink/12 px-3 py-2.5 text-sm text-ink/70"><b class="text-ink/40">A</b></div>
      <div class="rounded-xl border-2 border-accent-500 bg-accent-50 px-3 py-2.5 text-sm font-semibold text-accent-800"><b>B</b> &nbsp;chọn</div>
      <div class="rounded-xl border border-ink/12 px-3 py-2.5 text-sm text-ink/70"><b class="text-ink/40">C</b></div>
      <div class="rounded-xl border border-ink/12 px-3 py-2.5 text-sm text-ink/70"><b class="text-ink/40">D</b></div>
    </div>
  </div>
  <div class="mt-5 flex items-center justify-between rounded-2xl bg-brand-900 p-4 text-white">
    <div><p class="text-xs text-brand-200">Điểm của bạn</p><p class="font-display text-3xl font-bold">8.3<span class="text-base text-brand-300">/10</span></p></div>
    <span class="flex h-11 w-11 items-center justify-center rounded-full bg-accent-500">${icon('award', 'h-6 w-6')}</span>
  </div>
</div>`;

const TESTIMONIALS = [
  { quote: 'Em thích nhất là làm xong biết điểm luôn, và biết mình sai câu nào để ôn lại cho chắc.', name: 'Trần Minh Quân', role: 'Học sinh lớp 12' },
  { quote: 'Bài giảng xem lại được nhiều lần nên chỗ nào chưa hiểu em cứ mở ra học lại, thoải mái lắm.', name: 'Nguyễn Bảo Ngọc', role: 'Học sinh lớp 11' },
  { quote: 'Tôi theo dõi được con học tới đâu, tiến bộ thế nào mà không cần hỏi han nhiều.', name: 'Chị Lê Phương', role: 'Phụ huynh' },
];

function testimonialsSection() {
  return `
    <section id="reviews" class="bg-white/60 py-20 md:py-28">
      <div class="mx-auto max-w-6xl px-5 md:px-8">
        <div class="reveal mx-auto max-w-2xl text-center">
          <span class="text-sm font-semibold uppercase tracking-wider text-accent-600">Đánh giá</span>
          <h2 class="mt-3 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">Học sinh nói gì về chúng mình.</h2>
        </div>
        <div class="mt-14 grid gap-6 md:grid-cols-3">
          ${TESTIMONIALS.map(
            (t, i) => `<figure class="reveal flex flex-col rounded-3xl border border-ink/8 bg-paper-50 p-7 shadow-card" style="--reveal-delay: ${i * 100}ms">
              <span class="text-accent-400">${icon('quote', 'h-8 w-8')}</span>
              <blockquote class="mt-4 flex-1 text-lg leading-relaxed text-ink/80">${t.quote}</blockquote>
              <figcaption class="mt-6 border-t border-ink/8 pt-4">
                <p class="font-semibold text-ink">${t.name}</p>
                <p class="text-sm text-ink/55">${t.role}</p>
              </figcaption>
            </figure>`
          ).join('')}
        </div>
      </div>
    </section>`;
}

const FAQS = [
  { q: 'Làm sao để có tài khoản học sinh?', a: 'Tài khoản do thầy cô hoặc nhà trường/trung tâm cấp cho bạn. Nếu chưa có, hãy liên hệ giáo viên của mình để được cấp.' },
  { q: 'Làm sao để vào lớp học?', a: 'Sau khi đăng nhập, bạn nhập "Mã lớp" mà giáo viên cung cấp là tham gia được ngay và thấy toàn bộ bài giảng, bài tập của lớp.' },
  { q: 'Có hỗ trợ công thức Toán không?', a: 'Có. Đề bài dạng PDF giữ nguyên bản gốc, và các câu hỏi/phương án hỗ trợ LaTeX, hiển thị công thức sắc nét trên mọi thiết bị.' },
  { q: 'Bài trắc nghiệm được chấm như thế nào?', a: 'Hệ thống chấm ngay khi bạn nộp bài, tính điểm theo thang 10 và lưu lại để bạn theo dõi tiến bộ.' },
  { q: 'Dùng được trên điện thoại không?', a: 'Được. Giao diện được thiết kế cho cả máy tính và điện thoại, học mọi lúc mọi nơi.' },
];

function faqSection() {
  return `
    <section id="faq" class="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
      <div class="reveal text-center">
        <span class="text-sm font-semibold uppercase tracking-wider text-accent-600">Giải đáp</span>
        <h2 class="mt-3 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">Câu hỏi thường gặp</h2>
      </div>
      <div class="mt-12 divide-y divide-ink/10 border-y border-ink/10">
        ${FAQS.map(
          (f) => `<div class="faq-item reveal">
            <button class="faq-q flex w-full items-center justify-between gap-4 py-5 text-left">
              <span class="text-lg font-semibold text-ink">${f.q}</span>
              <span class="faq-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink transition-transform">${icon('plus', 'h-4 w-4', 2)}</span>
            </button>
            <div class="faq-a grid grid-rows-[0fr] transition-all duration-300">
              <div class="overflow-hidden"><p class="pb-5 leading-relaxed text-ink/65">${f.a}</p></div>
            </div>
          </div>`
        ).join('')}
      </div>
    </section>`;
}

function ctaBand(user) {
  const go = user ? homeRouteFor(user.role) : '#/login';
  return `
    <section class="mx-auto max-w-6xl px-5 pb-24 md:px-8">
      <div class="reveal relative overflow-hidden rounded-[2rem] bg-brand-900 px-8 py-16 text-center shadow-lift md:px-16 md:py-20">
        <div class="paper-grain pointer-events-none absolute inset-0 opacity-40"></div>
        <div class="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl"></div>
        <div class="absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl"></div>
        <div class="relative">
          <h2 class="mx-auto max-w-2xl font-display text-4xl font-bold leading-tight text-white md:text-5xl">Sẵn sàng chinh phục môn Toán?</h2>
          <p class="mx-auto mt-4 max-w-xl text-lg text-brand-100">Đăng nhập bằng tài khoản được thầy cô cấp và bắt đầu học ngay hôm nay.</p>
          <button data-go="${go}" class="group mt-9 inline-flex items-center gap-2 rounded-full bg-accent-500 px-8 py-4 text-base font-semibold text-white shadow-lift transition hover:bg-accent-600">Bắt đầu ngay ${icon('arrowRight', 'h-5 w-5 transition-transform group-hover:translate-x-1')}</button>
        </div>
      </div>
    </section>`;
}

function footer() {
  const cols = [
    ['Khám phá', [['method', 'Cách học'], ['features', 'Tính năng'], ['students', 'Trải nghiệm']]],
    ['Hỗ trợ', [['reviews', 'Đánh giá'], ['faq', 'Câu hỏi thường gặp']]],
  ];
  return `
    <footer class="border-t border-ink/10 bg-paper-100">
      <div class="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div class="md:col-span-2">
          <div class="flex items-center gap-2.5">
            <span class="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-brand-900 text-lg font-bold text-white">M<img src="./assets/logo.png" alt="Logo" class="absolute inset-0 h-full w-full object-cover" onerror="this.remove()" /></span>
            <span class="font-display text-lg font-bold text-ink">Học toán cùng Minh</span>
          </div>
          <p class="mt-4 max-w-sm leading-relaxed text-ink/60">Nền tảng học Toán trực tuyến dành cho học sinh Việt Nam.</p>
        </div>
        ${cols
          .map(
            ([title, links]) => `<div>
              <p class="text-sm font-semibold uppercase tracking-wider text-ink/50">${title}</p>
              <ul class="mt-4 space-y-2.5">
                ${links.map(([id, label]) => `<li><button data-scroll="${id}" class="text-ink/70 transition hover:text-ink">${label}</button></li>`).join('')}
              </ul>
            </div>`
          )
          .join('')}
      </div>
      <div class="border-t border-ink/10">
        <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-ink/50 sm:flex-row md:px-8">
          <p>© 2026 Học toán cùng Minh. Mọi quyền được bảo lưu.</p>
          <div class="flex items-center gap-4">
            <span class="inline-flex items-center gap-1.5">${icon('mail', 'h-4 w-4')} hoctoancungminh@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>`;
}

function animateCount(el) {
  const target = parseFloat(el.dataset.countTarget);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const format = (v) =>
    prefix + (decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('vi-VN')) + suffix;
  if (reduce) {
    el.textContent = format(target);
    return;
  }
  const duration = 1400;
  let start = null;
  const step = (ts) => {
    if (start === null) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(target * eased);
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = format(target);
  };
  requestAnimationFrame(step);
}

export function LandingView() {
  const user = getCurrentUser();
  mount(`
    <div class="min-h-screen bg-paper">
      ${navBar(user)}
      <main>
        ${hero(user)}
        ${statsBand()}
        ${methodSection()}
        ${featuresSection()}
        ${roleSection({
          id: 'students',
          eyebrow: 'Trải nghiệm học tập',
          title: 'Học chủ động, biết ngay mình sai ở đâu.',
          body: 'Bạn làm chủ việc học của mình — học theo tiến độ riêng và thấy rõ sự tiến bộ qua từng bài.',
          bullets: [
            'Vào lớp bằng mã, học bài giảng theo tiến độ riêng.',
            'Làm trắc nghiệm ngay trên web, được chấm tức thì.',
            'Xem lại điểm cao nhất, cố gắng vượt qua chính mình.',
            'Công thức toán rõ ràng, dễ đọc trên mọi thiết bị.',
          ],
          cta: 'Vào học ngay',
          art: STUDENT_ART,
        })}
        ${testimonialsSection()}
        ${faqSection()}
        ${ctaBand(user)}
      </main>
      ${footer()}
    </div>
  `);

  qsa('[data-go]').forEach((btn) =>
    btn.addEventListener('click', () => navigate(btn.dataset.go))
  );

  const scrollTo = (id) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  qsa('[data-scroll]').forEach((btn) =>
    btn.addEventListener('click', () => {
      scrollTo(btn.dataset.scroll);
      qs('#nav-mobile').classList.add('hidden');
    })
  );

  const nav = qs('#site-nav');
  const onScroll = () => {
    if (window.scrollY > 20) {
      nav.classList.add('bg-paper-50/85', 'backdrop-blur', 'shadow-sm');
    } else {
      nav.classList.remove('bg-paper-50/85', 'backdrop-blur', 'shadow-sm');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const mobile = qs('#nav-mobile');
  qs('#nav-toggle').addEventListener('click', () => mobile.classList.toggle('hidden'));

  qsa('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-q');
    const panel = item.querySelector('.faq-a');
    const ic = item.querySelector('.faq-icon');
    btn.addEventListener('click', () => {
      const open = panel.classList.contains('grid-rows-[1fr]');
      panel.classList.toggle('grid-rows-[1fr]', !open);
      panel.classList.toggle('grid-rows-[0fr]', open);
      ic.classList.toggle('rotate-45', !open);
      ic.classList.toggle('bg-accent-500', !open);
      ic.classList.toggle('text-white', !open);
      ic.classList.toggle('bg-ink/5', open);
    });
  });

  const counts = qsa('[data-count-target]');
  if (counts.length) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            co.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counts.forEach((el) => co.observe(el));
  }

  window.scrollTo(0, 0);
  initReveal(document);
}
