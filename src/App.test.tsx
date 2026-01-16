import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app with prototype label', () => {
  render(<App />);
  const labelElement = screen.getByText(/Prototype/i);
  expect(labelElement).toBeInTheDocument();
});