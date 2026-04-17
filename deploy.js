const fs = require('fs');
const path = require('path');
const https = require('https');

const filePath = path.join(__dirname, 'project.zip');
const deployEndpoint = 'https://claude-skills-deploy.vercel.com/api/deploy';

const fileBuffer = fs.readFileSync(filePath);
const boundary = '----FormBoundary' + Date.now().toString(36);

const parts = [
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="file"; filename="project.zip"\r\n` +
  `Content-Type: application/zip\r\n\r\n`,
  fileBuffer,
  `\r\n--${boundary}\r\n` +
  `Content-Disposition: form-data; name="framework"\r\n\r\n` +
  `nextjs\r\n--${boundary}--\r\n`
];

const body = Buffer.concat(parts.map(p => Buffer.isBuffer(p) ? p : Buffer.from(p)));

const options = {
  hostname: 'claude-skills-deploy.vercel.com',
  port: 443,
  path: '/api/deploy',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': body.length
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(body);
req.end();