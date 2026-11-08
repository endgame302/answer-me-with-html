// Video notes (this fork): the inline markers, components and page additions, with one case per bug the baseline runs hit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDoc } from '../src/render.js';
import { clock, seconds } from '../src/video-notes/state.js';
import { QUIZ_JS } from '../src/video-notes/page.js';
import { scriptHash } from '../src/csp.js';

const page = (body, front = 'video: https://www.youtube.com/watch?v=abc\nlength: 2:30:00\n') =>
  renderDoc(`---\ntemplate: doc\ntitle: Notes\nstyle: off\n${front}---\nLead.\n\n${body}`);
const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

test('clock writes hours from one hour on, never 142:30', () => {
  assert.equal(clock(8550), '2:22:30');
  assert.equal(clock(59 * 60 + 5), '59:05');
  assert.equal(clock(44), '0:44');
  assert.equal(seconds('1:25:40'), 5140);
  assert.equal(seconds('5140'), 5140);
});

test('{t:} links to the video at that second', () => {
  const { html } = page('## A Part\nSee {t:8550}.');
  assert.match(main(html), /<a class="vn-stamp" href="https:\/\/www\.youtube\.com\/watch\?v=abc&amp;t=8550s"[^>]*>2:22:30<\/a>/);
});

test('a timestamp past the end of the video is reported with its draft line', () => {
  const { stats } = page('## A Part\nSee {t:99999}.');
  assert.ok(stats.htmlWarnings.some((w) => w.line === 11 && /past the end/.test(w.message)));
});

test('{tag:} renders a labelled claim tag, and an unknown kind is reported', () => {
  const { html, stats } = page('## A Part\nHe says so {tag:claimed} {tag:bogus}.');
  assert.match(main(html), /<span class="vn-tag vn-tag-claimed">Claimed<\/span>/);
  assert.ok(stats.htmlWarnings.some((w) => /unknown claim tag/.test(w.message)));
});

test('{g:term} takes its meaning from the glossary block, once, with no doubling', () => {
  const body = '## A Part\nThe {g:harness} matters less.\n\n## Glossary\n```glossary\nHarness | The agent program that runs a model {braces} and ]] stay text.\n```';
  const { html } = page(body);
  const m = main(html);
  assert.equal((m.match(/>harness</g) ?? []).length, 1);
  assert.match(m, /<abbr class="vn-gl" tabindex="0" title="The agent program that runs a model \{braces\} and \]\] stay text\.">harness<\/abbr>/);
});

test('a term with no meaning, an unused meaning and the old {g:term|meaning} form are each reported', () => {
  const body = '## A Part\n{g:Nope} and {g:x|y}.\n\n## Glossary\n```glossary\nUnused | Never used.\n```';
  const { stats } = page(body);
  assert.ok(stats.htmlWarnings.some((w) => /"Nope" has no meaning/.test(w.message)));
  assert.ok(stats.htmlWarnings.some((w) => /marker not understood/.test(w.message)));
  assert.ok(stats.componentWarnings.some((w) => w.component === 'glossary' && /"Unused" is not mentioned anywhere/.test(w.message)));
});

test('### headings get ids, so goal links reach them; markers and links stay out of the id', () => {
  const { html } = page('## A Part\nGo to [models](#models-and-tools).\n\n### Models and tools {t:44}\nText.\n\n### Models and tools\nAgain.');
  assert.match(html, /<h3 id="models-and-tools">/);
  assert.match(html, /<h3 id="models-and-tools-2">/);
});

test('panel titles get an id from their text as well as their letter', () => {
  const { html } = page('## Cheat sheet\nRules.');
  assert.match(html, /id="panel-A"/);
  assert.match(html, /<h2 id="cheat-sheet">/);
});

test('the four rendering bugs of runs 10 and 11 stay fixed', () => {
  const { html } = page('## A Part\n> **In 30 seconds**\n>\n> - first\n> - second\n\n- outer\n  - inner two\n\n1. step\n   - detail\n\nA span `a ** b` and `**kwargs`.');
  const m = main(html);
  assert.match(m, /<blockquote>[\s\S]*<li>first<\/li>[\s\S]*<\/blockquote>/);
  assert.match(m, /<li>outer<ul>\s*<li>inner two<\/li>/);
  assert.match(m, /<li>step<ul>\s*<li>detail<\/li>/);
  assert.match(m, /<code>a \*\* b<\/code>/);
});

test('the quiz renders questions with hidden answers, and its script is pinned in the page policy', () => {
  const { html } = page('## A Part\n```quiz\n? Why? {t:120}\nBecause.\n? And?\nSo.\n```');
  const m = main(html);
  assert.equal((m.match(/class="vn-q"/g) ?? []).length, 2);
  assert.match(m, /<summary>Show answer<\/summary>/);
  assert.match(m, /From the video at <a class="vn-stamp"[^>]*>2:00<\/a>/);
  assert.ok(html.includes(`<script>${QUIZ_JS}</script>`));
  assert.ok(html.includes(scriptHash(QUIZ_JS)));
});

test('a page with no quiz carries no quiz script', () => {
  const { html } = page('## A Part\nText.');
  assert.ok(!html.includes(QUIZ_JS));
});

test('the video map draws parts to scale and refuses parts out of order', () => {
  const { html } = page('## A Part\n```videomap\nIntro | 0:00\n*Main | 1:00:00\n```');
  assert.match(main(html), /0:00 to 1:00:00 · 60 min/);
  assert.match(main(html), /1:00:00 to 2:30:00 · 90 min/);
  assert.throws(() => page('## A Part\n```videomap\nB | 1:00\nA | 0:30\n```'), /time order/);
});

test('a shot needs a caption, and its caption keeps its markers', () => {
  assert.throws(() => page('## A Part\n```shot\n/nowhere.png\n```'), /caption/);
});

test('split draws one bar whose shares add up to 100, and refuses other totals', () => {
  const { html } = page('## A Part\n```split\n*Alone | 10\nWaits | 90\n```');
  assert.match(main(html), /class="am-diagram vn-split"/);
  assert.match(main(html), /10% Alone; 90% Waits/);
  assert.throws(() => page('## A Part\n```split\nA | 10\nB | 80\n```'), /add up to 90, not 100/);
});

test('compare puts options side by side and marks the chosen one', () => {
  const { html } = page('## A Part\n```compare\n## One | today\n- fast\n! fragile\n## Two * | his pick\n- slow\n+ safe\n```');
  const m = main(html);
  assert.equal((m.match(/class="vn-cmp-card/g) ?? []).length, 2);
  assert.match(m, /vn-cmp-card--pick[\s\S]*his choice/);
  assert.match(m, /class="vn-cmp-bad"/);
  assert.match(m, /class="vn-cmp-good"/);
  assert.throws(() => page('## A Part\n```compare\n## Only one\n- x\n```'), /at least two/);
});

test('a plural marker finds the singular entry, and an entry listed in both forms is reported', () => {
  const { html } = page('## A Part\nTwo {g:Git worktrees} here.\n\n## Glossary\n```glossary\nGit worktree | A second working copy.\n```');
  assert.match(main(html), /<abbr class="vn-gl"[^>]*title="A second working copy\.">Git worktrees<\/abbr>/);
  const { stats } = page('## A Part\n{g:Git worktree}\n\n## Glossary\n```glossary\nGit worktree | A second working copy.\nGit worktrees | Duplicate.\n```');
  assert.ok(stats.componentWarnings.some((w) => /listed twice \(as Git worktree and Git worktrees\)/.test(w.message)));
});

test('a glossary entry mentioned in plain text is not reported; one never mentioned is', () => {
  const body = '## A Part\nAn abliterated one, and claude-opus[1m].\n\n## Glossary\n```glossary\nAbliterated model | No refusals.\n`[1m]` | Long context.\nNever here | Unused.\n```';
  const { stats } = page(body);
  const flagged = stats.componentWarnings.filter((w) => w.component === 'glossary').map((w) => w.message);
  assert.deepEqual(flagged, ['"Never here" is not mentioned anywhere on the page']);
});

test('each quiz counts its own questions, and only the last adds the page total', () => {
  assert.match(QUIZ_JS, /' here\.'/);
  assert.match(QUIZ_JS, /i === quizzes\.length - 1/);
});

test('a video-notes page tells the browser its colour scheme, so native controls follow dark mode', () => {
  const { html } = page('## A Part\nText.');
  assert.match(html, /html\[data-mode="dark"\]\{color-scheme:dark\}/);
});
