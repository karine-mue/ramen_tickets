import { render, screen } from '@testing-library/react';
import { App } from '../App';

describe('App', () => {
  it('renders smoke UI', () => {
    render(<App />);
    expect(screen.getByText('Ramen Tickets MVP')).toBeInTheDocument();
  });
});
