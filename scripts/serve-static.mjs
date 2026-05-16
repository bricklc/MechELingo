import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? '5173', 10);
const host = process.env.HOST ?? '127.0.0.1';

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
]);

function getSafePath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://${host}:${port}`).pathname);
  const requested = normalize(pathname).replace(/^[/\\]+/, '');
  const filePath = resolve(join(root, requested || 'index.html'));

  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    return null;
  }

  return filePath;
}

const server = createServer(async (request, response) => {
  const safePath = getSafePath(request.url ?? '/');

  if (!safePath) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Forbidden');
    return;
  }

  try {
    const fileStat = await stat(safePath);
    const filePath = fileStat.isDirectory() ? join(safePath, 'index.html') : safePath;
    const type = contentTypes.get(extname(filePath)) ?? 'application/octet-stream';

    response.writeHead(200, { 'Content-Type': type });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, host, () => {
  console.log(`MechELingo is running at http://${host}:${port}`);
  console.log('Press Ctrl+C to stop the server.');
});
