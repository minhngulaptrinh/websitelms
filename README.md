# Học toán cùng Minh — Hệ thống quản lý học tập

Ứng dụng web quản lý học tập (LMS thu nhỏ) với 3 vai trò **Admin / Giáo viên / Học sinh**, bài giảng (PDF, video, link YouTube/Drive), bài tập trắc nghiệm và **tự động chấm điểm**.

- **Frontend:** HTML5 + Tailwind CSS + JavaScript thuần (ES Modules, không cần build).
- **Backend:** Supabase (PostgreSQL, Storage). Mật khẩu được băm an toàn bằng `pgcrypto` (bcrypt) ngay trên máy chủ.

**Giao diện (Editorial Academic):** trang mở đầu là **trang chủ giới thiệu** tại `#/home` (giới thiệu phương pháp dạy & học, tính năng, đánh giá, FAQ). Đăng nhập tại `#/login`. Hệ thống thiết kế: nền kem ấm, chữ **Playfair Display** (hiển thị) + **Be Vietnam Pro** (nội dung, hỗ trợ tiếng Việt đầy đủ), tông navy học thuật + nhấn hổ phách, biểu tượng SVG (không dùng emoji), chuyển động tinh tế tôn trọng `prefers-reduced-motion`. Tokens thiết kế nằm trong `index.html` (Tailwind config) và `css/styles.css`.

---

## 1. Cấu trúc thư mục

```
Web LMS của Minh/
├── index.html                Trang gốc (SPA shell)
├── database/
│   └── schema.sql            Toàn bộ bảng, hàm RPC, RLS, bucket, seed admin
├── css/
│   └── styles.css            CSS bổ sung (spinner, toast, animation)
└── js/
    ├── config.js             CẤU HÌNH Supabase (bạn cần điền)
    ├── supabaseClient.js      Khởi tạo Supabase client
    ├── auth.js                Đăng nhập / phiên đăng nhập / phân quyền
    ├── router.js              Điều hướng theo hash + chặn quyền
    ├── layout.js              Sidebar + topbar (responsive)
    ├── storage.js             Tải file lên Supabase Storage
    ├── ui.js                  Toast, modal, loading, tiện ích giao diện
    ├── app.js                 Đăng ký route và khởi động ứng dụng
    ├── api/                   Tầng truy cập dữ liệu
    │   ├── users.js
    │   ├── classes.js
    │   ├── lectures.js
    │   ├── quizzes.js
    │   └── submissions.js
    └── views/                 Tầng giao diện
        ├── login.js
        ├── admin.js
        ├── teacher.js
        ├── student.js
        └── shared.js
```

---

## 2. Thiết lập Supabase (một lần)

1. Truy cập <https://supabase.com>, tạo một **Project** mới (miễn phí).
2. Vào **SQL Editor** → **New query**, dán toàn bộ nội dung file [`database/schema.sql`](database/schema.sql) và bấm **Run**.
   - Lệnh này tạo tất cả bảng, các hàm bảo mật, chính sách RLS, bucket lưu trữ `lms-files`, và **tài khoản admin mặc định**.
   - Nếu dòng tạo bucket/policy Storage báo lỗi (tùy quyền dự án), hãy vào **Storage** tạo thủ công một bucket **public** tên `lms-files`.
3. Vào **Project Settings → API**, sao chép:
   - **Project URL**
   - **anon public key**

---

## 3. Cấu hình dự án

Mở [`js/config.js`](js/config.js) và điền 2 giá trị vừa lấy:

```js
export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

---

## 4. Chạy ứng dụng

Vì dự án dùng ES Modules, **không mở trực tiếp bằng `file://`** — cần một máy chủ tĩnh cục bộ. Chọn một trong các cách:

```bash
# Cách 1: Node.js
npx serve .

# Cách 2: Python
python -m http.server 5173

# Cách 3: VS Code
Cài extension "Live Server" → chuột phải index.html → "Open with Live Server"
```

Mở trình duyệt tại địa chỉ máy chủ hiển thị (ví dụ `http://localhost:5173`).

---

## 5. Tài khoản mặc định & Luồng sử dụng

**Admin mặc định:**

| Email | Mật khẩu |
|---|---|
| `admin@lms.com` | `admin123` |

> Hãy đăng nhập và đổi mật khẩu admin (hoặc sửa trong SQL) trước khi dùng thực tế.

**Luồng chuẩn:**

1. **Admin** đăng nhập → tạo tài khoản **Giáo viên** và **Học sinh**, cấp email/mật khẩu cho họ.
2. **Giáo viên** đăng nhập → **Tạo lớp học** (hệ thống tự sinh *Mã lớp*) → đăng bài giảng, tạo bài tập trắc nghiệm, xem bảng điểm.
3. **Học sinh** đăng nhập → nhập **Mã lớp** để tham gia → xem bài giảng, làm trắc nghiệm và nhận điểm tự động.

---

## 6. Sơ đồ cơ sở dữ liệu

`users` · `classes` · `class_students` · `lectures` · `quizzes` · `questions` · `submissions` — đúng theo schema yêu cầu (quiz có thêm cột `is_published` cho trạng thái hiển thị và `pdf_url` cho file đề bài).

Chấm điểm được thực hiện bởi hàm `submit_quiz` trên máy chủ: đối chiếu đáp án học sinh với `correct_option`, tính điểm trên thang 10 và lưu vào `submissions`. Đáp án đúng **không** bao giờ được gửi về trình duyệt học sinh.

---

## 6b. Bài tập trắc nghiệm dạng PDF + LaTeX

- **Giáo viên** tải lên **file PDF đề bài** (chứa câu hỏi và các phương án A/B/C/D). Với mỗi câu, chỉ cần **chọn đáp án đúng**; phần nội dung phương án có thể để trống (đọc trong PDF) hoặc gõ vào, **hỗ trợ công thức LaTeX** như `$x^2$` hoặc `$$\int_0^1 x\,dx$$`.
- **Học sinh** thấy **PDF đề bài** và **phiếu trả lời riêng** (Câu 1…N). Công thức toán trong phần phương án/câu hỏi được render bằng **KaTeX** (`index.html` đã nhúng sẵn KaTeX + auto-render qua CDN).
- Nếu đã cài database từ trước, chạy thêm [`database/migration_pdf_quiz.sql`](database/migration_pdf_quiz.sql) trong SQL Editor để thêm cột `quizzes.pdf_url` và cho phép nội dung câu hỏi/phương án để trống. Cài mới thì `schema.sql` đã bao gồm sẵn.

---

## 7. Ghi chú bảo mật

- Mật khẩu lưu dưới dạng **băm bcrypt** (`pgcrypto`), không lưu dạng thô.
- Các thao tác nhạy cảm (tạo/xoá tài khoản, đổi mật khẩu, lấy đáp án đúng) đi qua **hàm RPC `SECURITY DEFINER`** có kiểm tra vai trò; bảng `users` bị khóa đọc trực tiếp qua RLS.
- Đây là mô hình phù hợp cho môi trường học tập/nội bộ. Khi triển khai sản xuất quy mô lớn, nên nâng cấp sang **Supabase Auth + RLS chặt theo `auth.uid()`** để có bảo mật đầu-cuối mạnh hơn.
