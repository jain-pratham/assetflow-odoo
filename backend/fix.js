const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'controllers');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    
    // Replace literal backslash+backtick with just backtick
    content = content.replace(/\\`/g, '`');
    // Replace literal backslash+dollar with just dollar
    content = content.replace(/\\\$/g, '$');
    
    fs.writeFileSync(p, content);
  }
});
console.log('Fixed syntax errors.');
