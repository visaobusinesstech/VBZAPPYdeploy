const fs = require('fs');
const path = require('path');

const ajvDistPath = path.join('node_modules', 'ajv', 'dist');

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
    // Verificação adicional para ajv-keywords
    const ajvKeywordsPath = path.join('node_modules', 'ajv-keywords', 'package.json');
    if (fs.existsSync(ajvKeywordsPath)) {
      console.log(`SUCCESS: ajv-keywords found at: ${ajvKeywordsPath}`);
    } else {
      console.error(`ERROR: ajv-keywords NOT found at: ${ajvKeywordsPath}`);
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
