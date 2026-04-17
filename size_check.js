const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !f.includes('.next') && !f.includes('node_modules') && !f.includes('.git')) {
      walkDir(dirPath, callback);
    } else if (!isDirectory) {
      callback(dirPath);
    }
  });
}

let totalSize = 0;
let fileCount = 0;

walkDir('D:\\ai\\imp\\ai ad crative to webpage', (file) => {
  const stats = fs.statSync(file);
  if (stats.size > 0) {
    totalSize += stats.size;
    fileCount++;
  }
});

console.log(`Files: ${fileCount}, Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);