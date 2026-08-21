export type OutputFormat = 'png' | 'jpeg' | 'webp' | 'avif';

export type ConversionStatus = 'pending' | 'converting' | 'done' | 'error';

export interface QueueItem {
  id: string;
  file: File;
  thumbnailUrl: string;
  filename: string;
  status: ConversionStatus;
  errorMessage?: string;
  convertedBlob?: Blob;
  convertedFilename?: string;
}

export interface FormatOption {
  label: string;
  value: OutputFormat;
  mimeType: string;
  extension: string;
  lossy: boolean;
}
