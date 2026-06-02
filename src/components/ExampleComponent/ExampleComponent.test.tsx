import { render, screen } from '@testing-library/react';
import { ExampleComponent } from './ExampleComponent';

describe('ExampleComponent', () => {
  it('renders', () => {
    render(<ExampleComponent />);
    expect(screen.getByText('Example Component')).toBeInTheDocument();
  });
});
