import { createServer } from 'node:http';
import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import apiHandler from './api/[...slug].js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function createApiResponse(response) {
  return {
    get statusCode() { return response.statusCode; },
    set statusCode(value) { response.statusCode = value; },
    setHeader: response.setHeader.bind(response),
    status(code) {
      response.statusCode = code;
      return this;
    },
    json(body) {
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify(body));
      return body;
    },
    end: response.end.bind(response),
  };
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  let relativePath = decodeURIComponent(requestUrl.pathname);
  if (relativePath === '/') relativePath = '/index.html';
  if (!path.extname(relativePath)) relativePath += '.html';

  const filePath = path.resolve(root, `.${relativePath}`);
  if (!filePath.startsWith(root + path.sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const file = await fs.stat(filePath);
    if (!file.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
  }
}

const server = createServer(async (request, response) => {
  try {
    if (request.url.startsWith('/api/')) {
      const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      request.query = Object.fromEntries(requestUrl.searchParams.entries());
      await apiHandler(request, createApiResponse(response));
      return;
    }
    await serveStatic(request, response);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Internal server error');
  }
});

server.listen(port, () => {
  console.log(`Vanguard running at http://localhost:${port}`);
});
