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
    const url = new URL(req.url, \`http://\${req.headers.host}\`);
    let pathname = url.pathname;
    
    // Exact match
    let routeHandler = routes[pathname];
    
    // Handle optional trailing slash
    if (!routeHandler && pathname.endsWith('/')) {
      routeHandler = routes[pathname.slice(0, -1)];
    }
    
    if (routeHandler) {
      return routeHandler(req, res);
    } else {
      return res.status(404).json({ error: 'Route not found: ' + pathname });
    }
  } catch (err) {
    console.error('Router error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
`;

fs.writeFileSync(path.join(API_DIR, '[...slug].js'), routerCode);
console.log('Successfully generated catch-all router!');
