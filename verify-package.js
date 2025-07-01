#!/usr/bin/env node

// Script to verify that the package exports work correctly
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying @radoman93/ticketseat-io-angular package...\n');

const distPath = './dist';
const packageJsonPath = path.join(distPath, 'package.json');

try {
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    throw new Error('dist directory not found. Run "npm run build" first.');
  }

  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('✅ Package name:', packageJson.name);
  console.log('✅ Package version:', packageJson.version);

  // Check main exports
  const exports = packageJson.exports;
  if (!exports) {
    throw new Error('No exports field found in package.json');
  }

  // Check if styles.css is exported
  if (exports['./styles.css']) {
    console.log('✅ styles.css export found');

    // Check if the actual file exists
    const cssPath = path.join(distPath, 'styles.css');
    if (fs.existsSync(cssPath)) {
      const stats = fs.statSync(cssPath);
      console.log(`✅ styles.css file exists (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
      throw new Error('styles.css file not found in dist directory');
    }
  } else {
    throw new Error('styles.css export not found in package.json');
  }

  // Check main library export
  if (exports['.']) {
    console.log('✅ Main library export found');

    const mainPath = path.join(distPath, exports['.'].default);
    if (fs.existsSync(mainPath)) {
      console.log('✅ Main library file exists');
    } else {
      throw new Error('Main library file not found');
    }
  }

  // Check type definitions
  const typingsPath = path.join(distPath, packageJson.typings || 'index.d.ts');
  if (fs.existsSync(typingsPath)) {
    console.log('✅ Type definitions found');
  } else {
    console.log('⚠️  Type definitions not found');
  }

  // Check assets directory
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log('✅ Assets directory found');

    // Check for icons specifically
    const iconsPath = path.join(assetsPath, 'icons');
    if (fs.existsSync(iconsPath)) {
      console.log('✅ Icons directory found');
    } else {
      console.log('⚠️  Icons directory not found in assets');
    }
  } else {
    console.log('⚠️  Assets directory not found - icons may not load');
  }

  console.log('\n🎉 Package verification successful!');
  console.log('\nUsers can now import the CSS using:');
  console.log("   @import '@radoman93/ticketseat-io-angular/styles.css';");
  console.log('   or');
  console.log("   import '@radoman93/ticketseat-io-angular/styles.css';");

} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
} 