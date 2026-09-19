export function showToast(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
  document.getElementById('rsf-client-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'rsf-client-toast';
  toast.setAttribute('role', 'status');
  const bg = type === 'success' ? 'bg-emerald-800 text-white' : type === 'error' ? 'bg-red-800 text-white' : 'bg-[#0A192F] text-amber-200';
  toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-4 py-2.5 rounded-2xl text-xs font-medium shadow-xl flex items-start space-x-2 transition-all duration-300 ${bg}`;

  const icon = document.createElement('span');
  icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const text = document.createElement('span');
  text.textContent = message; // textContent: messages can contain server-supplied text
  toast.append(icon, text);

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, type === 'error' ? 6000 : 3500);
}
