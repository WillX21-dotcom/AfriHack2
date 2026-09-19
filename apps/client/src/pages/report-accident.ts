export function renderReportAccidentPage(): string {
  return `
    <div class="space-y-4 pb-28">
      <!-- Emergency Assistance Alert Box -->
      <div class="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-900 shadow-xs">
        <div class="flex items-start space-x-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <h3 class="text-xs font-bold uppercase tracking-wide">Emergency Safety Advisory</h3>
            <p class="text-xs text-red-800/90 mt-0.5 leading-relaxed">
              If anyone is injured, immediately dial <strong>10177</strong> or <strong>112</strong>. Switch on hazard lights, set up your emergency warning triangle 45m behind your vehicle, and remain in a safe location.
            </p>
            <div class="flex space-x-2 mt-2 pt-2 border-t border-red-200/60">
              <a href="tel:112" class="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold shadow-xs">Call 112 (National Emergency)</a>
              <a href="tel:0860333777" class="px-3 py-1 bg-slate-900 text-amber-300 rounded-lg text-xs font-bold shadow-xs">Santam SOS Assist</a>
            </div>
          </div>
        </div>
      </div>

      <!-- Step-by-Step Accident Log Form -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div>
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 1 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Incident Scene & Coordinates</h2>
          <p class="text-xs text-slate-500">Provide the exact time and road or intersection</p>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1">Incident Date & Approximate Time</label>
          <input
            id="acc-date-input"
            type="datetime-local"
            class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs font-semibold text-slate-700">Location / Intersection</label>
            <button id="detect-gps-btn" type="button" class="text-[11px] text-amber-700 font-bold hover:underline flex items-center space-x-1">
              <span>📍 Detect Current GPS</span>
            </button>
          </div>
          <input
            id="acc-location-input"
            type="text"
            placeholder="e.g. Corner Rivonia Rd & Sandton Dr, Sandton"
            value="Corner Rivonia Rd & Sandton Dr, Sandton, Johannesburg"
            class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-700 block mb-1">Damage Description & Circumstances</label>
          <textarea
            id="acc-desc-input"
            rows="3"
            placeholder="Describe what occurred, impact direction, weather/road conditions, and visible vehicle damage..."
            class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 leading-relaxed"
          >Stationary at red traffic light. Third-party vehicle collided into rear bumper of BMW X5. Tailgate dented, reverse sensors disabled.</textarea>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 2 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Police SAPS Reporting</h2>
          <p class="text-xs text-slate-500">Motor accidents on public roads must be reported within 24 hours</p>
          
          <div class="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">SAPS Case Number (CAS)</label>
              <input id="acc-police-cas-input" type="text" placeholder="CAS 412/09/2025" value="CAS 412/09/2025" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Police Station</label>
              <input id="acc-police-station-input" type="text" placeholder="Sandton SAPS" value="Sandton SAPS" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 3 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Third-Party & Witnesses</h2>
          <p class="text-xs text-slate-500">Details of other driver involved</p>

          <div class="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Other Vehicle Reg</label>
              <input id="tp-reg-input" type="text" placeholder="GP 992-102" value="GP 992-102" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Make & Model</label>
              <input id="tp-make-input" type="text" placeholder="Toyota Hilux Double Cab" value="Toyota Hilux Double Cab" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Driver Name & Surname</label>
              <input id="tp-name-input" type="text" placeholder="Pieter Botha" value="Pieter Botha" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label class="text-[11px] font-semibold text-slate-600 block mb-1">Third-Party Insurer</label>
              <input id="tp-insurer-input" type="text" placeholder="Outsurance / MiWay" value="Outsurance" class="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
          </div>
        </div>

        <div class="border-t border-slate-100 pt-4">
          <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Step 4 of 4</span>
          <h2 class="text-sm font-bold text-slate-900">Scene Photos & Voice Statement</h2>
          <p class="text-xs text-slate-500">Upload accident scene damage or record audio notes</p>

          <div class="grid grid-cols-2 gap-2 mt-3">
            <button id="trigger-camera-btn" type="button" class="p-3 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 flex flex-col items-center justify-center text-amber-900">
              <span class="text-lg">📷</span>
              <span class="text-xs font-bold mt-1">Live Camera</span>
              <span class="text-[10px] text-amber-700">Take Photo</span>
            </button>
            <button id="trigger-mic-btn" type="button" class="p-3 border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-700">
              <span class="text-lg">🎙️</span>
              <span class="text-xs font-bold mt-1" id="mic-label">Record Voice Note</span>
              <span class="text-[10px] text-slate-500" id="mic-status">Tap to speak</span>
            </button>
          </div>
          <div id="captured-photos-strip" class="flex gap-2 mt-2 overflow-x-auto py-1">
            <div class="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 text-[10px] font-semibold">
              BMW Rear
            </div>
            <div class="w-16 h-16 rounded-xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 text-[10px] font-semibold">
              Hilux Front
            </div>
          </div>
        </div>

        <button
          id="submit-accident-claim-btn"
          class="w-full py-3.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 mt-2"
        >
          <span>Submit Motor Claim to Royal Square</span>
          <span>🚨</span>
        </button>
      </div>
    </div>
  `;
}
