const fs = require('fs');
const path = require('path');

// Caminho esperado para AJV v8 (dist/ajv.js)
  const ajvDistPath = path.join('node_modules', 'ajv', 'dist');
  
  console.log(`Checking AJV dist directory at: ${ajvDistPath}`);
  
  try {
    if (fs.existsSync(ajvDistPath)) {
      console.log(`AJV dist directory found at: ${ajvDistPath}`);
      const files = fs.readdirSync(ajvDistPath);
      console.log('Files in dist:', files);
      if (files.includes('ajv.js')) {
        console.log('SUCCESS: ajv.js found!');
      } else {
        console.error('ERROR: ajv.js NOT found in dist!');
        process.exit(1);
      }
      
      // Verificação adicional para ajv-formats
      const ajvFormatsPath = path.join('node_modules', 'ajv-formats', 'dist', 'index.js');
      if (fs.existsSync(ajvFormatsPath)) {
        console.log(`SUCCESS: ajv-formats found at: ${ajvFormatsPath}`);
      } else {
        console.error(`ERROR: ajv-formats NOT found at: ${ajvFormatsPath}`);
        process.exit(1);
      }
    } else {
      console.error(`ERROR: AJV dist directory NOT found at: ${ajvDistPath}`);
      process.exit(1);
    }
} catch (error) {
  console.error('Error checking AJV dist:', error);
  process.exit(1);
}
