const DELIMITERS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
  { left: '$', right: '$', display: false },
];

export function renderMath(root) {
  if (!root) return;
  let tries = 0;
  const attempt = () => {
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(root, { delimiters: DELIMITERS, throwOnError: false });
      } catch {}
    } else if (tries < 60) {
      tries += 1;
      setTimeout(attempt, 100);
    }
  };
  attempt();
}
