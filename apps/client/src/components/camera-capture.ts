export function renderCameraCaptureModal(): string {
  return `
    <div id="camera-modal" class="fixed inset-0 z-50 bg-black/80 flex flex-col justify-between p-4 hidden">
      <div class="flex justify-between items-center text-white">
        <span class="text-sm font-medium">Incident Scene Capture</span>
        <button id="close-camera-btn" class="p-2 text-slate-400 hover:text-white">✕</button>
      </div>
      <div class="flex-1 flex items-center justify-center relative overflow-hidden rounded-2xl bg-black my-4 border border-slate-700">
        <video id="camera-video-preview" autoplay playsinline class="w-full h-full object-cover"></video>
        <canvas id="camera-canvas" class="hidden"></canvas>
        <div class="absolute inset-0 pointer-events-none border-2 border-dashed border-amber-400/40 rounded-2xl m-4 flex items-center justify-center">
          <span class="text-xs text-amber-200/80 bg-black/60 px-3 py-1 rounded-full">Align vehicle license plate or damage</span>
        </div>
      </div>
      <div class="flex items-center justify-around pb-4">
        <button id="camera-switch-btn" class="p-3 bg-white/10 text-white rounded-full">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        </button>
        <button id="camera-snap-btn" class="w-18 h-18 rounded-full border-4 border-white bg-amber-500 hover:bg-amber-400 shadow-xl flex items-center justify-center text-slate-900 font-bold transition-transform active:scale-95">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
        <div class="w-12"></div>
      </div>
    </div>
  `;
}
