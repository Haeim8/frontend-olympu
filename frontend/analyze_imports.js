const fs = require('fs');
const path = require('path');

const projectFiles = fs.readFileSync('project_files.txt', 'utf8')
  .split('\n')
  .filter(file => file.trim())
  .map(file => file.replace('./', ''));

const importedFiles = new Set();
const allFiles = new Set(projectFiles);

// Fonction pour normaliser les chemins d'import
function normalizeImportPath(importPath, currentFile) {
  if (importPath.startsWith('@/')) {
    return importPath.replace('@/', '');
  }
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const currentDir = path.dirname(currentFile);
    const resolved = path.resolve(currentDir, importPath);
    return path.relative('.', resolved);
  }
  return importPath;
}

// Analyser chaque fichier
projectFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) \!== null) {
      const importPath = match[1];
      
      // Ignorer les imports de packages npm
      if (\!importPath.startsWith('./') && \!importPath.startsWith('../') && \!importPath.startsWith('@/')) {
        continue;
      }
      
      const normalized = normalizeImportPath(importPath, file);
      
      // Essayer différentes extensions
      const extensions = ['', '.js', '.jsx', '.ts', '.tsx'];
      const possiblePaths = extensions.map(ext => normalized + ext);
      
      for (const possiblePath of possiblePaths) {
        if (allFiles.has(possiblePath)) {
          importedFiles.add(possiblePath);
          break;
        }
      }
    }
  } catch (err) {
    console.error('Erreur lors de la lecture de ' + file + ':', err.message);
  }
});

// Fichiers jamais importés
const neverImported = Array.from(allFiles).filter(file => 
  \!importedFiles.has(file) && 
  \!file.includes('page.js') && 
  \!file.includes('layout.js') && 
  \!file.includes('tailwind.config') &&
  \!file.includes('next.config') &&
  \!file.includes('next-env.d.ts')
);

console.log('=== FICHIERS JAMAIS IMPORTES ===');
neverImported.forEach(file => console.log(file));

console.log('\n=== STATISTIQUES ===');
console.log('Total fichiers: ' + allFiles.size);
console.log('Fichiers importés: ' + importedFiles.size);
console.log('Fichiers jamais importés: ' + neverImported.length);
