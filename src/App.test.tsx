import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app with MapR title', () => {
  render(<App />);
  const titleElement = screen.getByText(/MapR/i);
  expect(titleElement).toBeInTheDocument();
});