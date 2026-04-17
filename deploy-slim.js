const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const deployEndpoint = 'https://claude-skills-deploy.vercel.com/api/deploy';

const IGNORE_DIRS = ['.next', 'node_modules', '.git', '.kilo'];
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'project.zip', 'deploy-slim.js', 'deploy.js', 'deploy.ps1', 'size_check.js'];

const fileList = [];

function walkDir(dir) {
  if (!fs.statSync(dir).isDirectory()) {
    fileList.push({ path: dir, isDir: false });
    return;
  }
  
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    if (stats.isDirectory()) {
      if (!IGNORE_DIRS.includes(item)) {
        walkDir(fullPath);
      }
    } else if (!IGNORE_FILES.includes(item)) {
      fileList.push({ path: fullPath, relativePath });
    }
  }
}

walkDir('D:\\ai\\imp\\ai ad crative to webpage');

console.log(`Found ${fileList.length} files to deploy`);

const archive = zlib.createGzip();
let chunks = [];

archive.on('data', chunk => chunks.push(chunk));
archive.on('end', () => {
  const body = Buffer.concat(chunks);
  
  const boundary = '----FormBoundary' + Date.now().toString(36);
  
  const preamble = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="project.tgz"\r\n` +
    `Content-Type: application/gzip\r\n\r\n`
  );
  
  const epilogue = Buffer.from(
    `\r\n--${boundary}\r\n` +
    `Content-Disposition: form-data; name="framework"\r\n\r\n` +
    `nextjs\r\n--${boundary}--\r\n`
  );
  
  const finalBody = Buffer.concat([preamble, body, epilogue]);
  
  console.log(`Uploading ${(finalBody.length / 1024 / 1024).toFixed(2)} MB...`);
  
  const options = {
    hostname: 'claude-skills-deploy.vercel.com',
    port: 443,
    path: '/api/deploy',
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': finalBody.length
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        console.log(json.previewUrl ? `Preview URL: ${json.previewUrl}` : data);
        console.log(json.claimUrl ? `Claim URL: ${json.claimUrl}` : '');
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  req.on('error', e => console.error('Error:', e.message));
  req.write(finalBody);
  req.end();
});

const tar = require('child_process').spawn('tar', ['-czf', '-', '-C', 'D:\\ai\\imp\\ai ad crative to webpage', '--exclude=.next', '--exclude=node_modules', '--exclude=.git', '--exclude=.kilo', '--exclude=package-lock.json', '--exclude=yarn.lock', '--exclude=pnpm-lock.yaml', '.']);

tar.stdout.pipe(archive);

tar.on('close', code => {
  if (code !== 0) {
    console.error('tar exited with code', code);
  }
});