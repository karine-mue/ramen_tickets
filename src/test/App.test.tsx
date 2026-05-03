import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders MVP heading and milestones', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Ramen Tickets MVP', level: 1 })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Issue 0 and Issue 1 establish the frontend baseline/i)
    ).toBeInTheDocument();

    expect(screen.getByText('Define ticket data model')).toBeInTheDocument();
    expect(screen.getByText('Add create/read ticket flows')).toBeInTheDocument();
    expect(screen.getByText('Connect persistence layer')).toBeInTheDocument();
  });
});
