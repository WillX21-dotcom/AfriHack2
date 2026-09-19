import { html, type SafeHtml } from '@shared/html';
import { formatDateTime, relativeTime } from '@shared/format';
import { adviserService } from '../services/adviser';
import { INPUT_CLASS, emptyState, pageHeading } from '../components/ui';

export function renderDashboardCommunicationsPage(selectedClientId: string | null, context: { requestId?: string; claimId?: string } = {}): SafeHtml {
  const conversations = adviserService.getConversations();
  const clients = adviserService.getClients();
  const selected = selectedClientId ? adviserService.getClient(selectedClientId) : null;
  const thread = selected ? conversations.find((c) => c.clientId === selected.id)?.messages ?? [] : [];
  const withoutThread = clients.filter((c) => !conversations.some((cv) => cv.clientId === c.id));

  return html`
    <div class="space-y-6">
      ${pageHeading('Client Messages', 'A private thread with each client. Replies reach the client app instantly and notify them.')}

      <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden self-start">
          <div class="p-3 border-b border-slate-100">
            <select id="new-conversation-select" class="${INPUT_CLASS}">
              <option value="">Start a new conversation…</option>
              ${withoutThread.map((c) => html`<option value="${c.id}">${adviserService.clientName(c.id)}</option>`)}
            </select>
          </div>
          <div class="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
            ${conversations.length === 0
              ? emptyState('No conversations yet')
              : conversations.map(
                  (cv) => html`
                    <button data-dash-nav="communications" data-id="${cv.clientId}" class="w-full text-left p-3.5 hover:bg-slate-50 transition-colors ${cv.clientId === selectedClientId ? 'bg-amber-50/60' : ''}">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-bold text-slate-900 truncate">${adviserService.clientName(cv.clientId)}</span>
                        <span class="text-[10px] text-slate-400 shrink-0">${relativeTime(cv.last.created_at)}</span>
                      </div>
                      <div class="flex items-center justify-between gap-2 mt-0.5">
                        <span class="text-[11px] text-slate-500 truncate">${cv.last.direction === 'royal_to_client' ? 'You: ' : ''}${cv.last.body}</span>
                        ${cv.unread ? html`<span class="min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[9px] font-bold flex items-center justify-center shrink-0">${cv.unread}</span>` : ''}
                      </div>
                    </button>
                  `
                )}
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col min-h-[420px]">
          ${!selected
            ? html`<div class="flex-1 flex items-center justify-center">${emptyState('Select a conversation', 'Choose a client on the left, or start a new conversation.')}</div>`
            : html`
              <div class="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-sm font-bold text-slate-900 truncate">${adviserService.clientName(selected.id)}</h3>
                  <p class="text-[11px] text-slate-400">${selected.client_number}${context.requestId ? ' · about a request' : ''}${context.claimId ? ' · about a claim' : ''}</p>
                </div>
                <button data-dash-nav="client-detail" data-id="${selected.id}" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0">Open client file →</button>
              </div>
              <div id="message-thread" class="flex-1 p-4 space-y-3 overflow-y-auto max-h-[52vh]">
                ${thread.length === 0
                  ? html`<p class="text-xs text-slate-400 text-center py-8">No messages yet. Say hello below.</p>`
                  : thread.map((m) => {
                      const mine = m.direction === 'royal_to_client';
                      return html`
                        <div class="flex ${mine ? 'justify-end' : 'justify-start'}">
                          <div class="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${mine ? 'bg-[#0A192F] text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}">
                            <p class="whitespace-pre-wrap break-words">${m.body}</p>
                            <p class="text-[10px] mt-1 ${mine ? 'text-slate-300' : 'text-slate-400'}">${m.sender_name || ''} · ${formatDateTime(m.created_at)}</p>
                          </div>
                        </div>
                      `;
                    })}
              </div>
              <form id="message-form" data-client="${selected.id}" data-request="${context.requestId || ''}" data-claim="${context.claimId || ''}" class="p-3 border-t border-slate-100 flex items-end gap-2">
                <textarea name="body" rows="2" required placeholder="Write a message to the client…" class="${INPUT_CLASS} flex-1"></textarea>
                <button type="submit" class="px-5 py-2.5 bg-[#0A192F] text-amber-300 text-xs font-bold rounded-xl hover:bg-slate-800">Send</button>
              </form>
            `}
        </div>
      </div>
    </div>
  `;
}
