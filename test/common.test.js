import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { escapeXml, formatCount, formatExact, possessive, truncate } from '../src/render/common.js';

describe('formatCount', () => {
  it('keeps small numbers as is', () => {
    assert.equal(formatCount(0), '0');
    assert.equal(formatCount(999), '999');
  });

  it('abbreviates thousands and millions', () => {
    assert.equal(formatCount(1000), '1k');
    assert.equal(formatCount(1250), '1.3k');
    assert.equal(formatCount(17656), '17.7k');
    assert.equal(formatCount(123456), '123k');
    assert.equal(formatCount(2_500_000), '2.5M');
  });
});

describe('formatExact', () => {
  it('adds thousands separators', () => {
    assert.equal(formatExact(17656), '17,656');
  });
});

describe('escapeXml', () => {
  it('escapes markup characters', () => {
    assert.equal(
      escapeXml(`<a href="x">'&'</a>`),
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });
});

describe('truncate', () => {
  it('leaves short text alone', () => {
    assert.equal(truncate('repo', 200), 'repo');
  });

  it('adds an ellipsis when text is too long', () => {
    const result = truncate('a-really-long-repository-name-that-will-not-fit', 100, 13);
    assert.ok(result.endsWith('…'));
    assert.ok(result.length < 30);
  });
});

describe('possessive', () => {
  it('handles names ending with s', () => {
    assert.equal(possessive('Ada'), "Ada's");
    assert.equal(possessive('James'), "James'");
  });
});
