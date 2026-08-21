import { useRef, useState } from 'react';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
}

export function Dropzone({ onFiles }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      onFiles(files);
    }
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) {
      onFiles(files);
    }
    event.target.value = '';
  }

  return (
    <div
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12 ${
        isDragging
          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
          : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
      aria-label="Upload images"
      role="button"
      onClick={() => inputRef.current?.click()}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <svg
        className="mb-3 h-10 w-10 text-slate-400 dark:text-slate-500"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <path
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Drag and drop images here
      </p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        or click to browse files
      </p>
      <input
        accept="image/*"
        className="hidden"
        aria-label="File input"
        multiple
        onChange={handleInputChange}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}
