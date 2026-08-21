import { render, screen } from '@testing-library/react';

import { App } from '.';

describe('App component', () => {
  it('renders the converter heading', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Bulk Image Converter');
  });

  it('renders the dropzone with upload prompt', () => {
    render(<App />);

    expect(screen.getByText('Drag and drop images here')).toBeInTheDocument();
  });
});
