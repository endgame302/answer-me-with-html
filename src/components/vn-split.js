// Video notes: one whole split into shares, drawn as a single bar (a 10 / 90 rule, a time budget).
// One `label | share` per line; the shares add up to 100. * highlights a share.
import { esc } from '../svg/text.js';
import { ComponentError, contentLines } from './error.js';

export default {
  name: 'split',
  summary: 'Video notes: one whole split into shares, as a single bar',
  syntax: '```split\n*Runs on its own: the safest cases | 10\nWaits for your OK | 90\n```\n- The shares add up to 100. * highlights a share.',
  example: '```split\n*Autonomous | 10\nWaits for you | 90\n```',
  render(text, { uid }) {
    const rows = contentLines(text).map(({ text: line, line: at }) => {
      const bar = line.lastIndexOf('|');
      if (bar < 0) throw new ComponentError('split: write each share as label | number', at);
      const hot = line.startsWith('*');
      const share = Number(line.slice(bar + 1).replace('%', '').trim());
      if (!Number.isFinite(share) || share <= 0) throw new ComponentError('split: a share is a number above 0', at);
      return { label: line.slice(hot ? 1 : 0, bar).trim(), share, hot };
    });
    if (rows.length < 2) throw new ComponentError('split needs at least two shares', 1);
    const total = rows.reduce((sum, r) => sum + r.share, 0);
    if (Math.abs(total - 100) > 0.5) throw new ComponentError(`split: the shares add up to ${total}, not 100`, 1);
    const W = 720, left = 12, right = 708, y = 14, h = 44;
    let x = left;
    let bars = '';
    let keys = '';
    rows.forEach((r, i) => {
      const w = ((right - left) * r.share) / 100;
      bars += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" class="vn-split-bar${r.hot ? ' vn-split-bar--hot' : ''}"/><text x="${x + w / 2}" y="${y + h / 2 + 6}" text-anchor="middle" class="vn-split-pct">${r.share}%</text>`;
      keys += `<text x="${left}" y="${y + h + 26 + i * 22}" class="vn-split-key"><tspan class="vn-split-pct">${r.share}%</tspan>  ${esc(r.label)}</text>`;
      x += w;
    });
    const height = y + h + 16 + rows.length * 22;
    return `<figure class="am-diagram vn-split"><svg viewBox="0 0 ${W} ${height}" width="${W}" height="${height}" role="img" aria-label="${esc(rows.map((r) => `${r.share}% ${r.label}`).join('; '))}" xmlns="http://www.w3.org/2000/svg">${bars}${keys}</svg></figure>`;
  },
};
