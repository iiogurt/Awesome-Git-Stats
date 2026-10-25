import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TEX_CSS, tex } from '../src/render/tex.js';

const plain = (svg) => svg.replace(/<[^>]+>/g, '');

describe('tex', () => {
  it('sets variables in italic and numbers and operators upright, spaced like TeX', () => {
    const svg = tex('\\hat{C}(t) = 3.49t + 62');
    assert.match(svg, /^<tspan class="tex">/);
    assert.match(svg, /<tspan class="tex-i">Ĉ<\/tspan>/);
    assert.equal(plain(svg), 'Ĉ(t) = 3.49t + 62');
  });

  it('knows Greek letters, symbols and operator names', () => {
    assert.equal(plain(tex('\\mu = 1,\\ \\sigma = 2')), 'μ = 1, σ = 2');
    assert.match(tex('\\mu'), /class="tex-i">μ/);
    assert.equal(plain(tex('\\Sigma\\star')), 'Σ★');
    assert.doesNotMatch(tex('\\Sigma'), /tex-i/);
    assert.equal(plain(tex('s \\propto r')), 's ∝ r');
    assert.match(tex('\\ell_{\\max}'), /font-size="70%">max</);
  });

  it('tells unary from binary minus', () => {
    assert.equal(plain(tex('x - 1')), 'x − 1');
    assert.equal(plain(tex('-1')), '−1');
    assert.equal(plain(tex('r^{-\\alpha}')).replace('\u200b', ''), 'r−α');
  });

  it('raises and lowers scripts and returns to the baseline', () => {
    const svg = tex('R^2 = 1');
    assert.match(
      svg,
      /<tspan dy="-0\.571em" font-size="70%">2<\/tspan><tspan dy="0\.4em" dx="\.08em"> = 1<\/tspan>/,
    );
    // A trailing script gets an empty tspan that resets the baseline for the text after it.
    assert.match(tex('i_{10}'), /<tspan dy="-0\.25em">\u200b<\/tspan><\/tspan>$/);
    // Stacked limits: the superscript moves back over the subscript.
    assert.match(tex('\\int_0^t'), /dx="-0\.5em"/);
  });

  it('keeps upright text and escapes it', () => {
    assert.equal(plain(tex('\\text{a < b}')), 'a &lt; b');
    assert.equal(plain(tex('P(c > 0)')), 'P(c &gt; 0)');
    assert.equal(plain(tex('\\unknown')), '\\unknown');
  });

  it('embeds the fonts as data URIs', () => {
    assert.match(TEX_CSS, /@font-face\{font-family:ags-tex;font-style:italic;/);
    assert.match(TEX_CSS, /url\(data:font\/woff2;base64,/);
    assert.doesNotMatch(TEX_CSS, /url\((?!data:)/);
  });
});
