import type { QueueItem } from '../ImageConverter.types';
import { downloadZip, triggerDownload } from './downloadZip';

function createQueueItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'test-id',
    file: new File(['data'], 'photo.png', { type: 'image/png' }),
    thumbnailUrl: 'blob:thumbnail',
    filename: 'photo.png',
    status: 'done',
    convertedBlob: new Blob(['converted'], { type: 'image/webp' }),
    convertedFilename: 'photo.webp',
    ...overrides,
  };
}

function setupLinkMock() {
  const link = {
    href: '',
    download: '',
    click: vi.fn(),
  };

  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      return link as unknown as HTMLAnchorElement;
    }
    return {} as HTMLElement;
  });

  const appendSpy = vi.spyOn(document.body, 'appendChild');
  appendSpy.mockImplementation(() => link as unknown as Node);
  const removeSpy = vi.spyOn(document.body, 'removeChild');
  removeSpy.mockImplementation(() => link as unknown as Node);

  return { link, appendSpy, removeSpy };
}

describe('triggerDownload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a link, clicks it, and revokes the URL', () => {
    const blob = new Blob(['data'], { type: 'application/zip' });
    const { link, appendSpy, removeSpy } = setupLinkMock();

    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:download-url');
    const revokeSpy = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockReturnValue(undefined);

    triggerDownload(blob, 'test.zip');

    expect(link.href).toBe('blob:download-url');
    expect(link.download).toBe('test.zip');
    expect(link.click).toHaveBeenCalledOnce();
    expect(appendSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledOnce();
    expect(revokeSpy).toHaveBeenCalledWith('blob:download-url');
    expect(createSpy).toHaveBeenCalledWith(blob);
  });
});

describe('downloadZip', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a zip and triggers download with done items', async () => {
    const items = [createQueueItem()];
    const { link } = setupLinkMock();

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:zip-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    await downloadZip(items);

    expect(link.download).toBe('bulk-image-converter.zip');
    expect(link.click).toHaveBeenCalledOnce();
  });

  it('skips items that are not done', async () => {
    const items = [
      createQueueItem({ id: '1', status: 'pending' }),
      createQueueItem({ id: '2', status: 'error' }),
    ];

    setupLinkMock();
    const createSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:zip-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    await downloadZip(items);

    expect(createSpy).toHaveBeenCalledOnce();
  });

  it('handles duplicate filenames by appending -copy', async () => {
    const items = [
      createQueueItem({ id: '1', convertedFilename: 'photo.webp' }),
      createQueueItem({ id: '2', convertedFilename: 'photo.webp' }),
    ];

    setupLinkMock();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:zip-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    await downloadZip(items);
  });

  it('handles duplicate filenames without extension', async () => {
    const items = [
      createQueueItem({ id: '1', convertedFilename: 'photo' }),
      createQueueItem({ id: '2', convertedFilename: 'photo' }),
    ];

    setupLinkMock();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:zip-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    await downloadZip(items);
  });

  it('skips items missing convertedBlob or convertedFilename', async () => {
    const items = [
      createQueueItem({ id: '1', convertedBlob: undefined }),
      createQueueItem({ id: '2', convertedFilename: undefined }),
    ];

    setupLinkMock();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:zip-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    await downloadZip(items);
  });
});
