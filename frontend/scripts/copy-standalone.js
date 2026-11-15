const fs = require('fs');
const path = require('path');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const frontendDir = path.resolve(__dirname, '..');
const standaloneFrontend = path.join(frontendDir, '.next', 'standalone', 'frontend');
const standaloneRoot = path.join(frontendDir, '.next', 'standalone');

if (fs.existsSync(standaloneFrontend)) {
  copyDirSync(path.join(frontendDir, '.next', 'static'), path.join(standaloneFrontend, '.next', 'static'));
  copyDirSync(path.join(frontendDir, 'public'), path.join(standaloneFrontend, 'public'));
  console.log('✓ Copied static and public to .next/standalone/frontend');
}

if (fs.existsSync(standaloneRoot)) {
  copyDirSync(path.join(frontendDir, '.next', 'static'), path.join(standaloneRoot, '.next', 'static'));
  copyDirSync(path.join(frontendDir, 'public'), path.join(standaloneRoot, 'public'));
  console.log('✓ Copied static and public to .next/standalone');
}
