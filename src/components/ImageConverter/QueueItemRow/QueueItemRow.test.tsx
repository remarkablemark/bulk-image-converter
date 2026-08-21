import { fireEvent, render, screen } from '@testing-library/react';

import type { QueueItem } from '../ImageConverter.types';
import { QueueItemRow } from './QueueItemRow';

function createItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    id: 'test-id',
    file: new File(['data'], 'photo.png', { type: 'image/png' }),
    thumbnailUrl: 'blob:thumbnail',
    filename: 'photo.png',
    status: 'pending',
    ...overrides,
  };
}

describe('QueueItemRow', () => {
  it('renders thumbnail and filename', () => {
    render(<QueueItemRow item={createItem()} onRemove={vi.fn()} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'photo.png');
    expect(img).toHaveAttribute('src', 'blob:thumbnail');
    expect(screen.getByText('photo.png')).toBeInTheDocument();
  });

  it('renders pending status', () => {
    render(
      <QueueItemRow
        item={createItem({ status: 'pending' })}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders converting status', () => {
    render(
      <QueueItemRow
        item={createItem({ status: 'converting' })}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText('Converting...')).toBeInTheDocument();
  });

  it('renders done status', () => {
    render(
      <QueueItemRow item={createItem({ status: 'done' })} onRemove={vi.fn()} />,
    );
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('renders error status with error message', () => {
    render(
      <QueueItemRow
        item={createItem({ status: 'error', errorMessage: 'Failed to load' })}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('does not render error message when there is none', () => {
    render(
      <QueueItemRow
        item={createItem({ status: 'error' })}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('Failed to load')).not.toBeInTheDocument();
  });

  it('calls onRemove with item id when remove button is clicked', () => {
    const onRemove = vi.fn();
    render(
      <QueueItemRow item={createItem({ id: 'abc-123' })} onRemove={onRemove} />,
    );

    const button = screen.getByLabelText('Remove photo.png');
    fireEvent.click(button);

    expect(onRemove).toHaveBeenCalledWith('abc-123');
  });
});
