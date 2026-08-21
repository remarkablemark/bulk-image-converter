import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ImageConverter } from './ImageConverter';

// Mock convertImage so we don't need real canvas
vi.mock('./utils/convertImage', () => ({
  convertImage: vi.fn(),
  getConvertedFilename: vi.fn((filename: string, format: string) => {
    const stem = filename.replace(/\.[^/.]+$/, '');
    const ext = format === 'jpeg' ? 'jpg' : format;
    return `${stem}.${ext}`;
  }),
}));

vi.mock('./utils/downloadZip', () => ({
  downloadZip: vi.fn(),
}));

import { convertImage } from './utils/convertImage';
import { downloadZip } from './utils/downloadZip';

const mockFile = new File(['data'], 'photo.png', { type: 'image/png' });

function addFilesViaInput(files: File[]) {
  const input = screen.getByLabelText('File input');
  fireEvent.change(input, { target: { files } });
}

describe('ImageConverter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and dropzone', () => {
    render(<ImageConverter />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Bulk Image Converter',
    );
    expect(screen.getByText('Drag and drop images here')).toBeInTheDocument();
  });

  it('does not show controls or action bar when queue is empty', () => {
    render(<ImageConverter />);

    expect(screen.queryByText('Output Format')).not.toBeInTheDocument();
    expect(screen.queryByText('Convert & Download')).not.toBeInTheDocument();
  });

  it('adds image files to the queue', () => {
    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Queue (1)')).toBeInTheDocument();
  });

  it('filters out non-image files', () => {
    render(<ImageConverter />);

    const textFile = new File(['text'], 'notes.txt', { type: 'text/plain' });
    addFilesViaInput([textFile]);

    expect(screen.queryByText('notes.txt')).not.toBeInTheDocument();
    expect(screen.queryByText('Convert & Download')).not.toBeInTheDocument();
  });

  it('appends new files to existing queue', () => {
    render(<ImageConverter />);

    addFilesViaInput([mockFile]);
    addFilesViaInput([new File(['data'], 'second.png', { type: 'image/png' })]);

    expect(screen.getByText('Queue (2)')).toBeInTheDocument();
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('second.png')).toBeInTheDocument();
  });

  it('shows quality slider for lossy formats', () => {
    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    expect(screen.getByText('Quality: 85%')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('hides quality slider for PNG format', () => {
    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    const select = screen.getByLabelText('Output Format');
    fireEvent.change(select, { target: { value: 'png' } });

    expect(screen.queryByText('Quality:')).not.toBeInTheDocument();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  });

  it('updates quality when slider is moved', () => {
    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.5' } });

    expect(screen.getByText('Quality: 50%')).toBeInTheDocument();
  });

  it('removes an item from the queue', () => {
    render(<ImageConverter />);

    addFilesViaInput([mockFile]);
    expect(screen.getByText('photo.png')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Remove photo.png'));

    expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
  });

  it('clears the queue', () => {
    render(<ImageConverter />);

    addFilesViaInput([
      mockFile,
      new File(['data'], 'second.png', { type: 'image/png' }),
    ]);
    expect(screen.getByText('Queue (2)')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear Queue'));

    expect(screen.queryByText('photo.png')).not.toBeInTheDocument();
    expect(screen.queryByText('second.png')).not.toBeInTheDocument();
    expect(screen.queryByText('Clear Queue')).not.toBeInTheDocument();
  });

  it('converts and downloads on button click', async () => {
    const mockBlob = new Blob(['converted'], { type: 'image/webp' });
    vi.mocked(convertImage).mockResolvedValue(mockBlob);
    vi.mocked(downloadZip).mockResolvedValue(undefined);

    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    fireEvent.click(screen.getByText('Convert & Download'));

    await waitFor(() => {
      expect(vi.mocked(convertImage)).toHaveBeenCalledWith(
        mockFile,
        'webp',
        0.85,
      );
    });

    await waitFor(() => {
      expect(vi.mocked(downloadZip)).toHaveBeenCalledOnce();
    });

    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('1 converted')).toBeInTheDocument();
  });

  it('shows error status when conversion fails', async () => {
    vi.mocked(convertImage).mockRejectedValue(
      new Error('Failed to load image'),
    );
    vi.mocked(downloadZip).mockResolvedValue(undefined);

    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    fireEvent.click(screen.getByText('Convert & Download'));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to load image')).toBeInTheDocument();
  });

  it('does not call downloadZip when all conversions fail', async () => {
    vi.mocked(convertImage).mockRejectedValue(new Error('fail'));
    vi.mocked(downloadZip).mockResolvedValue(undefined);

    render(<ImageConverter />);

    addFilesViaInput([mockFile]);

    fireEvent.click(screen.getByText('Convert & Download'));

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    expect(vi.mocked(downloadZip)).not.toHaveBeenCalled();
  });

  it('shows converting state during conversion', async () => {
    let resolveConversion: ((blob: Blob) => void) | undefined;
    vi.mocked(convertImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConversion = resolve;
        }),
    );
    vi.mocked(downloadZip).mockResolvedValue(undefined);

    render(<ImageConverter />);

    addFilesViaInput([mockFile]);
    fireEvent.click(screen.getByText('Convert & Download'));

    await waitFor(() => {
      expect(screen.getByText('Converting...')).toBeInTheDocument();
    });

    resolveConversion?.(new Blob(['converted'], { type: 'image/webp' }));

    await waitFor(() => {
      expect(screen.getByText('Done')).toBeInTheDocument();
    });
  });

  it('disables buttons during conversion', async () => {
    let resolveConversion: ((blob: Blob) => void) | undefined;
    vi.mocked(convertImage).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveConversion = resolve;
        }),
    );
    vi.mocked(downloadZip).mockResolvedValue(undefined);

    render(<ImageConverter />);

    addFilesViaInput([mockFile]);
    fireEvent.click(screen.getByText('Convert & Download'));

    await waitFor(() => {
      expect(screen.getByText('Converting...')).toBeDisabled();
      expect(screen.getByText('Clear Queue')).toBeDisabled();
    });

    resolveConversion?.(new Blob(['converted'], { type: 'image/webp' }));

    await waitFor(() => {
      expect(screen.getByText('Convert & Download')).not.toBeDisabled();
    });
  });

  it('shows generating ZIP state during download', async () => {
    const mockBlob = new Blob(['converted'], { type: 'image/webp' });
    vi.mocked(convertImage).mockResolvedValue(mockBlob);

    let resolveDownload: (() => void) | undefined;
    vi.mocked(downloadZip).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveDownload = resolve;
        }),
    );

    render(<ImageConverter />);

    addFilesViaInput([mockFile]);
    fireEvent.click(screen.getByText('Convert & Download'));

    await waitFor(() => {
      expect(screen.getByText('Generating ZIP...')).toBeInTheDocument();
    });

    resolveDownload?.();

    await waitFor(() => {
      expect(screen.getByText('Convert & Download')).toBeInTheDocument();
    });
  });
});
