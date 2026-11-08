// The three inline markers of video notes, as marked extensions: {t:SECONDS}, {tag:kind}, {g:term}.
// `note(at, message)` reports a problem with the marker as the draft wrote it; the render shows it with its draft line.
import { esc } from '../svg/text.js';
import { TAGS, vn, clock, stampHtml, findTerm } from './state.js';

const plain = (text) => text.replace(/`([^`]*)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

export function videoNotesInline(note) {
  const marker = (name, pattern, render) => ({
    name,
    level: 'inline',
    // Every marker starts with {, so one indexOf finds the next possible one (a regex per call made long lines slow).
    start: (src) => {
      const i = src.indexOf('{');
      return i < 0 ? undefined : i;
    },
    tokenizer(src) {
      const m = pattern.exec(src);
      if (m) return { type: name, raw: m[0], m: [...m] };
      return undefined;
    },
    renderer: (token) => render(token.m, token.raw),
  });
  return {
    // marked tries the extensions registered last first, so the catch-all for unknown markers comes first here.
    extensions: [
      // A marker the page does not know, such as {g:term|meaning} or {t:1:20}, is reported instead of showing as text silently.
      marker('vnUnknown', /^\{(?:t|tag|g):[^}\n]*\}/, ([raw]) => {
        note(raw, 'marker not understood: use {t:SECONDS}, {tag:kind} or {g:term}');
        return esc(raw);
      }),
      marker('vnStamp', /^\{t:(\d+)\}/, ([, s], raw) => {
        const at = Number(s);
        if (!vn.video) note(raw, 'timestamp without a video: add video: <url> to the frontmatter');
        if (vn.length && at > vn.length) note(raw, `timestamp ${clock(at)} is past the end of the video (${clock(vn.length)})`);
        return stampHtml(at);
      }),
      marker('vnTag', /^\{tag:([a-z]+)\}/, ([, kind], raw) => {
        if (!TAGS[kind]) note(raw, `unknown claim tag; use one of ${Object.keys(TAGS).join(', ')}`);
        return `<span class="vn-tag vn-tag-${esc(kind)}">${esc(TAGS[kind] ?? kind)}</span>`;
      }),
      marker('vnTerm', /^\{g:([^{}|\n]+)\}/, ([, term], raw) => {
        const [key, entry] = findTerm(term);
        if (!entry) {
          note(raw, `glossary term "${term.trim()}" has no meaning in the page's glossary block`);
          return esc(term);
        }
        vn.used.add(key);
        return `<abbr class="vn-gl" tabindex="0" title="${esc(plain(entry.meaning))}">${esc(term)}</abbr>`;
      }),
    ],
  };
}
