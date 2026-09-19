import './styles/main.css';
import { ClientApp } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');
  if (container) {
    new ClientApp(container);
  }
});
