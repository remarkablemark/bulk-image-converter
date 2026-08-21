import type { QueueItem } from '../ImageConverter.types';

interface QueueItemRowProps {
  item: QueueItem;
  onRemove: (id: string) => void;
}

const STATUS_LABELS: Record<QueueItem['status'], string> = {
  pending: 'Pending',
  converting: 'Converting...',
  done: 'Done',
  error: 'Error',
};

const STATUS_COLORS: Record<QueueItem['status'], string> = {
  pending: 'text-slate-500 dark:text-slate-400',
  converting: 'text-blue-600 dark:text-blue-400',
  done: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
};

export function QueueItemRow({ item, onRemove }: QueueItemRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
      <img
        alt={item.filename}
        className="h-20 w-20 shrink-0 rounded-md object-cover"
        src={item.thumbnailUrl}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
          {item.filename}
        </span>
        <span className={`text-xs font-medium ${STATUS_COLORS[item.status]}`}>
          {STATUS_LABELS[item.status]}
        </span>
        {item.errorMessage && (
          <span className="truncate text-xs text-red-500 dark:text-red-400">
            {item.errorMessage}
          </span>
        )}
      </div>

      <button
        aria-label={`Remove ${item.filename}`}
        className="shrink-0 cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
        onClick={() => {
          onRemove(item.id);
        }}
        type="button"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            d="M6 18 18 6M6 6l12 12"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </li>
  );
}
