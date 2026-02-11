const fs = require('fs');
const path = require('path');

// Caminho esperado para AJV v6
  const ajvDistPath = path.join('node_modules', 'ajv', 'lib', 'ajv.js');
  
  console.log(`Checking AJV at: ${ajvDistPath}`);
  
  try {
    if (fs.existsSync(ajvDistPath)) {
      console.log(`SUCCESS: AJV lib file found!`);
      
      // Verificação adicional para ajv-keywords v3
      const ajvKeywordsPath = path.join('node_modules', 'ajv-keywords', 'index.js');
      if (fs.existsSync(ajvKeywordsPath)) {
        console.log(`SUCCESS: ajv-keywords found at: ${ajvKeywordsPath}`);
      } else {
        console.error(`ERROR: ajv-keywords NOT found at: ${ajvKeywordsPath}`);
        process.exit(1);
      }
    } else {
      console.error(`ERROR: AJV lib file NOT found at: ${ajvDistPath}`);
      process.exit(1);
    }
} catch (error) {
  console.error('Error checking AJV dist:', error);
  process.exit(1);
}
