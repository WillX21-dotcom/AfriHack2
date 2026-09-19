import './styles/main.css';
import { DashboardApp } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('dashboard-app');
  if (container) {
    new DashboardApp(container);
  }
});
