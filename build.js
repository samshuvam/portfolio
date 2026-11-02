import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

fs.copyFileSync(path.resolve('index.html'), path.join(distDir, 'index.html'));

if (fs.existsSync(path.resolve('CNAME'))) {
  fs.copyFileSync(path.resolve('CNAME'), path.join(distDir, 'CNAME'));
}

console.log('Build complete: static files copied to dist/');
