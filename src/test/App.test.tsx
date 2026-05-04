import { render, screen } from '@testing-library/react';
import App from '../App';

// Reset localStorage before each test
beforeEach(() => localStorage.clear());

describe('App', () => {
  it('renders the simulator header', () => {
    render(<App />);
    expect(screen.getByText(/ラーメン券売機シミュレーター/)).toBeInTheDocument();
  });

  it('renders three panel headings', () => {
    render(<App />);
    expect(screen.getByText('券売機')).toBeInTheDocument();
    expect(screen.getByText('保守パネル')).toBeInTheDocument();
    expect(screen.getByText('厨房キュー')).toBeInTheDocument();
  });

  it('shows idle screen on first load', () => {
    render(<App />);
    expect(screen.getByText(/画面をタッチしてご注文をお始めください/)).toBeInTheDocument();
  });
});
