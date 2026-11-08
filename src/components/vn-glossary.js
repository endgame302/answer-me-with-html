// Video notes: the page's glossary. One `term | meaning` per line. A {g:term} anywhere on the page shows the meaning on hover or focus.
import { mdInline } from '../markdown.js';
import { esc } from '../svg/text.js';
import { ComponentError, contentLines } from './error.js';
import { termStem } from '../video-notes/state.js';

export default {
  name: 'glossary',
  summary: 'Video notes: terms and their meanings, used by {g:term} on the page',
  syntax: '```glossary\nHarness | The agent program that runs a model and gives it tools.\n```',
  example: '```glossary\nADE | Agent development environment: the app you run coding agents in.\n```',
  render(text, { warn }) {
    const seen = new Map();
    const rows = contentLines(text).map(({ text: line, line: at }) => {
      const bar = line.indexOf('|');
      if (bar < 0) throw new ComponentError('glossary: write each line as term | meaning', at);
      const term = line.slice(0, bar).trim();
      const meaning = line.slice(bar + 1).trim();
      if (!term || !meaning) throw new ComponentError('glossary: a line needs both a term and a meaning', at);
      const stem = termStem(term);
      if (seen.has(stem)) warn({ line: at, message: `glossary: "${term}" is listed twice (as ${seen.get(stem)} and ${term}); keep one` });
      else seen.set(stem, term);
      return `<tr><td>${mdInline(term)}</td><td>${mdInline(meaning)}</td></tr>`;
    });
    return `<div class="am-md"><div class="am-table-wrap vn-glossary"><table><thead><tr><th>Term</th><th>Meaning</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;
  },
};
