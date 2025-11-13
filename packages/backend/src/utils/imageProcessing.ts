import sharp from 'sharp';
import axios from 'axios';

/**
 * Download image from URL and return buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

/**
 * Create thumbnail from image buffer
 */
export async function createThumbnail(
  imageBuffer: Buffer,
  width = 300,
  height = 300
): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 85 })
    .toBuffer();
}

/**
 * Get image metadata (dimensions, format, etc.)
 */
export async function getImageMetadata(imageBuffer: Buffer) {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    channels: metadata.channels,
    hasAlpha: metadata.hasAlpha,
    size: imageBuffer.length,
  };
}

/**
 * Extract dominant colors from image using color quantization
 */
export async function extractColorPalette(
  imageBuffer: Buffer,
  colorCount = 5
): Promise<{ colors: string[]; rgbColors: number[][] }> {
  // Resize image to speed up processing
  const resized = await sharp(imageBuffer)
    .resize(200, 200, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = resized;
  const pixels: number[][] = [];

  // Extract pixel data
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Skip very dark or very light pixels (likely shadows/highlights)
    const brightness = (r + g + b) / 3;
    if (brightness > 20 && brightness < 235) {
      pixels.push([r, g, b]);
    }
  }

  // Simple k-means clustering to find dominant colors
  const dominantColors = kMeansClustering(pixels, Math.min(colorCount, pixels.length));

  // Convert to hex colors
  const hexColors = dominantColors.map((rgb) => rgbToHex(rgb[0], rgb[1], rgb[2]));

  return {
    colors: hexColors,
    rgbColors: dominantColors,
  };
}

/**
 * Simple k-means clustering for color quantization
 */
function kMeansClustering(pixels: number[][], k: number, maxIterations = 10): number[][] {
  if (pixels.length === 0) return [];
  if (pixels.length <= k) return pixels;

  // Initialize centroids randomly
  let centroids: number[][] = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[i * step]]);
  }

  // Iterate
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign pixels to nearest centroid
    const clusters: number[][][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let minIdx = 0;

      for (let i = 0; i < k; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }

      clusters[minIdx].push(pixel);
    }

    // Update centroids
    const newCentroids: number[][] = [];
    for (const cluster of clusters) {
      if (cluster.length === 0) {
        // Keep old centroid if cluster is empty
        newCentroids.push(centroids[newCentroids.length]);
      } else {
        const avgColor = [0, 0, 0];
        for (const pixel of cluster) {
          avgColor[0] += pixel[0];
          avgColor[1] += pixel[1];
          avgColor[2] += pixel[2];
        }
        avgColor[0] = Math.round(avgColor[0] / cluster.length);
        avgColor[1] = Math.round(avgColor[1] / cluster.length);
        avgColor[2] = Math.round(avgColor[2] / cluster.length);
        newCentroids.push(avgColor);
      }
    }

    centroids = newCentroids;
  }

  return centroids;
}

/**
 * Calculate Euclidean distance between two RGB colors
 */
function colorDistance(rgb1: number[], rgb2: number[]): number {
  const dr = rgb1[0] - rgb2[0];
  const dg = rgb1[1] - rgb2[1];
  const db = rgb1[2] - rgb2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
      .toUpperCase()
  );
}

/**
 * Get color name from RGB (basic implementation)
 */
export function getColorName(r: number, g: number, b: number): string {
  const colors = [
    { name: 'Black', r: 0, g: 0, b: 0 },
    { name: 'White', r: 255, g: 255, b: 255 },
    { name: 'Red', r: 255, g: 0, b: 0 },
    { name: 'Green', r: 0, g: 255, b: 0 },
    { name: 'Blue', r: 0, g: 0, b: 255 },
    { name: 'Yellow', r: 255, g: 255, b: 0 },
    { name: 'Cyan', r: 0, g: 255, b: 255 },
    { name: 'Magenta', r: 255, g: 0, b: 255 },
    { name: 'Orange', r: 255, g: 165, b: 0 },
    { name: 'Purple', r: 128, g: 0, b: 128 },
    { name: 'Pink', r: 255, g: 192, b: 203 },
    { name: 'Brown', r: 165, g: 42, b: 42 },
    { name: 'Gray', r: 128, g: 128, b: 128 },
    { name: 'Navy', r: 0, g: 0, b: 128 },
    { name: 'Beige', r: 245, g: 245, b: 220 },
  ];

  let minDist = Infinity;
  let closestColor = 'Unknown';

  for (const color of colors) {
    const dist = colorDistance([r, g, b], [color.r, color.g, color.b]);
    if (dist < minDist) {
      minDist = dist;
      closestColor = color.name;
    }
  }

  // Add lightness/darkness prefix
  const brightness = (r + g + b) / 3;
  if (brightness < 50) {
    closestColor = 'Dark ' + closestColor;
  } else if (brightness > 200) {
    closestColor = 'Light ' + closestColor;
  }

  return closestColor;
}

/**
 * Extract color names from hex colors
 */
export function getColorNamesFromPalette(hexColors: string[]): string[] {
  return hexColors.map((hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return getColorName(r, g, b);
  });
}

/**
 * Crop image to specific region
 */
export async function cropImage(
  imageBuffer: Buffer,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Buffer> {
  return await sharp(imageBuffer)
    .extract({ left: x, top: y, width, height })
    .toBuffer();
}

/**
 * Convert image to JPEG format
 */
export async function convertToJpeg(
  imageBuffer: Buffer,
  quality = 90
): Promise<Buffer> {
  return await sharp(imageBuffer).jpeg({ quality }).toBuffer();
}

/**
 * Resize image while maintaining aspect ratio
 */
export async function resizeImage(
  imageBuffer: Buffer,
  maxWidth: number,
  maxHeight: number
): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toBuffer();
}
