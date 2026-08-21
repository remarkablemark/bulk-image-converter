import { act, renderHook } from '@testing-library/react';

import type { QueueItem } from '../ImageConverter.types';
import { useImageConversion } from './useImageConversion';

function createQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'test-id',
    file: new File(['data'], 'photo.png', { type: 'image/png' }),
    thumbnailUrl: 'blob:thumbnail',
    filename: 'photo.png',
    status: 'pending',
    ...overrides,
  };
}

vi.mock('../utils/convertImage', () => ({
  convertImage: vi.fn(),
  getConvertedFilename: vi.fn((filename: string, format: string) => {
    const stem = filename.replace(/\.[^/.]+$/, '');
    return `${stem}.${format === 'jpeg' ? 'jpg' : format}`;
  }),
}));

import { convertImage } from '../utils/convertImage';

describe('useImageConversion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial state with isConverting false', () => {
    const { result } = renderHook(() => useImageConversion());
    expect(result.current.isConverting).toBe(false);
  });

  it('converts all pending items and returns updated items', async () => {
    const mockBlob = new Blob(['converted'], { type: 'image/webp' });
    vi.mocked(convertImage).mockResolvedValue(mockBlob);

    const items = [createQueueItem({ id: '1' }), createQueueItem({ id: '2' })];

    const { result } = renderHook(() => useImageConversion());
    let converted: QueueItem[] = [];
    await act(async () => {
      converted = await result.current.convertAll(items, 'webp', 0.85);
    });

    expect(converted).toHaveLength(2);
    expect(converted[0].status).toBe('done');
    expect(converted[0].convertedBlob).toBe(mockBlob);
    expect(converted[0].convertedFilename).toBe('photo.webp');
    expect(converted[1].status).toBe('done');
  });

  it('skips items that are already done', async () => {
    const mockBlob = new Blob(['converted'], { type: 'image/webp' });
    vi.mocked(convertImage).mockResolvedValue(mockBlob);

    const doneItem = createQueueItem({
      id: '1',
      status: 'done',
      convertedBlob: mockBlob,
      convertedFilename: 'photo.webp',
    });
    const pendingItem = createQueueItem({ id: '2' });

    const { result } = renderHook(() => useImageConversion());
    let converted: QueueItem[] = [];
    await act(async () => {
      converted = await result.current.convertAll(
        [doneItem, pendingItem],
        'webp',
        0.85,
      );
    });

    expect(converted[0]).toBe(doneItem);
    expect(converted[1].status).toBe('done');
    expect(vi.mocked(convertImage)).toHaveBeenCalledTimes(1);
  });

  it('marks items as error when conversion fails', async () => {
    vi.mocked(convertImage).mockRejectedValue(new Error('Conversion failed'));

    const items = [createQueueItem({ id: '1' })];

    const { result } = renderHook(() => useImageConversion());
    let converted: QueueItem[] = [];
    await act(async () => {
      converted = await result.current.convertAll(items, 'webp', 0.85);
    });

    expect(converted[0].status).toBe('error');
    expect(converted[0].errorMessage).toBe('Conversion failed');
  });

  it('handles non-Error thrown values', async () => {
    vi.mocked(convertImage).mockRejectedValue('some string error');

    const items = [createQueueItem({ id: '1' })];

    const { result } = renderHook(() => useImageConversion());
    let converted: QueueItem[] = [];
    await act(async () => {
      converted = await result.current.convertAll(items, 'webp', 0.85);
    });

    expect(converted[0].status).toBe('error');
    expect(converted[0].errorMessage).toBe('Conversion failed');
  });

  it('sets isConverting to false after completion', async () => {
    const mockBlob = new Blob(['converted'], { type: 'image/webp' });
    vi.mocked(convertImage).mockResolvedValue(mockBlob);

    const items = [createQueueItem({ id: '1' })];

    const { result } = renderHook(() => useImageConversion());
    await act(async () => {
      await result.current.convertAll(items, 'webp', 0.85);
    });

    expect(result.current.isConverting).toBe(false);
  });

  it('sets isConverting to false even on error', async () => {
    vi.mocked(convertImage).mockRejectedValue(new Error('fail'));

    const items = [createQueueItem({ id: '1' })];

    const { result } = renderHook(() => useImageConversion());
    await act(async () => {
      await result.current.convertAll(items, 'webp', 0.85);
    });

    expect(result.current.isConverting).toBe(false);
  });
});
