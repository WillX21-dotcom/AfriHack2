import { html } from '@shared/index';
import { icon } from './icons';

/** Full-screen camera. The ids are used by the app shell; keep them. Returns a markup string (mounted with raw()). */
export function renderCameraCaptureModal(): string {
  return html`
    <div id="camera-modal" class="fixed inset-0 z-50 bg-slate-950 flex flex-col hidden" role="dialog" aria-label="Take a photo">
      <div class="flex items-center justify-between px-4 h-14 text-white">
        <span class="text-sm font-semibold">Take a photo</span>
        <button id="close-camera-btn" class="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10" aria-label="Close camera">${icon('close', 'w-5 h-5', 2)}</button>
      </div>
      <div class="flex-1 relative overflow-hidden bg-black">
        <video id="camera-video-preview" autoplay playsinline class="w-full h-full object-cover"></video>
        <canvas id="camera-canvas" class="hidden"></canvas>
      </div>
      <div class="flex items-center justify-center py-6 pb-[max(env(safe-area-inset-bottom),24px)]">
        <button id="camera-snap-btn" class="w-16 h-16 rounded-full border-4 border-white bg-white/20 active:bg-white/40 transition-colors" aria-label="Capture photo"></button>
      </div>
    </div>
  `.toString();
}
