const { getAverageColor } = require('fast-average-color-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function addColorBar(imagePath, outputPath) {
  try {
    // Get the average color
    const color = await getAverageColor(imagePath);
    
    // Get image dimensions
    const image = sharp(imagePath);
    const { width } = await image.metadata();
    
    // Make the color more intensive/vibrant
    // Get RGB values safely
    let r, g, b;
    if (color.rgb && Array.isArray(color.rgb)) {
      [r, g, b] = color.rgb;
    } else if (color.value && Array.isArray(color.value)) {
      [r, g, b] = color.value;
    } else {
      // Fallback: parse from hex
      const hex = color.hex.replace('#', '');
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    }
    
    // Increase color intensity by 50%
    const intensifyFactor = 1.5;
    const newR = Math.min(255, Math.max(0, Math.round(r * intensifyFactor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * intensifyFactor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * intensifyFactor)));
    
    const intensifiedHex = `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    
    console.log(`Original color: ${color.hex} -> Intensified: ${intensifiedHex}`);
    
    // Create a colored bar (22px height, full width)
    const colorBar = sharp({
      create: {
        width: width,
        height: 22,
        channels: 3,
        background: intensifiedHex
      }
    }).png();
    
    // Composite the bar on top of the original image
    await sharp(imagePath)
      .composite([{
        input: await colorBar.toBuffer(),
        top: 0,
        left: 0
      }])
      .toFile(outputPath);
      
    console.log(`✓ ${path.basename(imagePath)} processed`);
  } catch (error) {
    console.error(`✗ Error processing ${path.basename(imagePath)}:`, error.message);
  }
}

async function processPhotosInFolder(photoFolder, outputFolder = './colorbared') {
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
    
    console.log(`Found ${imageFiles.length} image(s) to process...`);
    
    // Process each image
    for (const file of imageFiles) {
      const inputPath = path.join(photoFolder, file);
      const outputPath = path.join(outputFolder, `edited_${file}`);
      
      await addColorBar(inputPath, outputPath);
    }
    
    console.log('All images processed successfully!');
  } catch (error) {
    console.error('Error reading photo folder:', error.message);
  }
}

// Usage: specify your photo folder path here
const photoFolder = 'resized'; // Change this to your photo folder
processPhotosInFolder(photoFolder);