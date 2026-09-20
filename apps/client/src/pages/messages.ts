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
    <div class="flex flex-col space-y-4 pb-4">
      <div>
        <h2 class="rsc-title">Messages</h2>
        <p class="rsc-subtitle mt-0.5">${adviser ? html`Your conversation with <strong class="font-semibold text-slate-800">${fullName(adviser)}</strong>. Replies appear here and as notifications.` : 'Your conversation with the Royal Square team.'}</p>
      </div>

      <div id="message-thread" class="rsc-card p-4 space-y-3 min-h-[260px] max-h-[55vh] overflow-y-auto">
        ${thread.length === 0
          ? html`<p class="rsc-muted text-center py-10">No messages yet. Ask your adviser anything.</p>`
          : thread.map((m) => {
              const mine = m.direction === 'client_to_royal';
              return html`<div class="flex ${mine ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[85%] rounded-xl px-3.5 py-2.5 ${mine ? 'bg-[#0A192F] text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}">
                  ${!mine ? html`<span class="block text-[11px] font-semibold text-slate-500 mb-0.5">${m.sender_name || 'Royal Square'}</span>` : ''}
                  <p class="text-[13px] leading-relaxed whitespace-pre-wrap">${m.body}</p>
                  <span class="block text-[11px] mt-1 ${mine ? 'text-slate-300' : 'text-slate-400'}">${formatDateTime(m.created_at)}</span>
                </div>
              </div>`;
            })}
      </div>

      <form id="message-form" class="rsc-card p-3 space-y-2.5"
        ${context?.requestId ? html`data-request-id="${context.requestId}"` : ''} ${context?.claimId ? html`data-claim-id="${context.claimId}"` : ''}>
        ${contextRequest || contextClaim
          ? html`<p class="rsc-muted">About <span class="font-semibold text-slate-800">${contextRequest ? `request ${contextRequest.request_number}` : `claim ${contextClaim?.claim_number}`}</span></p>`
          : ''}
        <label class="sr-only" for="message-input">Message</label>
        <textarea id="message-input" rows="3" required maxlength="4000" placeholder="Write a message to your adviser" class="rsc-input"></textarea>
        <div class="flex justify-end"><button type="submit" class="rsc-btn rsc-btn-primary rsc-btn-sm">Send message</button></div>
      </form>
    </div>
  `;
}
