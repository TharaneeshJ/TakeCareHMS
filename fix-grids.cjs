const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('d:/TakeCareHMS/src/pages', function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Helper to replace matching patterns
    const replaceGrid = (regex, cls) => {
      content = content.replace(regex, match => {
        changed = true;
        // Clean up the removed style properties
        let newStyle = match
          .replace(/gridTemplateColumns:\s*['"][^'"]+['"]/g, '')
          .replace(/display:\s*['"]grid['"]/g, '')
          .replace(/,\s*,/g, ',')
          .replace(/{\s*,\s*/g, '{')
          .replace(/,\s*}/g, '}');
        
        // Remove empty style={{ gap: 16 }} or similar if only gap is left?
        // Actually, we can keep gap in style, or move it to class. Let's just keep gap in style.
        if (newStyle.replace(/\s/g, '') === 'style={{}}') {
          newStyle = '';
        } else {
          // If the original tag had style=... we prepend the class. 
          // We need to match the whole style prop. The regex matched the style object.
          // Wait, the regex needs to match the whole `style={{...}}`.
        }
        return `className="${cls}" ${newStyle}`;
      });
    };

    replaceGrid(/style={{[^}]*gridTemplateColumns:\s*['"]repeat\(4,\s*1fr\)['"][^}]*}}/g, 'grid-4');
    replaceGrid(/style={{[^}]*gridTemplateColumns:\s*['"]repeat\(3,\s*1fr\)['"][^}]*}}/g, 'grid-3');
    replaceGrid(/style={{[^}]*gridTemplateColumns:\s*['"]1fr\s+1fr['"][^}]*}}/g, 'grid-2');
    replaceGrid(/style={{[^}]*gridTemplateColumns:\s*['"]60fr\s+40fr['"][^}]*}}/g, 'grid-60-40');
    
    // Check for standard flex spaces that break
    replaceGrid(/style={{[^}]*justifyContent:\s*['"]space-between['"][^}]*}}/g, 'flex-responsive');

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
