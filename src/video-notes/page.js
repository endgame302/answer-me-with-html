// Video notes: what the page needs once every block is rendered: the styles for the markers and components, the self-test
// script (pinned by its hash, like am's own scripts), and a warning for each glossary entry the page never mentions.
import { pinScript } from '../csp.js';
import { vn } from './state.js';
import { headingSlug } from '../markdown.js';

export const VN_CSS = `
html[data-mode="light"]{color-scheme:light}html[data-mode="dark"]{color-scheme:dark}
@media (prefers-color-scheme: dark){html[data-mode="auto"]{color-scheme:dark}}
.vn-stamp{font:600 .78em/1 var(--font-mono);padding:.15em .4em;border:1px solid var(--line-2);border-radius:999px;text-decoration:none;white-space:nowrap;color:var(--accent)}
a.vn-stamp:hover{background:var(--accent-bg)}
.vn-tag{display:inline-block;font:600 .7em/1.4 var(--font-sans);padding:0 .45em;border-radius:4px;border:1px solid currentColor;vertical-align:.12em;white-space:nowrap;color:var(--ink-2)}
.vn-tag-shown,.vn-tag-screen{color:var(--ok)}
.vn-tag-claimed,.vn-tag-notchecked,.vn-tag-differs{color:var(--warn)}
.vn-tag-sponsor{color:var(--err)}
.vn-tag-opinion,.vn-tag-version{color:var(--accent)}
.vn-gl{text-decoration:underline dotted;text-underline-offset:.2em;cursor:help}
.vn-shot{margin:1em 0}.vn-shot img{max-width:100%;height:auto;border:1px solid var(--line-2);border-radius:var(--radius)}
.vn-shot figcaption{font-size:var(--am-fs-small);color:var(--ink-2);margin-top:.4em}
.vn-quiz ul{list-style:none;padding:0}.vn-q{margin:.5em 0;padding:.5em .7em;border:1px solid var(--line-2);border-radius:var(--radius)}
.vn-q label{display:flex;gap:.6em;align-items:baseline;cursor:pointer}.vn-q details{margin:.3em 0 0 1.8em}.vn-q summary{cursor:pointer;color:var(--accent)}
.vn-when{font-size:var(--am-fs-small);color:var(--ink-2)}.vn-quiz-count{font-size:var(--am-fs-small);color:var(--ink-2)}
.vn-map text{fill:var(--ink)}.vn-map .vn-map-label{font:700 13px var(--font-sans)}.vn-map .vn-map-small{font:11.5px var(--font-sans);fill:var(--ink-2)}
.vn-map .vn-map-tick{stroke:var(--line-2)}.vn-map .vn-map-bar{fill:var(--fill);stroke:var(--line)}.vn-map .vn-map-bar--hot{fill:var(--accent-bg);stroke:var(--accent)}
.vn-map a:hover .vn-map-bar{stroke-width:2}
.vn-split .vn-split-bar{fill:var(--fill);stroke:var(--line)}.vn-split .vn-split-bar--hot{fill:var(--accent-bg);stroke:var(--accent)}
.vn-split .vn-split-pct{font:700 14px var(--font-sans);fill:var(--ink)}.vn-split .vn-split-key{font:13px var(--font-sans);fill:var(--ink-2)}
.vn-compare{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:.8em;margin:1em 0}
.vn-cmp-card{border:1px solid var(--line-2);border-radius:var(--radius);padding:.7em .9em}.vn-cmp-card--pick{border-color:var(--accent);background:var(--accent-bg)}
.vn-cmp-title{font-weight:700}.vn-cmp-sub{font-size:var(--am-fs-small);color:var(--ink-2)}
.vn-cmp-card ul{margin:.5em 0;padding-left:1.1em}.vn-cmp-card p{margin:.3em 0;font-size:var(--am-fs-small)}
.vn-cmp-good{color:var(--ok)}.vn-cmp-bad{color:var(--warn)}
.vn-cmp-pick{font:600 .7em/1.4 var(--font-sans);padding:0 .45em;border:1px solid var(--accent);border-radius:4px;color:var(--accent);vertical-align:.12em}
.am-md h3{font-size:var(--am-fs-heading)}
`;

// Each self-test counts its own questions; the last one on the page also gives the total.
export const QUIZ_JS = `(() => {
  const quizzes = [...document.querySelectorAll('.vn-quiz')];
  const boxes = [...document.querySelectorAll('.vn-q-box')];
  if (!boxes.length) return;
  const key = 'vn-quiz:' + document.title;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { saved = {}; }
  const known = (list) => list.filter((b) => b.checked).length;
  const show = () => {
    quizzes.forEach((q, i) => {
      const mine = [...q.querySelectorAll('.vn-q-box')];
      let text = 'You can answer ' + known(mine) + ' of ' + mine.length + ' here.';
      if (quizzes.length > 1 && i === quizzes.length - 1) text += ' On the whole page: ' + known(boxes) + ' of ' + boxes.length + '.';
      const p = q.querySelector('.vn-quiz-count');
      if (p) p.textContent = text;
    });
  };
  boxes.forEach((b) => {
    b.checked = !!saved[b.id];
    b.addEventListener('change', () => { saved[b.id] = b.checked; try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) { /* private window */ } show(); });
  });
  show();
})();`;

// The page's text outside the glossary table, for checking whether a glossary term is mentioned at all.
function pageText(html) {
  const main = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  return main
    .replace(/<div class="am-table-wrap vn-glossary">[\s\S]*?<\/table><\/div>/g, ' ')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .toLowerCase();
}

// A term counts as mentioned when any comma-separated part of it appears, or a multi-word part without its last word
// ("abliterated" for "Abliterated model"). A part starting with a letter or digit must start a word; one like [1m] need not.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentioned = (text, term) => term
  .replace(/`/g, '')
  .split(',')
  .map((part) => part.trim().toLowerCase())
  .filter(Boolean)
  .flatMap((part) => {
    const words = part.split(/\s+/);
    return words.length > 1 && words.slice(0, -1).join(' ').length >= 4 ? [part, words.slice(0, -1).join(' ')] : [part];
  })
  .some((part) => new RegExp(`${/^[\p{L}\p{N}]/u.test(part) ? '(^|[^\\p{L}\\p{N}])' : ''}${escapeRe(part)}`, 'u').test(text));

export function finishVideoNotes(html, stats) {
  // Only a video-notes page (frontmatter video:) changes; any other page stays exactly as upstream renders it.
  if (!vn.video) return html;
  // A glossary may double as a reference table, so a term only needs to appear somewhere on the page, marked or not.
  const text = pageText(html);
  for (const [key, entry] of vn.glossary) {
    if (vn.used.has(key) || mentioned(text, entry.term)) continue;
    stats.componentWarnings?.push({ line: vn.glossaryLine + entry.line + 1, component: 'glossary', message: `"${entry.term}" is not mentioned anywhere on the page` });
  }
  // Panel titles get an id from their text too, so a link such as #cheat-sheet reaches the panel (its letter id stays).
  const anchored = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (all, inner) => `<h2 id="${headingSlug(inner.replace(/<a\s[\s\S]*?<\/a>/g, ''))}">${inner}</h2>`);
  const styled = anchored.replace('</head>', `<style>${VN_CSS}</style>\n</head>`);
  if (!styled.includes('class="vn-quiz"')) return styled;
  return pinScript(styled.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>${QUIZ_JS}</script>\n</body>`), QUIZ_JS);
}
