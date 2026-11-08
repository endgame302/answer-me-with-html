// Video notes: side-by-side options (ways to run agents, tools, plans), each a card with its points and an outcome.
// A card starts with "## Title | subtitle" (add * after the title to mark the speaker's choice); "- " lines are its points;
// a line starting with "+ " is a good outcome, "! " a problem.
import { mdInline } from '../markdown.js';
import { esc } from '../svg/text.js';
import { ComponentError } from './error.js';

export default {
  name: 'compare',
  summary: 'Video notes: options side by side, each with its points and outcome',
  syntax: '```compare\n## Main checkout | all agents on your machine\n- one checkout, one CPU\n! they edit the same files\n## Cloud sandbox * | his choice\n- each agent its own computer\n+ contained if one is hacked\n```',
  example: '```compare\n## Option A | today\n- fast\n! fragile\n## Option B * | his pick\n- slower\n+ safe\n```',
  render(text) {
    const cards = [];
    text.split('\n').forEach((raw, i) => {
      const line = raw.trim();
      if (!line) return;
      const head = line.match(/^##\s+(.+?)(\s\*)?\s*(?:\|\s*(.*))?$/);
      if (head) {
        cards.push({ title: head[1].trim(), pick: Boolean(head[2]), sub: (head[3] ?? '').trim(), items: [] });
        return;
      }
      if (!cards.length) throw new ComponentError('compare: start each option with "## Title | subtitle"', i + 1);
      const kind = line.startsWith('+ ') ? 'good' : line.startsWith('! ') ? 'bad' : line.startsWith('- ') ? 'point' : null;
      if (!kind) throw new ComponentError('compare: start each line with "- " (a point), "+ " (good outcome) or "! " (problem)', i + 1);
      cards.at(-1).items.push({ kind, text: line.slice(2).trim() });
    });
    if (cards.length < 2) throw new ComponentError('compare needs at least two options', 1);
    const html = cards.map((c) => {
      const points = c.items.filter((x) => x.kind === 'point').map((x) => `<li>${mdInline(x.text)}</li>`).join('');
      const outcomes = c.items.filter((x) => x.kind !== 'point').map((x) => `<p class="vn-cmp-${x.kind}"><span aria-hidden="true">${x.kind === 'good' ? '✓' : '✗'}</span> ${mdInline(x.text)}</p>`).join('');
      const pick = c.pick ? '<span class="vn-cmp-pick">his choice</span>' : '';
      return `<div class="vn-cmp-card${c.pick ? ' vn-cmp-card--pick' : ''}"><div class="vn-cmp-title">${mdInline(c.title)} ${pick}</div>${c.sub ? `<div class="vn-cmp-sub">${mdInline(c.sub)}</div>` : ''}${points ? `<ul>${points}</ul>` : ''}${outcomes}</div>`;
    }).join('');
    return `<div class="vn-compare" style="--vn-cols:${cards.length}">${html}</div>`;
  },
};
