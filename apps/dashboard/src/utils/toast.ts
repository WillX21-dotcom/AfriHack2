export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  document.getElementById('rsf-dashboard-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'rsf-dashboard-toast';
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  const tone = type === 'success' ? 'bg-emerald-800 text-white' : type === 'error' ? 'bg-rose-800 text-white' : 'bg-[#0A192F] text-amber-200';
  toast.className = `fixed top-5 left-1/2 -translate-x-1/2 z-[70] max-w-[90vw] px-4 py-2.5 rounded-full text-xs font-medium shadow-xl flex items-center space-x-2 transition-opacity duration-300 ${tone}`;

  const icon = document.createElement('span');
  icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const text = document.createElement('span');
  text.textContent = message; // textContent: messages can contain user-supplied text

  toast.append(icon, text);
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, type === 'error' ? 6000 : 3500);
}
