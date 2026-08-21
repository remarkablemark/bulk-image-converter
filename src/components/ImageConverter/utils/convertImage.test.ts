import { convertImage, getConvertedFilename } from './convertImage';

describe('getConvertedFilename', () => {
  it('replaces the extension with the target format', () => {
    expect(getConvertedFilename('photo.png', 'webp')).toBe('photo.webp');
  });

  it('handles filenames with multiple dots', () => {
    expect(getConvertedFilename('my.photo.png', 'jpeg')).toBe('my.photo.jpg');
  });

  it('handles filenames without extension', () => {
    expect(getConvertedFilename('photo', 'png')).toBe('photo.png');
  });
});

describe('convertImage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function mockImageLoad() {
    function MockImage(this: HTMLImageElement) {
      Object.defineProperty(this, 'naturalWidth', {
        value: 10,
        configurable: true,
      });
      Object.defineProperty(this, 'naturalHeight', {
        value: 10,
        configurable: true,
      });
      this.onload = null as (() => void) | null;
      this.onerror = null as (() => void) | null;
      Object.defineProperty(this, 'src', {
        set: () => {
          setTimeout(() => (this.onload as (() => void) | null)?.(), 0);
        },
        get: () => '',
        configurable: true,
      });
    }

    vi.stubGlobal('Image', MockImage);
  }

  function mockCanvas(blob: Blob | null) {
    const ctx = {
      drawImage: vi.fn(),
    };

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((callback: (blob: Blob | null) => void) => {
        callback(blob);
      }),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return canvas as unknown as HTMLCanvasElement;
      }
      return {} as HTMLElement;
    });

    return { canvas, ctx };
  }

  it('converts an image to the target format and returns a blob', async () => {
    mockImageLoad();
    const mockBlob = new Blob(['data'], { type: 'image/webp' });
    mockCanvas(mockBlob);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    const blob = await convertImage(file, 'webp', 0.85);

    expect(blob).toBe(mockBlob);
  });

  it('throws when canvas context is not available', async () => {
    mockImageLoad();

    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => null),
      toBlob: vi.fn(),
    };

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') {
        return canvas as unknown as HTMLCanvasElement;
      }
      return {} as HTMLElement;
    });

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    await expect(convertImage(file, 'webp', 0.85)).rejects.toThrow(
      'Canvas 2D context not available',
    );
  });

  it('throws when toBlob returns null', async () => {
    mockImageLoad();
    mockCanvas(null);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    await expect(convertImage(file, 'webp', 0.85)).rejects.toThrow(
      'Failed to convert to WebP',
    );
  });

  it('throws when image fails to load', async () => {
    function MockImage(this: HTMLImageElement) {
      Object.defineProperty(this, 'naturalWidth', {
        value: 10,
        configurable: true,
      });
      Object.defineProperty(this, 'naturalHeight', {
        value: 10,
        configurable: true,
      });
      this.onload = null as (() => void) | null;
      this.onerror = null as (() => void) | null;
      Object.defineProperty(this, 'src', {
        set: () => {
          setTimeout(() => (this.onerror as (() => void) | null)?.(), 0);
        },
        get: () => '',
        configurable: true,
      });
    }

    vi.stubGlobal('Image', MockImage);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    await expect(convertImage(file, 'webp', 0.85)).rejects.toThrow(
      'Failed to load image',
    );
  });

  it('passes quality for lossy formats', async () => {
    mockImageLoad();
    const mockBlob = new Blob(['data'], { type: 'image/jpeg' });
    const { canvas } = mockCanvas(mockBlob);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    await convertImage(file, 'jpeg', 0.5);

    expect(canvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/jpeg',
      0.5,
    );
  });

  it('passes undefined quality for lossless PNG format', async () => {
    mockImageLoad();
    const mockBlob = new Blob(['data'], { type: 'image/png' });
    const { canvas } = mockCanvas(mockBlob);

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    await convertImage(file, 'png', 0.85);

    expect(canvas.toBlob).toHaveBeenCalledWith(
      expect.any(Function),
      'image/png',
      undefined,
    );
  });
});
