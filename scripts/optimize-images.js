const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './public';
const outputDir = './public';

// Image optimization settings
const optimizationSettings = {
  jpeg: { quality: 85, progressive: true },
  webp: { quality: 85, effort: 6 },
  avif: { quality: 75, effort: 9 },
  png: { compressionLevel: 9, progressive: true }
};

// Responsive breakpoints
const breakpoints = [400, 800, 1200, 1600, 2000];

async function optimizeImage(inputPath, outputPath, format, width = null) {
  try {
    let pipeline = sharp(inputPath);
    
    if (width) {
      pipeline = pipeline.resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    switch (format) {
      case 'webp':
        await pipeline.webp(optimizationSettings.webp).toFile(outputPath);
        break;
      case 'avif':
        await pipeline.avif(optimizationSettings.avif).toFile(outputPath);
        break;
      case 'jpeg':
        await pipeline.jpeg(optimizationSettings.jpeg).toFile(outputPath);
        break;
      case 'png':
        await pipeline.png(optimizationSettings.png).toFile(outputPath);
        break;
    }
    
    console.log(`✅ Optimized: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
  }
}

async function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      await processDirectory(fullPath);
    } else if (file.isFile() && /\.(jpg|jpeg|png)$/i.test(file.name)) {
      const ext = path.extname(file.name).toLowerCase();
      const baseName = path.basename(file.name, ext);
      const dirPath = path.dirname(fullPath);
      
      // Create optimized version
      const optimizedPath = path.join(dirPath, `${baseName}-optimized${ext}`);
      await optimizeImage(fullPath, optimizedPath, ext.slice(1));
      
      // Create WebP versions
      for (const width of breakpoints) {
        const webpPath = path.join(dirPath, `${baseName}-${width}w.webp`);
        await optimizeImage(fullPath, webpPath, 'webp', width);
        
        const avifPath = path.join(dirPath, `${baseName}-${width}w.avif`);
        await optimizeImage(fullPath, avifPath, 'avif', width);
        
        const jpegPath = path.join(dirPath, `${baseName}-${width}w.jpg`);
        await optimizeImage(fullPath, jpegPath, 'jpeg', width);
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting image optimization...');
  await processDirectory(inputDir);
  console.log('✨ Image optimization complete!');
}

main().catch(console.error);