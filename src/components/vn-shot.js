// Video notes: a checked screenshot with a Markdown caption (timestamps, bold callout numbers, code). First line: the image path.
import { mdInline } from '../markdown.js';
import { esc } from '../svg/text.js';
import { ComponentError } from './error.js';

export default {
  name: 'shot',
  summary: 'Video notes: a screenshot with a formatted caption',
  syntax: '```shot\n/absolute/path/to/frame.jpg\nWhat the frame shows ({t:363}). **1** the part to look at.\n```',
  // A 1-pixel data: image, so the example renders anywhere (theme specimens render every example).
  example: '```shot\ndata:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=\nHis board of 15 concepts.\n```',
  render(text) {
    const lines = text.split('\n');
    const first = lines.findIndex((l) => l.trim());
    if (first < 0) throw new ComponentError('shot needs an image path on its first line', 1);
    const path = lines[first].trim();
    const caption = lines.slice(first + 1).join(' ').trim();
    if (!caption) throw new ComponentError('shot needs a caption under the image path: say what the frame shows', first + 2);
    const alt = caption.replace(/\{t:\d+\}|\{tag:\w+\}|\{g:([^}]+)\}/g, '$1').replace(/[*`]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    return `<figure class="vn-shot"><img src="${esc(path)}" alt="${esc(alt)}"><figcaption>${mdInline(caption)}</figcaption></figure>`;
  },
};
