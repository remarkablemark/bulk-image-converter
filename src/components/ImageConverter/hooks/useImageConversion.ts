import { useCallback, useState } from 'react';

import type { OutputFormat, QueueItem } from '../ImageConverter.types';
import { convertImage, getConvertedFilename } from '../utils/convertImage';

interface UseImageConversionResult {
  isConverting: boolean;
  convertAll: (
    items: QueueItem[],
    format: OutputFormat,
    quality: number,
  ) => Promise<QueueItem[]>;
}

/**
 * Hook that manages batch image conversion state.
 */
export function useImageConversion(): UseImageConversionResult {
  const [isConverting, setIsConverting] = useState(false);

  const convertAll = useCallback(
    async (
      items: QueueItem[],
      format: OutputFormat,
      quality: number,
    ): Promise<QueueItem[]> => {
      setIsConverting(true);

      try {
        const results = await Promise.all(
          items.map(async (item): Promise<QueueItem> => {
            if (item.status === 'done') {
              return item;
            }

            try {
              const blob = await convertImage(item.file, format, quality);
              const convertedFilename = getConvertedFilename(
                item.filename,
                format,
              );
              return {
                ...item,
                status: 'done',
                convertedBlob: blob,
                convertedFilename,
                errorMessage: undefined,
              };
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'Conversion failed';
              return {
                ...item,
                status: 'error',
                errorMessage: message,
              };
            }
          }),
        );

        return results;
      } finally {
        setIsConverting(false);
      }
    },
    [],
  );

  return { isConverting, convertAll };
}
