import type { FormatOption, OutputFormat } from './ImageConverter.types';

export const FORMAT_OPTIONS: FormatOption[] = [
  {
    label: 'PNG',
    value: 'png',
    mimeType: 'image/png',
    extension: 'png',
    lossy: false,
  },
  {
    label: 'JPEG',
    value: 'jpeg',
    mimeType: 'image/jpeg',
    extension: 'jpg',
    lossy: true,
  },
  {
    label: 'WebP',
    value: 'webp',
    mimeType: 'image/webp',
    extension: 'webp',
    lossy: true,
  },
  {
    label: 'AVIF',
    value: 'avif',
    mimeType: 'image/avif',
    extension: 'avif',
    lossy: true,
  },
];

export const DEFAULT_FORMAT: OutputFormat = 'webp';

export const DEFAULT_QUALITY = 0.85;

export const ZIP_FILENAME = 'bulk-image-converter.zip';

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
];

export function getFormatOption(format: OutputFormat): FormatOption {
  /* v8 ignore start */
  return (
    FORMAT_OPTIONS.find((option) => option.value === format) ??
    FORMAT_OPTIONS[2]
  );
  /* v8 ignore stop */
}
