import {
  delay,
  escapeXml,
  formatExact,
  possessive,
  renderFrame,
  renderNoActivity,
} from './common.js';

const WIDTH = 400;
const HEIGHT = 200;
const PERIOD = 100;

const r1 = (n) => Math.round(n * 10) / 10;

// A wave across one card width plus a period, so sliding it by a period loops seamlessly.
function wave(amplitude, phase) {
  let d = `M0 ${r1(amplitude * Math.sin(phase))}`;
  for (let x = 4; x <= WIDTH + PERIOD; x += 4) {
    d += `L${x} ${r1(amplitude * Math.sin((x / PERIOD) * Math.PI * 2 + phase))}`;
  }
  return `${d}V${HEIGHT * 2}H0Z`;
}

/**
 * Progress towards a contribution goal (`goal=`, default 1000) over the last
 * twelve months: the card fills up like a tank, with gently moving waves.
 */
export function renderGoal(stats, options) {
  const title = options.customTitle ?? `${possessive(stats.name)} Contribution Goal`;
  const a = stats.activity;
  if (!a) return renderNoActivity(stats, options, { width: WIDTH, height: HEIGHT, title });
  const share = a.total / options.goal;
  const level = Math.min(1, share);
  const surface = r1(HEIGHT - level * (HEIGHT - 12));
  const percent = `${Math.floor(share * 100)}%`;
  const status = share >= 1 ? 'Goal reached!' : `${formatExact(options.goal - a.total)} to go`;
  const { radius } = options;

  const liquid = `<clipPath id="ags-tank"><rect width="${WIDTH}" height="${HEIGHT}" rx="${radius}"/></clipPath>
    <g clip-path="url(#ags-tank)">
      <g class="fill-up" style="--depth:${r1(HEIGHT - surface)}px">
        <g transform="translate(0 ${surface})">
          <g class="wave" style="animation-duration:7s"><path d="${wave(5, 0)}" class="liquid" opacity=".22"/></g>
          <g class="wave" style="animation-duration:11s;animation-direction:reverse"><path d="${wave(4, 2)}" class="liquid" opacity=".18"/></g>
        </g>
      </g>
    </g>`;

  const body = `${liquid}
    <g class="rise"${delay(options, 300)}>
      <text x="${WIDTH / 2}" y="112" class="percent" text-anchor="middle">${percent}</text>
      <text x="${WIDTH / 2}" y="140" class="detail" text-anchor="middle">${escapeXml(`${formatExact(a.total)} of ${formatExact(options.goal)} contributions`)}</text>
      <text x="${WIDTH / 2}" y="160" class="status" text-anchor="middle">${escapeXml(status)}</text>
      <text x="${WIDTH / 2}" y="180" class="period" text-anchor="middle">in the last 12 months</text>
    </g>`;

  const css = `
    .percent{font-size:44px;font-weight:800;fill:var(--title)}
    .detail{font-size:13px;font-weight:600;fill:var(--text)}
    .status{font-size:12px;font-weight:700;fill:var(--accent)}
    .period{font-size:11px;fill:var(--muted)}
    .liquid{fill:var(--title)}
    ${
      options.animate
        ? `@keyframes ags-fill-up{from{transform:translateY(var(--depth))}to{transform:none}}
    .fill-up{animation:ags-fill-up 2.2s cubic-bezier(.22,1,.36,1) forwards}
    @keyframes ags-wave{to{transform:translateX(-${PERIOD}px)}}
    .wave{animation:ags-wave 8s linear infinite}
    @media (prefers-reduced-motion: reduce){.fill-up,.wave{animation:none}}`
        : ''
    }`;

  return renderFrame({
    width: WIDTH,
    height: HEIGHT,
    theme: options.theme,
    options,
    title,
    body,
    css,
    label: `${stats.name}: ${formatExact(a.total)} of ${formatExact(options.goal)} contributions goal, ${percent}`,
  });
}
