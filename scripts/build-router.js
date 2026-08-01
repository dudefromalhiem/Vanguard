import fs from 'fs';
import path from 'path';

const API_DIR = path.resolve('./api');
const ROUTES_DIR = path.join(API_DIR, '_routes');

// Get all JS files in a directory recursively
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      getFiles(path.join(dir, file), fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

// Ensure _routes directory exists
if (!fs.existsSync(ROUTES_DIR)) {
  fs.mkdirSync(ROUTES_DIR, { recursive: true });
}

// Move admin, member, public into _routes
['admin', 'member', 'public'].forEach(folder => {
  const srcPath = path.join(API_DIR, folder);
  const destPath = path.join(ROUTES_DIR, folder);
  if (fs.existsSync(srcPath)) {
    // We rename synchronously
    fs.renameSync(srcPath, destPath);
  }
});

// Generate router
const routeFiles = getFiles(ROUTES_DIR);
let imports = '';
let routeMap = 'const routes = {\n';

routeFiles.forEach((file, index) => {
  const relPath = path.relative(ROUTES_DIR, file).replace(/\\/g, '/');
  // API path will be like /api/admin/polls
  const apiPath = `/api/${relPath.replace(/\.js$/, '')}`;
  const importName = `route_${index}`;
  
  imports += `import ${importName} from './_routes/${relPath}';\n`;
  routeMap += `  '${apiPath}': ${importName},\n`;
});

routeMap += '};\n';

const routerCode = `${imports}
${routeMap}
export default async function handler(req, res) {
  try {
    let pathname = '';
    
    // Vercel catch-all passes req.query.slug array
    if (req.query && req.query.slug) {
      const slugArr = Array.isArray(req.query.slug) ? req.query.slug : [req.query.slug];
      pathname = '/api/' + slugArr.join('/');
    } else if (req.url) {
      pathname = req.url.split('?')[0];
    }
    
    // Normalize trailing slash
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    
    // Exact match
    let routeHandler = routes[pathname];
    
    if (routeHandler) {
      return await routeHandler(req, res);
    } else {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Route not found: ' + pathname }));
    }
  } catch (err) {
    console.error('Router execution error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
`;

fs.writeFileSync(path.join(API_DIR, '[...slug].js'), routerCode);
console.log('Successfully generated catch-all router!');
