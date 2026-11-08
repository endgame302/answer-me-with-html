// Video notes: a self-test. Each question starts with "? ", may end with {t:SECONDS} (where the video answers it),
// and the lines after it, up to the next "? ", are the answer. The reader ticks the questions they can answer and opens the answer to check.
import { md, mdInline } from '../markdown.js';
import { esc } from '../svg/text.js';
import { ComponentError } from './error.js';
import { stampHtml } from '../video-notes/state.js';

export default {
  name: 'quiz',
  summary: 'Video notes: self-test questions with hidden answers and a count of the ones you know',
  syntax: `\`\`\`quiz
? Why does the harness matter less and less? {t:120}
Engineers told him a strong model with a terminal does well in any harness.
? Next question
Its answer (Markdown, several lines allowed)
\`\`\``,
  example: '```quiz\n? What is his rule for one thread? {t:542}\nOne clear task per thread; fork anything else.\n```',
  pageOnly: true,
  render(text, { uid }) {
    const items = [];
    text.split('\n').forEach((raw, i) => {
      const line = raw.trimEnd();
      if (line.startsWith('? ')) items.push({ q: line.slice(2).trim(), a: [], line: i + 1 });
      else if (items.length) items.at(-1).a.push(raw);
      else if (line.trim()) throw new ComponentError('quiz: start each question with "? "', i + 1);
    });
    if (!items.length) throw new ComponentError('quiz needs at least one "? question" line', 1);
    const rows = items.map(({ q, a, line }) => {
      const at = q.match(/\s*\{t:(\d+)\}\s*$/);
      const question = at ? q.slice(0, at.index) : q;
      const answer = a.join('\n').trim();
      if (!answer) throw new ComponentError('quiz: this question has no answer under it', line);
      const id = uid();
      const when = at ? `<p class="vn-when">From the video at ${stampHtml(Number(at[1]))}</p>` : '';
      return `<li class="vn-q"><label><input type="checkbox" class="vn-q-box" id="${id}"><span>${mdInline(question)}</span></label><details><summary>Show answer</summary><div class="am-md">${md(answer)}</div>${when}</details></li>`;
    });
    return `<div class="vn-quiz"><ul>${rows.join('')}</ul><p class="vn-quiz-count" aria-live="polite">Tick the questions you can answer.</p></div>`;
  },
};
