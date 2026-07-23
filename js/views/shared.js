import { escapeHtml } from '../ui.js';
import { icon } from '../icons.js';

export function youtubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export function driveEmbed(url) {
  const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  const open = url.match(/[?&]id=([^&]+)/);
  if (open && url.includes('drive.google.com')) {
    return `https://drive.google.com/file/d/${open[1]}/preview`;
  }
  return null;
}

export function contentTypeMeta(type) {
  const map = {
    pdf: { label: 'PDF', name: 'doc', tint: 'bg-terra-500/10 text-terra-600' },
    video: { label: 'Video', name: 'video', tint: 'bg-brand-50 text-brand-700' },
    link: { label: 'Liên kết', name: 'link', tint: 'bg-accent-50 text-accent-700' },
  };
  const m = map[type] || map.link;
  return { label: m.label, tint: m.tint, icon: icon(m.name, 'h-5 w-5') };
}

export function renderLectureMedia(lecture) {
  const url = lecture.file_url;
  if (lecture.content_type === 'pdf') {
    return `<iframe src="${encodeURI(url)}" class="h-[70vh] w-full rounded-xl border border-slate-200" title="${escapeHtml(lecture.title)}"></iframe>
      <a href="${encodeURI(url)}" target="_blank" rel="noopener" class="mt-3 inline-block text-sm font-medium text-brand-700 underline">Mở PDF trong tab mới ↗</a>`;
  }
  if (lecture.content_type === 'video') {
    return `<video src="${encodeURI(url)}" controls class="w-full rounded-xl bg-black"></video>`;
  }
  const yt = youtubeId(url);
  if (yt) {
    return `<div class="aspect-video w-full overflow-hidden rounded-xl">
      <iframe src="https://www.youtube.com/embed/${yt}" class="h-full w-full" allowfullscreen title="${escapeHtml(lecture.title)}"></iframe>
    </div>`;
  }
  const drive = driveEmbed(url);
  if (drive) {
    return `<iframe src="${drive}" class="h-[70vh] w-full rounded-xl border border-slate-200" allowfullscreen title="${escapeHtml(lecture.title)}"></iframe>`;
  }
  return `<div class="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
    <p class="text-sm text-slate-500">Nội dung này được lưu ở liên kết ngoài.</p>
    <a href="${encodeURI(url)}" target="_blank" rel="noopener" class="mt-3 inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Mở liên kết ↗</a>
  </div>`;
}
