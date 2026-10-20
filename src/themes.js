/**
 * Built-in themes. Every theme defines the same colour tokens:
 *   bg, border, title, text, muted, accent (star colour), track (bar background)
 * Optional extras:
 *   gradient     [angleDegrees, ...colors] background
 *   dark         a full token set used when the viewer prefers dark mode
 *   art          background art style from src/render/art.js
 *   art1..art3   colours for the art (default: accent, title, accent)
 *   font         'sans' (default), 'mono' or 'serif'
 *   glow         neon glow on the title, big numbers and star icons
 *   borderWidth  border thickness in px (default 1)
 */
const light = {
  bg: '#ffffff',
  border: '#e4e2e2',
  title: '#1f2328',
  text: '#424a53',
  muted: '#6e7781',
  accent: '#e3b341',
  track: '#eaeef2',
};

const dark = {
  bg: '#0d1117',
  border: '#30363d',
  title: '#e6edf3',
  text: '#c9d1d9',
  muted: '#8b949e',
  accent: '#f2cc60',
  track: '#21262d',
};

export const themes = {
  default: light,
  light,
  dark,
  auto: { ...light, dark },
  github_dark: {
    bg: '#161b22',
    border: '#30363d',
    title: '#58a6ff',
    text: '#c9d1d9',
    muted: '#8b949e',
    accent: '#f2cc60',
    track: '#21262d',
  },
  tokyonight: {
    bg: '#1a1b27',
    border: '#2a2e45',
    title: '#70a5fd',
    text: '#c0caf5',
    muted: '#565f89',
    accent: '#bf91f3',
    track: '#24283b',
  },
  dracula: {
    bg: '#282a36',
    border: '#44475a',
    title: '#ff79c6',
    text: '#f8f8f2',
    muted: '#a4a7c2',
    accent: '#f1fa8c',
    track: '#44475a',
  },
  nord: {
    bg: '#2e3440',
    border: '#3b4252',
    title: '#88c0d0',
    text: '#e5e9f0',
    muted: '#a3abbd',
    accent: '#ebcb8b',
    track: '#3b4252',
  },
  gruvbox: {
    bg: '#282828',
    border: '#3c3836',
    title: '#fabd2f',
    text: '#ebdbb2',
    muted: '#a89984',
    accent: '#fe8019',
    track: '#3c3836',
  },
  catppuccin: {
    bg: '#1e1e2e',
    border: '#313244',
    title: '#cba6f7',
    text: '#cdd6f4',
    muted: '#a6adc8',
    accent: '#f9e2af',
    track: '#313244',
  },
  catppuccin_latte: {
    bg: '#eff1f5',
    border: '#ccd0da',
    title: '#8839ef',
    text: '#4c4f69',
    muted: '#6c6f85',
    accent: '#df8e1d',
    track: '#ccd0da',
  },
  rose_pine: {
    bg: '#191724',
    border: '#26233a',
    title: '#ebbcba',
    text: '#e0def4',
    muted: '#908caa',
    accent: '#f6c177',
    track: '#26233a',
  },
  solarized_light: {
    bg: '#fdf6e3',
    border: '#eee8d5',
    title: '#268bd2',
    text: '#586e75',
    muted: '#839496',
    accent: '#b58900',
    track: '#eee8d5',
  },
  solarized_dark: {
    bg: '#002b36',
    border: '#073642',
    title: '#268bd2',
    text: '#93a1a1',
    muted: '#839496',
    accent: '#b58900',
    track: '#073642',
  },
  monokai: {
    bg: '#272822',
    border: '#3e3d32',
    title: '#f92672',
    text: '#f8f8f2',
    muted: '#a59f85',
    accent: '#e6db74',
    track: '#3e3d32',
  },
  radical: {
    bg: '#141321',
    border: '#2a2843',
    title: '#fe428e',
    text: '#a9fef7',
    muted: '#8e8ba8',
    accent: '#f8d847',
    track: '#2a2843',
  },
  sunset: {
    bg: '#2b1055',
    gradient: [35, '#2b1055', '#7a1f5c', '#d5573b'],
    border: '#ffffff33',
    title: '#ffffff',
    text: '#ffe9d6',
    muted: '#ffc9a8',
    accent: '#ffd166',
    track: '#ffffff26',
  },
  aurora: {
    bg: '#0b1d2a',
    gradient: [30, '#0b1d2a', '#0f3b46', '#174d3f'],
    border: '#ffffff22',
    title: '#7ef9c4',
    text: '#d8fff1',
    muted: '#8fc9b5',
    accent: '#ffe066',
    track: '#ffffff1f',
  },
  ocean: {
    bg: '#0a2540',
    gradient: [20, '#0a2540', '#13456b', '#1b6a8f'],
    border: '#ffffff22',
    title: '#7fdbff',
    text: '#e0f4ff',
    muted: '#9cc7e0',
    accent: '#ffd23f',
    track: '#ffffff1f',
  },
  candy: {
    bg: '#fff0f6',
    gradient: [25, '#fff0f6', '#f3e8ff', '#e0f2fe'],
    border: '#f5d0e4',
    title: '#c026d3',
    text: '#4a3557',
    muted: '#8a6f99',
    accent: '#f59e0b',
    track: '#00000014',
  },

  // Artistic themes: palette + background art (+ font and glow).
  starry_night: {
    bg: '#0b1026',
    gradient: [160, '#0b1026', '#1b1446', '#2d1b4e'],
    border: '#ffffff1f',
    title: '#f3e9ff',
    text: '#d9d4f2',
    muted: '#9d95c9',
    accent: '#ffd166',
    track: '#ffffff1a',
    art: 'starfield',
    art2: '#ffffff',
  },
  constellation: {
    bg: '#0d1b2a',
    gradient: [200, '#0d1b2a', '#1b263b'],
    border: '#ffffff1f',
    title: '#e0e1dd',
    text: '#cfd6e0',
    muted: '#8d9db6',
    accent: '#9bd1ff',
    track: '#ffffff1a',
    art: 'constellation',
    art2: '#ffffff',
  },
  northern_lights: {
    bg: '#04141f',
    gradient: [170, '#020b12', '#04141f', '#062a2e'],
    border: '#7cf5c633',
    title: '#b8fff1',
    text: '#d6f5ee',
    muted: '#86b3ab',
    accent: '#7cf5c6',
    track: '#ffffff1a',
    art: 'aurora',
    art1: '#2de2a6',
    art3: '#7b6cff',
  },
  synthwave: {
    bg: '#241046',
    gradient: [180, '#1a0b3b', '#3b1366', '#6b1a6e'],
    border: '#ff6ad566',
    title: '#ff6ad5',
    text: '#f5e9ff',
    muted: '#c7a6ff',
    accent: '#00f0ff',
    track: '#ffffff22',
    art: 'synthwave',
    art1: '#ff6ad5',
    art2: '#ffcc00',
    glow: true,
  },
  cyberpunk: {
    bg: '#0a0a12',
    border: '#fcee0a',
    title: '#fcee0a',
    text: '#e6f6ff',
    muted: '#5ee7ff',
    accent: '#ff2a6d',
    track: '#ffffff1a',
    art: 'circuit',
    art1: '#05d9e8',
    font: 'mono',
    glow: true,
  },
  terminal: {
    bg: '#0c0f0a',
    border: '#39ff1455',
    title: '#39ff14',
    text: '#b6ffb0',
    muted: '#5fa85a',
    accent: '#39ff14',
    track: '#1a2a18',
    art: 'scanlines',
    font: 'mono',
    glow: true,
  },
  blueprint: {
    bg: '#0b3d91',
    gradient: [160, '#0d47a8', '#0a2f6e'],
    border: '#9fb8e8',
    title: '#ffffff',
    text: '#dbe7ff',
    muted: '#9fb8e8',
    accent: '#ffd166',
    track: '#ffffff26',
    art: 'blueprint',
    art1: '#ffffff',
    font: 'mono',
  },
  parchment: {
    bg: '#f4ecd8',
    border: '#d9c9a3',
    title: '#3b2f2f',
    text: '#4a3f35',
    muted: '#7d6b5d',
    accent: '#b5651d',
    track: '#00000014',
    art: 'grain',
    font: 'serif',
  },
  topographic: {
    bg: '#f1efe6',
    border: '#d8d4c4',
    title: '#2f4f3a',
    text: '#3c4a3e',
    muted: '#6f7d6a',
    accent: '#c8743a',
    track: '#00000012',
    art: 'topography',
    art1: '#8aa17f',
  },
  pop_art: {
    bg: '#fff200',
    border: '#111111',
    title: '#111111',
    text: '#111111',
    muted: '#3a3a3a',
    accent: '#e4002b',
    track: '#00000022',
    art: 'halftone',
    art1: '#e4002b',
    borderWidth: 3,
  },
  glass: {
    bg: '#eef2ff',
    gradient: [30, '#e9f0ff', '#f6eaff'],
    border: '#ffffff',
    title: '#3b3f73',
    text: '#424769',
    muted: '#7a7fa6',
    accent: '#ff8fab',
    track: '#3b3f7314',
    art: 'bokeh',
    art1: '#8ec5ff',
    art3: '#ffb3c6',
  },
  sakura: {
    bg: '#fff5f7',
    gradient: [20, '#fff7f9', '#ffe4ec'],
    border: '#ffd1dc',
    title: '#b0305c',
    text: '#5a3a45',
    muted: '#9b7280',
    accent: '#ff6f91',
    track: '#b0305c14',
    art: 'sakura',
    art1: '#ff9eb5',
    art3: '#ffc2d1',
  },
  deep_sea: {
    bg: '#001f3f',
    gradient: [180, '#002b52', '#001428'],
    border: '#7fdbff33',
    title: '#7fdbff',
    text: '#d3f1ff',
    muted: '#7aa7c7',
    accent: '#ffdc00',
    track: '#ffffff1a',
    art: 'waves',
    art1: '#1f8acb',
    art2: '#39cccc',
    art3: '#7fdbff',
  },
};

export const themeNames = Object.keys(themes);

const HEX = /^([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Normalise a user supplied colour ("fff", "#fff") or return null if invalid. */
export function parseColor(value) {
  if (typeof value !== 'string') return null;
  const hex = value.trim().replace(/^#/, '');
  return HEX.test(hex) ? `#${hex}` : null;
}

/**
 * Resolve a theme by name and apply colour overrides. Overriding the
 * background removes any gradient; any override removes the auto dark
 * variant so the user's colours are always respected.
 */
export function resolveTheme(name, overrides = {}) {
  const base = themes[name] || themes.default;
  const theme = { ...base };
  let overridden = false;
  for (const [key, value] of Object.entries(overrides)) {
    const color = parseColor(value);
    if (color && key in light) {
      theme[key] = color;
      overridden = true;
      if (key === 'bg') delete theme.gradient;
    }
  }
  if (overridden) delete theme.dark;
  return theme;
}
