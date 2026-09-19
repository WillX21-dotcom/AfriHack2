import { formatDateTime, fullName, html, type SafeHtml } from '@shared/index';
import { dataStore } from '@supabase-pkg/client';
import { clientService } from '../services/client';
import { messageService } from '../services/message';

export function renderMessagesPage(context?: { requestId?: string; claimId?: string }): SafeHtml {
  const thread = messageService.getThread();
  const adviser = clientService.getAdviser();
  const state = dataStore.getState();
  const contextRequest = context?.requestId ? state.requests.find((r) => r.id === context.requestId) : null;
  const contextClaim = context?.claimId ? state.claims.find((c) => c.id === context.claimId) : null;

  return html`
    <div class="flex flex-col pb-24 space-y-3">
      <div>
        <h2 class="text-base font-bold text-slate-900">Messages</h2>
        <p class="text-xs text-slate-500">${adviser ? html`Your conversation with <strong>${fullName(adviser)}</strong>. Replies appear here and as notifications.` : 'Your conversation with the Royal Square team.'}</p>
      </div>

      <div id="message-thread" class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 space-y-3 min-h-[260px] max-h-[55vh] overflow-y-auto">
        ${thread.length === 0
          ? html`<p class="text-xs text-slate-400 text-center py-10">No messages yet. Ask your adviser anything.</p>`
          : thread.map((m) => {
              const mine = m.direction === 'client_to_royal';
              return html`<div class="flex ${mine ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${mine ? 'bg-[#0A192F] text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}">
                  ${!mine ? html`<span class="block text-[10px] font-bold text-amber-700 mb-0.5">${m.sender_name || 'Royal Square'}</span>` : ''}
                  <p class="whitespace-pre-wrap leading-relaxed">${m.body}</p>
                  <span class="block text-[10px] mt-1 ${mine ? 'text-slate-300' : 'text-slate-400'}">${formatDateTime(m.created_at)}</span>
                </div>
              </div>`;
            })}
      </div>

      <form id="message-form" class="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
        ${context?.requestId ? html`data-request-id="${context.requestId}"` : ''} ${context?.claimId ? html`data-claim-id="${context.claimId}"` : ''}>
        ${contextRequest || contextClaim
          ? html`<p class="text-[11px] text-slate-500">About: <strong>${contextRequest ? `request ${contextRequest.request_number}` : `claim ${contextClaim?.claim_number}`}</strong></p>`
          : ''}
        <textarea id="message-input" rows="3" required maxlength="4000" placeholder="Write a message to your adviser" class="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"></textarea>
        <div class="flex justify-end"><button type="submit" class="px-4 py-2 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800 disabled:opacity-60">Send message</button></div>
      </form>
    </div>
  `;
}
