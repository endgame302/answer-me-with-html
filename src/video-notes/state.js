// Video notes: study notes for one video. The draft's frontmatter names the video (`video:` its URL, `length:` its length),
// and the text uses three inline markers: {t:SECONDS} a timestamp link, {tag:kind} a claim tag, {g:term} a glossary term whose
// meaning is in the page's ```glossary block. This module holds what one page render needs to know about them.
import { esc } from '../svg/text.js';

export const TAGS = Object.freeze({
  shown: 'Shown working',
  claimed: 'Claimed',
  opinion: 'Opinion',
  sponsor: 'His own product',
  version: 'Version-specific',
  notchecked: 'Not checked',
  outside: 'From outside the video',
  notes: 'Added by these notes',
  differs: 'Video ≠ source',
  screen: 'Shown on screen',
});

// One page at a time: renderDoc calls resetVideoNotes before it renders any block.
export const vn = { video: '', length: 0, glossary: new Map(), used: new Set() };

// 1:25:40 or 25:40 or 5140 → seconds.
export function seconds(value) {
  const text = String(value ?? '').trim();
  if (!text) return 0;
  if (/^\d+$/.test(text)) return Number(text);
  const parts = text.split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((total, n) => total * 60 + n, 0);
}

// Seconds → m:ss, or h:mm:ss from one hour on (never 142:30).
export function clock(total) {
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
}

export function videoAt(s) {
  if (!vn.video) return '';
  const joiner = vn.video.includes('?') ? '&' : '?';
  return `${vn.video}${joiner}t=${Math.floor(s)}s`;
}

export function stampHtml(s) {
  const href = videoAt(s);
  return href
    ? `<a class="vn-stamp" href="${esc(href)}" target="_blank" rel="noopener">${clock(s)}</a>`
    : `<span class="vn-stamp">${clock(s)}</span>`;
}

// The ```glossary block: `term | meaning` per line. Read before rendering, so a {g:term} anywhere on the page finds its meaning.
export function readGlossary(text) {
  const entries = new Map();
  text.split('\n').forEach((line, i) => {
    const bar = line.indexOf('|');
    if (bar < 0 || !line.trim()) return;
    const term = line.slice(0, bar).trim();
    const meaning = line.slice(bar + 1).trim();
    if (term && meaning && !entries.has(term.toLowerCase())) entries.set(term.toLowerCase(), { term, meaning, line: i });
  });
  return entries;
}

export function resetVideoNotes(meta, source) {
  vn.video = typeof meta.video === 'string' ? meta.video.trim() : '';
  vn.length = seconds(meta.length);
  vn.used = new Set();
  vn.glossary = new Map();
  vn.glossaryLine = 0;
  const fence = /^(`{3,})glossary[^\n]*\n([\s\S]*?)^\1\s*$/m.exec(source);
  if (fence) {
    vn.glossary = readGlossary(fence[2]);
    vn.glossaryLine = source.slice(0, fence.index).split('\n').length; // the fence line, 1-based
  }
}
