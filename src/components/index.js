// Component registry: fenced-block language name → component. Each component exports { name, summary, syntax, example, render(text, ctx) }.
import callout from './callout.js';
import kv from './kv.js';
import timeline from './timeline.js';
import annot from './annot.js';
import tree from './tree.js';
import limits from './limits.js';
import sequence from './sequence.js';
import flow from './flow.js';
import er from './er.js';
import ask from './ask.js';
import chart from './chart.js';
// Video notes (this fork): self-test, glossary, screenshot, video map.
import quiz from './vn-quiz.js';
import glossary from './vn-glossary.js';
import shot from './vn-shot.js';
import videomap from './vn-videomap.js';
import split from './vn-split.js';
import compare from './vn-compare.js';

export { ComponentError } from './error.js';

const ALL = [callout, kv, timeline, annot, tree, limits, chart, sequence, flow, er, ask, quiz, glossary, shot, videomap, split, compare];

export const COMPONENTS = new Map(ALL.map((c) => [c.name, c]));
export const RAW_LANGS = new Set(['html', 'svg']);
