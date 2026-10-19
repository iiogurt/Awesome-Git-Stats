import { escapeXml, renderFrame, truncate } from './common.js';

const WIDTH = 495;
const HEIGHT = 110;

const HINTS = {
  NOT_FOUND: 'Double-check the spelling of the username.',
  RATE_LIMITED: 'Too many requests right now. The card will be back shortly.',
  BAD_TOKEN: 'The server is misconfigured. Please open an issue.',
  BAD_REQUEST: 'Usage: /api/stars?username=YOUR_GITHUB_USERNAME',
  FORBIDDEN: 'This instance only serves cards for allowed accounts.',
};

/** Render a friendly, on-theme error card so a README never shows a broken image. */
export function renderError({ message, code }, options) {
  const hint = HINTS[code] ?? 'Please try again later.';
  const body = `
    <text x="25" y="68" class="err-msg">${escapeXml(truncate(message, WIDTH - 50, 14, 600))}</text>
    <text x="25" y="90" class="err-hint">${escapeXml(truncate(hint, WIDTH - 50, 12))}</text>`;
  const css = `
    .err-msg{font-size:14px;font-weight:600;fill:var(--text)}
    .err-hint{font-size:12px;fill:var(--muted)}`;
  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options: { ...options, hideTitle: false, animate: false },
    title: 'Awesome Git Stats',
    body,
    css,
    label: `Error: ${message}`,
  });
}
