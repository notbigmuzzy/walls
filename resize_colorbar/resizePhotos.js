const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function resizeAndCropTo1080p(imagePath, outputPath) {
  try {
    const image = sharp(imagePath);
    const { width, height } = await image.metadata();
    
    console.log(`Processing: ${path.basename(imagePath)} (${width}x${height})`);
    
    // Target dimensions
    const targetWidth = 1920;
    const targetHeight = 1080;
    const targetAspectRatio = targetWidth / targetHeight; // 16:9 = 1.777...
    
    // Calculate current aspect ratio
    const currentAspectRatio = width / height;
    
    let resizeWidth, resizeHeight;
    
    if (currentAspectRatio > targetAspectRatio) {
      // Image is wider than 16:9, scale by height and crop width
      resizeHeight = targetHeight;
      resizeWidth = Math.round(height * targetAspectRatio);
    } else {
      // Image is taller than 16:9, scale by width and crop height
      resizeWidth = targetWidth;
      resizeHeight = Math.round(width / targetAspectRatio);
    }
    
    // Resize and crop to exact 1920x1080
    await image
      .resize(resizeWidth, resizeHeight, {
        fit: 'cover',
        position: 'center'
      })
      .resize(targetWidth, targetHeight, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 90 }) // High quality JPEG output
      .toFile(outputPath);
      
    console.log(`✓ Resized to 1920x1080: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`Error processing ${imagePath}:`, error.message);
  }
}

async function processPhotosInFolder(photoFolder, outputFolder = './resized') {
  // Create output folder if it doesn't exist
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
  
  // Supported image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.bmp'];
  
  try {
    // Read all files in the photo folder
    const files = fs.readdirSync(photoFolder);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    if (imageFiles.length === 0) {
      console.log('No image files found in the specified folder.');
      return;
    }
    
    console.log(`Found ${imageFiles.length} image(s) to resize to 1920x1080...`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Process each image
    for (const file of imageFiles) {
      const inputPath = path.join(photoFolder, file);
      const outputPath = path.join(outputFolder, `1080p_${file.replace(/\.[^/.]+$/, '.jpg')}`);
      
      await resizeAndCropTo1080p(inputPath, outputPath);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ All ${imageFiles.length} images resized successfully!`);
    console.log(`📁 Output folder: ${path.resolve(outputFolder)}`);
  } catch (error) {
    console.error('Error reading photo folder:', error.message);
  }
}

// Usage: specify your photo folder path here
const photoFolder = 'photo'; // Change this to your photo folder
processPhotosInFolder(photoFolder);
