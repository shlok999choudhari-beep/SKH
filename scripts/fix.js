const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(process.cwd(), 'src/app/api'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('error.errors')) {
    content = content.replace(/error\.errors/g, '(error as z.ZodError).errors');
    changed = true;
  }
  
  if (content.includes('required_error:')) {
    content = content.replace(/\{ required_error: '[^']+' \}/g, '');
    changed = true;
  }
  
  if (content.includes('JSON.parse(resume.analysisData)')) {
    content = content.replace(/JSON\.parse\(resume\.analysisData\)/g, 'JSON.parse(resume.analysisData || "{}")');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
  }
}
