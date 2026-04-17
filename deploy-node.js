const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');

const projectRoot = 'D:\\ai\\imp\\ai ad crative to webpage';
const deployEndpoint = 'https://claude-skills-deploy.vercel.com/api/deploy';

const IGNORE_DIRS = ['.next', 'node_modules', '.git', '.kilo'];
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'project.zip', 'deploy.js', 'deploy.ps1', 'deploy-node.js', 'deploy-slim.js', 'size_check.js'];

const files = [];

function walkDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        walkDir(fullPath);
      }
    } else if (!IGNORE_FILES.includes(item)) {
      const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
      files.push({ path: fullPath, relativePath });
    }
  }
}

walkDir(projectRoot);
console.log(`Found ${files.length} files`);

const archiver = require('zlib');

let totalSize = files.reduce((sum, f) => sum + fs.statSync(f.path).size, 0);
console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

const gzip = archiver.createGzip({ level: 9 });
let chunks = [];

gzip.on('data', chunk => chunks.push(chunk));
gzip.on('end', () => {
  const body = Buffer.concat(chunks);
  console.log(`Compressed: ${(body.length / 1024 / 1024).toFixed(2)} MB`);
  
  const boundary = '----FormBoundary' + Date.now().toString(36);
  
  const header = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="project.tgz"\r\n` +
    `Content-Type: application/gzip\r\n\r\n`
  );
  
  const footer = Buffer.from(
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="framework"\r\n\r\n` +
    `nextjs\r\n--${boundary}--\r\n`
  );
  
  const requestBody = Buffer.concat([header, body, footer]);
  
  console.log(`Uploading...`);
  
  const options = {
    hostname: 'claude-skills-deploy.vercel.com',
    port: 443,
    path: '/api/deploy',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': requestBody.length
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const obj = JSON.parse(data);
        if (obj.previewUrl) console.log(`Preview URL: ${obj.previewUrl}`);
        if (obj.claimUrl) console.log(`Claim URL: ${obj.claimUrl}`);
        if (obj.error) console.log(`Error: ${obj.error}`);
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  req.on('error', e => console.error('Error:', e.message));
  req.write(requestBody);
  req.end();
});

let index = 0;

function processNext() {
  if (index >= files.length) {
    gzip.end();
    return;
  }
  
  const file = files[index++];
  const content = fs.readFileSync(file.path);
  const line = `${file.relativePath}\n${content.length}\n${content.toString('base64')}\n`;
  gzip.write(line);
  
  if (index % 50 === 0) console.log(`Processed ${index}/${files.length}`);
  
  setImmediate(processNext);
}

console.log('Starting compression...');
processNext();