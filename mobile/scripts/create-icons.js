const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple 1x1 transparent PNG as placeholder
// This is a minimal valid PNG file (transparent 1x1 pixel)
const minimalPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
  0x1F, 0x15, 0xC4, 0x89, // CRC
  0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
  0x0D, 0x0A, 0x2D, 0xB4, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

// Create a 1024x1024 PNG with a simple colored square (yellow background with "F" letter)
// For simplicity, we'll create a larger placeholder that Expo can use
// Note: This is a basic approach. For production, use a proper icon generator tool.

console.log('Creating placeholder icon files...');

// For now, let's create simple placeholder files
// Users should replace these with actual icons
const iconPath = path.join(assetsDir, 'icon.png');
const splashPath = path.join(assetsDir, 'splash.png');
const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
const faviconPath = path.join(assetsDir, 'favicon.png');

// Write minimal PNG files
fs.writeFileSync(iconPath, minimalPNG);
fs.writeFileSync(splashPath, minimalPNG);
fs.writeFileSync(adaptiveIconPath, minimalPNG);
fs.writeFileSync(faviconPath, minimalPNG);

console.log('✅ Created placeholder icon files in assets/');
console.log('⚠️  Please replace these with actual icon images:');
console.log('   - icon.png (1024x1024)');
console.log('   - splash.png (1242x2436 for iOS, 1920x1920 for Android)');
console.log('   - adaptive-icon.png (1024x1024, foreground only)');
console.log('   - favicon.png (48x48)');

