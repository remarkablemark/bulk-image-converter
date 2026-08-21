import { getFormatOption } from '../constants';
import type { OutputFormat } from '../ImageConverter.types';

/**
 * Converts an image File to the specified output format using canvas.
 * Returns a Blob of the converted image.
 */
export async function convertImage(
  file: File,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  const option = getFormatOption(format);
  const imageUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    ctx.drawImage(img, 0, 0);

    const blob = await canvasToBlob(
      canvas,
      option.mimeType,
      option.lossy ? quality : undefined,
    );

    if (!blob) {
      throw new Error(`Failed to convert to ${option.label}`);
    }

    return blob;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

/**
 * Returns the output filename for a converted image.
 */
export function getConvertedFilename(
  originalFilename: string,
  format: OutputFormat,
): string {
  const option = getFormatOption(format);
  const stem = originalFilename.replace(/\.[^/.]+$/, '');
  return `${stem}.${option.extension}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}
