import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

const requiredFiles = [
  'index.html',
  'src/app.js',
  'src/data.js',
  'src/sounds.js',
  'src/storage.js',
  'src/styles.css',
  'scripts/serve-static.mjs',
];

await Promise.all(requiredFiles.map((file) => access(file, constants.R_OK)));

const [html, app, data, styles, packageJson] = await Promise.all([
const [html, app, data, styles] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('src/app.js', 'utf8'),
  readFile('src/data.js', 'utf8'),
  readFile('src/styles.css', 'utf8'),
  readFile('package.json', 'utf8'),
]);

const expectedSnippets = [
  ['index.html', html, '<div id="app"></div>'],
  ['src/app.js', app, 'Power Plant Engineering'],
  ['src/app.js', app, 'Matching pairs'],
  ['src/data.js', data, "id: 'machine-design'"],
  ['src/data.js', data, "symbol: 'σ'"],
  ['src/styles.css', styles, '.subject-grid'],
  ['package.json', packageJson, 'node scripts/serve-static.mjs'],
];

for (const [file, contents, snippet] of expectedSnippets) {
  if (!contents.includes(snippet)) {
    throw new Error(`${file} is missing required snippet: ${snippet}`);
  }
}

console.log('Static app verification passed.');
