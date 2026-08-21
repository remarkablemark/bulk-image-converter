import JSZip from 'jszip';

import { ZIP_FILENAME } from '../constants';
import type { QueueItem } from '../ImageConverter.types';

/**
 * Generates a ZIP file from all successfully converted queue items
 * and triggers a browser download.
 */
export async function downloadZip(items: QueueItem[]): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  for (const item of items) {
    if (
      item.status === 'done' &&
      item.convertedBlob &&
      item.convertedFilename
    ) {
      let name = item.convertedFilename;
      while (usedNames.has(name)) {
        const dot = name.lastIndexOf('.');
        const stem = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : '';
        name = `${stem}-copy${ext}`;
      }
      usedNames.add(name);
      zip.file(name, item.convertedBlob);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, ZIP_FILENAME);
}

/**
 * Triggers a browser download for a blob with the given filename.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
