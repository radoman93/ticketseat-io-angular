#!/usr/bin/env node

// Script to add CSS export to dist/package.json after ng-packagr build
const fs = require('fs');
const path = require('path');

const distPackageJsonPath = path.join('./dist', 'package.json');

try {
  if (!fs.existsSync(distPackageJsonPath)) {
    throw new Error('dist/package.json not found. Run ng-packagr first.');
  }

  // Read the existing package.json
  const packageJson = JSON.parse(fs.readFileSync(distPackageJsonPath, 'utf8'));
  
  console.log('📦 Adding CSS export to dist/package.json...');
  
  // Ensure exports object exists
  if (!packageJson.exports) {
    packageJson.exports = {};
  }
  
  // Add CSS export if it doesn't exist
  if (!packageJson.exports['./styles.css']) {
    packageJson.exports['./styles.css'] = {
      "default": "./styles.css"
    };
    console.log('✅ Added ./styles.css export');
  } else {
    console.log('✅ ./styles.css export already exists');
  }
  
  // Write the updated package.json back
  fs.writeFileSync(distPackageJsonPath, JSON.stringify(packageJson, null, 2));
  
  console.log('🎉 dist/package.json updated successfully');
  
} catch (error) {
  console.error('❌ Failed to add CSS export:', error.message);
  process.exit(1);
} 