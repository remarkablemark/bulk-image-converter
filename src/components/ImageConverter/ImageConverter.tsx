import { useCallback, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_FORMAT,
  DEFAULT_QUALITY,
  FORMAT_OPTIONS,
  getFormatOption,
} from './constants';
import { Dropzone } from './Dropzone';
import { useImageConversion } from './hooks/useImageConversion';
import type { OutputFormat, QueueItem } from './ImageConverter.types';
import { QueueItemRow } from './QueueItemRow';
import { downloadZip } from './utils/downloadZip';

export function ImageConverter() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [format, setFormat] = useState<OutputFormat>(DEFAULT_FORMAT);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [isDownloading, setIsDownloading] = useState(false);
  const { isConverting, convertAll } = useImageConversion();
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const formatOption = getFormatOption(format);

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newItems: QueueItem[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const thumbnailUrl = URL.createObjectURL(file);
      objectUrlsRef.current.add(thumbnailUrl);

      newItems.push({
        id: crypto.randomUUID(),
        file,
        thumbnailUrl,
        filename: file.name,
        status: 'pending',
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      /* v8 ignore next */
      if (item) {
        URL.revokeObjectURL(item.thumbnailUrl);
        objectUrlsRef.current.delete(item.thumbnailUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearQueue = useCallback(() => {
    setItems((prev) => {
      for (const item of prev) {
        URL.revokeObjectURL(item.thumbnailUrl);
        objectUrlsRef.current.delete(item.thumbnailUrl);
      }
      return [];
    });
  }, []);

  const handleConvertAndDownload = useCallback(async () => {
    const converted = await convertAll(items, format, quality);
    setItems(converted);

    const doneItems = converted.filter((i) => i.status === 'done');
    if (doneItems.length > 0) {
      setIsDownloading(true);
      try {
        await downloadZip(doneItems);
      } finally {
        setIsDownloading(false);
      }
    }
  }, [items, format, quality, convertAll]);

  const hasItems = items.length > 0;
  const isBusy = isConverting || isDownloading;
  const doneCount = items.filter((i) => i.status === 'done').length;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Bulk Image Converter
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Convert multiple images to PNG, JPEG, WebP, or AVIF
          </p>
        </div>

        <Dropzone onFiles={addFiles} />

        {hasItems && (
          <>
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                  htmlFor="format-select"
                >
                  Output Format
                </label>
                <select
                  className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  id="format-select"
                  onChange={(e) => {
                    setFormat(e.target.value as OutputFormat);
                  }}
                  value={format}
                >
                  {FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {formatOption.lossy && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label
                    className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    htmlFor="quality-slider"
                  >
                    Quality: {Math.round(quality * 100)}%
                  </label>
                  <input
                    className="w-full cursor-pointer sm:max-w-xs"
                    id="quality-slider"
                    max={1}
                    min={0.1}
                    onChange={(e) => {
                      setQuality(parseFloat(e.target.value));
                    }}
                    step={0.05}
                    type="range"
                    value={quality}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Queue ({items.length})
              </h2>
              {doneCount > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  {doneCount} converted
                </span>
              )}
            </div>

            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <QueueItemRow item={item} key={item.id} onRemove={removeItem} />
              ))}
            </ul>
          </>
        )}
      </main>

      {hasItems && (
        <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
          <div className="mx-auto flex w-full max-w-2xl gap-3 p-4">
            <button
              className="flex-1 cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isBusy}
              onClick={() => {
                void handleConvertAndDownload();
              }}
              type="button"
            >
              {isConverting
                ? 'Converting...'
                : isDownloading
                  ? 'Generating ZIP...'
                  : 'Convert & Download'}
            </button>
            <button
              className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={isBusy}
              onClick={clearQueue}
              type="button"
            >
              Clear Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
