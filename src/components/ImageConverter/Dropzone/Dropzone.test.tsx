import { fireEvent, render, screen } from '@testing-library/react';

import { Dropzone } from './Dropzone';

describe('Dropzone', () => {
  function getDropzone(): HTMLElement {
    return screen.getByRole('button', { name: 'Upload images' });
  }

  function getInput(): HTMLElement {
    return screen.getByLabelText('File input');
  }

  it('renders upload prompt text', () => {
    render(<Dropzone onFiles={vi.fn()} />);

    expect(screen.getByText('Drag and drop images here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse files')).toBeInTheDocument();
  });

  it('renders a hidden file input', () => {
    render(<Dropzone onFiles={vi.fn()} />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).toHaveAttribute('multiple');
  });

  it('calls onFiles when files are dropped', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);

    const dropzone = getDropzone();
    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('does not call onFiles when drop has no files', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);

    const dropzone = getDropzone();

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('sets dragging state on drag over', () => {
    render(<Dropzone onFiles={vi.fn()} />);

    const dropzone = getDropzone();

    fireEvent.dragOver(dropzone);

    expect(dropzone.className).toContain('border-blue-500');
  });

  it('removes dragging state on drag leave', () => {
    render(<Dropzone onFiles={vi.fn()} />);

    const dropzone = getDropzone();

    fireEvent.dragOver(dropzone);
    expect(dropzone.className).toContain('border-blue-500');

    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).not.toContain('border-blue-500');
  });

  it('calls onFiles when file input changes', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);

    const input = getInput();
    const file = new File(['data'], 'photo.png', { type: 'image/png' });

    fireEvent.change(input, {
      target: { files: [file] },
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it('does not call onFiles when input has no files', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);

    const input = getInput();

    fireEvent.change(input, {
      target: { files: [] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('does not call onFiles when input files is null', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);

    const input = getInput();

    fireEvent.change(input, {
      target: { files: null },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });

  it('clicks the file input when dropzone is clicked', () => {
    render(<Dropzone onFiles={vi.fn()} />);

    const input = getInput();
    const clickSpy = vi.spyOn(input, 'click');

    const dropzone = getDropzone();
    fireEvent.click(dropzone);

    expect(clickSpy).toHaveBeenCalled();
  });
});
