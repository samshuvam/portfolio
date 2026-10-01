// Projects overlay, split in two files so two translators can work in parallel.
import a from './projects-a.js';
import b from './projects-b.js';

export default { ne: { ...a.ne, ...b.ne }, mai: { ...a.mai, ...b.mai } };
