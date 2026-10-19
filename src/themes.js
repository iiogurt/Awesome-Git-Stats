/**
 * Built-in themes. Every theme defines the same colour tokens:
 *   bg, border, title, text, muted, accent (star colour), track (bar background)
 * A theme may also define `gradient: [angleDegrees, ...colors]` for the
 * background, and `dark` (a full token set) to follow the viewer's colour
 * scheme.
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
