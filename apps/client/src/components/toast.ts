export function showToast(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
  const existing = document.getElementById('rsf-client-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'rsf-client-toast';
  const bg = type === 'success' ? 'bg-emerald-800 text-white' : type === 'error' ? 'bg-red-800 text-white' : 'bg-[#0A192F] text-amber-200';
  toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center space-x-2 transition-all duration-300 transform translate-y-0 opacity-100 ${bg}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
