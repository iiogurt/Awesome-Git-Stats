import { TEX_FONTS } from './tex-fonts.js';

/**
 * A little TeX for SVG text. `tex('\\hat{C}(t) = 3.49t + 62')` returns tspans set in the
 * embedded Computer Modern fonts: italic variables, upright digits, operators and Greek
 * capitals, spacing around relations and binary operators, sub- and superscripts and
 * accents. Only the commands below are known; anything else is set as written.
 */

const SYMBOLS = {
  alpha: 'α',
  theta: 'θ',
  mu: 'μ',
  sigma: 'σ',
  tau: 'τ',
  chi: 'χ',
  ell: 'ℓ',
  Sigma: 'Σ',
  int: '∫',
  propto: '∝',
  therefore: '∴',
  emptyset: '∅',
  langle: '⟨',
  rangle: '⟩',
  star: '★',
  cdot: '·',
  gt: '>',
  lt: '<',
};
// Operator names, set upright: \max, \log, …
const OPERATORS = new Set(['max', 'min', 'log', 'exp', 'sin', 'cos']);
const ACCENTS = { hat: '̂', bar: '̄' };
const RELATIONS = new Set(['=', '<', '>', '∝']);
const BINARY = new Set(['+', '−', '·']);
const ITALIC = /[A-Za-zαθμστχ]/;

// Shifts in em of the base size; scripts are set at 70%.
const SCRIPT = 0.7;
const SHIFT = { sub: 0.25, sup: -0.4 };

/** The @font-face rules and classes a card needs to show `tex()` output. */
export const TEX_CSS = `${TEX_FONTS}
  .tex{font-family:ags-tex,'Latin Modern Math','Cambria Math','Times New Roman',serif;font-style:normal;letter-spacing:0}
  .tex-i{font-style:italic}`;

function parseGroup(source, start) {
  // `start` is just after "{": return the inner text and the index after the matching "}".
  let depth = 1;
  let i = start;
  while (i < source.length && depth) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') depth -= 1;
    i += 1;
  }
  return [source.slice(start, depth ? i : i - 1), i];
}

// One argument of a command or script: a {group}, a \command or a single character.
function argument(source, start) {
  if (source[start] === '{') return parseGroup(source, start + 1);
  if (source[start] === '\\') {
    const name = /^\\([A-Za-z]+|.)/.exec(source.slice(start))[0];
    return [name, start + name.length];
  }
  return [source[start] ?? '', start + 1];
}

/** Parse TeX into atoms `{ text, italic, script }`; `script` is 'sub', 'sup' or null. */
function atoms(source, script = null, upright = false) {
  const out = [];
  const push = (text, italic = false) => out.push({ text, italic: italic && !upright, script });
  // A character or symbol: relations and binary operators get spaces, letters are italic.
  const symbol = (text) => {
    const previous = out.at(-1);
    const unary = !previous || previous.script !== script || /[([{=<>∝,]\s*$/.test(previous.text);
    if (!script && RELATIONS.has(text)) push(` ${text} `);
    else if (!script && BINARY.has(text) && !unary) push(` ${text} `);
    else push(text, ITALIC.test(text));
  };
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\') {
      const name = /^\\([A-Za-z]+|.)/.exec(source.slice(i))[1];
      i += name.length + 1;
      if (OPERATORS.has(name)) {
        push(name);
      } else if (name === 'text' || name === 'mathrm') {
        const [inner, next] = argument(source, i);
        i = next;
        push(inner.replace(/\\,/g, ' '));
      } else if (ACCENTS[name]) {
        const [inner, next] = argument(source, i);
        i = next;
        const base = atoms(inner, script, upright);
        if (base.length) base.at(-1).text += ACCENTS[name];
        out.push(...base);
      } else if (name === ',' || name === ' ') {
        push(' ');
      } else if (SYMBOLS[name]) {
        symbol(SYMBOLS[name]);
      } else {
        push(`\\${name}`);
      }
    } else if (ch === '_' || ch === '^') {
      const [inner, next] = argument(source, i + 1);
      i = next;
      out.push(...atoms(inner, ch === '_' ? 'sub' : 'sup', upright));
    } else if (ch === '{') {
      const [inner, next] = parseGroup(source, i + 1);
      i = next;
      out.push(...atoms(inner, script, upright));
    } else if (ch === ' ') {
      i += 1; // spacing in math comes from the operators, as in TeX
    } else {
      i += 1;
      symbol(ch === '-' ? '−' : ch);
    }
  }
  return out;
}

const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const em = (n) => `${Number(n.toFixed(3))}em`;

/** Set a TeX formula as SVG tspans (for use inside a `<text>`). */
export function tex(source) {
  const list = atoms(String(source));
  let html = '';
  let shift = 0; // current baseline offset, in em of the base size
  let lastScript = null;
  let scriptWidth = 0;
  for (let i = 0; i < list.length; i++) {
    const atom = list[i];
    // Merge runs of the same style so the markup stays small.
    let text = atom.text;
    while (
      list[i + 1] &&
      list[i + 1].italic === atom.italic &&
      list[i + 1].script === atom.script
    ) {
      text += list[++i].text;
    }
    const target = atom.script ? SHIFT[atom.script] : 0;
    const attrs = [];
    if (target !== shift) {
      // dy is measured in the tspan's own font size.
      attrs.push(`dy="${em((target - shift) / (atom.script ? SCRIPT : 1))}"`);
      // TeX's \scriptspace: a little room after the scripts before the next symbol.
      if (!atom.script) attrs.push('dx=".08em"');
    }
    // A superscript right after a subscript (∫₀ᵗ) stacks above it, as in TeX.
    if (atom.script === 'sup' && lastScript === 'sub') {
      attrs.push(`dx="${em(-scriptWidth / SCRIPT)}"`);
    }
    shift = target;
    if (atom.italic) attrs.push('class="tex-i"');
    if (atom.script) attrs.push(`font-size="${SCRIPT * 100}%"`);
    html += attrs.length ? `<tspan ${attrs.join(' ')}>${escape(text)}</tspan>` : escape(text);
    scriptWidth = atom.script === 'sub' ? [...text].length * 0.5 * SCRIPT : 0;
    lastScript = atom.script;
  }
  if (shift) html += `<tspan dy="${em(-shift)}">\u200b</tspan>`;
  return `<tspan class="tex">${html}</tspan>`;
}
