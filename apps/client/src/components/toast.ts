export function showToast(message: string, type: 'success' | 'info' | 'error' = 'info'): void {
  document.getElementById('rsf-client-toast')?.remove();

  const toast = document.createElement('div');
  toast.id = 'rsf-client-toast';
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  const tone = type === 'success' ? 'bg-[#0A192F] text-white' : type === 'error' ? 'bg-red-700 text-white' : 'bg-white text-slate-800 border border-slate-200';
  toast.className = `fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm px-4 py-3 rounded-xl text-[13px] font-medium shadow-lg transition-opacity duration-300 ${tone}`;
  toast.textContent = message; // textContent: messages can contain server-supplied text

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, type === 'error' ? 6000 : 3500);
}
