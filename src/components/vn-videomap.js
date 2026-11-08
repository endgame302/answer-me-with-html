// Video notes: the video map. Each part on a timeline drawn to scale, with its time range, linked to the moment it starts.
// One `title | start` per line (start as m:ss, h:mm:ss or seconds); the video's end is the frontmatter's length, or end=1:25:40.
import { esc } from '../svg/text.js';
import { ComponentError, contentLines } from './error.js';
import { vn, seconds, clock, videoAt } from '../video-notes/state.js';

export default {
  name: 'videomap',
  summary: 'Video notes: the parts of the video on a timeline drawn to scale',
  syntax: '```videomap [end=1:25:40]\nModels and what to learn | 0:00\n*Agent loops | 45:19\n```\n- * highlights a part. The end defaults to the frontmatter length.',
  example: '```videomap end=30:00\nSetup | 0:00\n*The main idea | 8:20\nWrap-up | 26:00\n```',
  render(text, { args, uid }) {
    const end = seconds(args.match(/\bend=(\S+)/)?.[1]) || vn.length;
    if (!end) throw new ComponentError('videomap needs the video length: length: in the frontmatter, or end= on the fence line', 0);
    const rows = contentLines(text).map(({ text: line, line: at }) => {
      const bar = line.lastIndexOf('|');
      if (bar < 0) throw new ComponentError('videomap: write each part as title | start', at);
      const hot = line.startsWith('*');
      const title = line.slice(hot ? 1 : 0, bar).trim();
      const start = seconds(line.slice(bar + 1));
      if (start >= end) throw new ComponentError(`videomap: ${clock(start)} is not before the end (${clock(end)})`, at);
      return { title, start, hot, at };
    });
    rows.forEach((r, i) => {
      if (i && r.start <= rows[i - 1].start) throw new ComponentError('videomap: list the parts in time order', r.at);
      r.end = rows[i + 1]?.start ?? end;
    });
    const W = 720, left = 300, right = 700, top = 46, rowH = 40;
    const X = (s) => left + (s * (right - left)) / end;
    const minutes = end / 60;
    const step = minutes > 120 ? 30 : minutes > 40 ? 10 : 5;
    let g = '';
    for (let m = 0; m <= minutes; m += step) {
      g += `<line x1="${X(m * 60)}" x2="${X(m * 60)}" y1="${top - 6}" y2="${top + rowH * rows.length}" class="vn-map-tick"/><text x="${X(m * 60)}" y="${top - 12}" class="vn-map-small" text-anchor="middle">${m}</text>`;
    }
    rows.forEach((r, i) => {
      const y = top + 22 + rowH * i;
      const href = videoAt(r.start);
      const label = `<text x="12" y="${y - 2}" class="vn-map-label">${esc(r.title)}</text><text x="12" y="${y + 14}" class="vn-map-small">${clock(r.start)} to ${clock(r.end)} · ${Math.round((r.end - r.start) / 60)} min</text>`;
      const rect = `<rect x="${X(r.start)}" y="${y - 12}" width="${Math.max(3, X(r.end) - X(r.start))}" height="20" rx="4" class="vn-map-bar${r.hot ? ' vn-map-bar--hot' : ''}"/>`;
      g += href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${label}${rect}</a>` : label + rect;
    });
    const h = top + rowH * rows.length + 8;
    return `<figure class="am-diagram vn-map"><svg viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-label="Video map: ${esc(rows.map((r) => r.title).join(', '))}" xmlns="http://www.w3.org/2000/svg"><text x="${left}" y="16" class="vn-map-small">minutes</text>${g}</svg></figure>`;
  },
};
