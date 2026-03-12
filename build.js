const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Read all parts
const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(publicDir, 'styles.css'), 'utf8');
const dataJs = fs.readFileSync(path.join(publicDir, 'data.js'), 'utf8');
const appJs = fs.readFileSync(path.join(publicDir, 'app.js'), 'utf8');

// 1. Replace <link rel="stylesheet" href="styles.css"> with inlined <style>
let result = html.replace(
    '<link rel="stylesheet" href="styles.css">',
    `<style>\n${css}\n</style>`
);

// 2. Replace <script src="data.js"></script> with inlined script
result = result.replace(
    '<script src="data.js"></script>',
    `<script>\n${dataJs}\n</script>`
);

// 3. Replace <script src="app.js"></script> with inlined script
result = result.replace(
    '<script src="app.js"></script>',
    `<script>\n${appJs}\n</script>`
);

// Write the combined file to the project root
const outputPath = path.join(__dirname, 'career-pathfinder.html');
fs.writeFileSync(outputPath, result, 'utf8');

const sizeKB = Math.round(fs.statSync(outputPath).size / 1024);
console.log(`✅ Built: career-pathfinder.html (${sizeKB} KB)`);
console.log(`   → Upload this single file to GitHub Pages and you're live!`);
