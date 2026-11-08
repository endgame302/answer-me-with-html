// Video notes: what the page needs once every block is rendered: the styles for the markers and components, the self-test
// script (pinned by its hash, like am's own scripts), and a warning for each glossary entry the page never uses.
import { pinScript } from '../csp.js';
import { vn } from './state.js';
import { headingSlug } from '../markdown.js';

export const VN_CSS = `
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
.am-md h3{font-size:var(--am-fs-heading)}
`;

export const QUIZ_JS = `(() => {
  const boxes = [...document.querySelectorAll('.vn-q-box')];
  if (!boxes.length) return;
  const key = 'vn-quiz:' + document.title;
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { saved = {}; }
  const show = () => {
    const n = boxes.filter((b) => b.checked).length;
    document.querySelectorAll('.vn-quiz-count').forEach((p) => { p.textContent = 'You can answer ' + n + ' of ' + boxes.length + ' questions on this page.'; });
  };
  boxes.forEach((b) => {
    b.checked = !!saved[b.id];
    b.addEventListener('change', () => { saved[b.id] = b.checked; try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) { /* private window */ } show(); });
  });
  show();
})();`;

export function finishVideoNotes(html, stats) {
  // Only a video-notes page (frontmatter video:) changes; any other page stays exactly as upstream renders it.
  if (!vn.video) return html;
  for (const [key, entry] of vn.glossary) {
    if (!vn.used.has(key)) stats.componentWarnings?.push({ line: vn.glossaryLine + entry.line + 1, component: 'glossary', message: `"${entry.term}" is never used as {g:${entry.term}} on the page` });
  }
  // Panel titles get an id from their text too, so a link such as #cheat-sheet reaches the panel (its letter id stays).
  const anchored = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (all, inner) => `<h2 id="${headingSlug(inner.replace(/<a\s[\s\S]*?<\/a>/g, ''))}">${inner}</h2>`);
  const styled = anchored.replace('</head>', `<style>${VN_CSS}</style>\n</head>`);
  if (!styled.includes('class="vn-quiz"')) return styled;
  return pinScript(styled.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>${QUIZ_JS}</script>\n</body>`), QUIZ_JS);
}
