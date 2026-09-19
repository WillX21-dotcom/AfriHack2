# Workflows

Each workflow is a single database function, so the client and the adviser always see the same state.

## Service request

1. **Client** submits a request (`create_client_request`): request `RSF-YYYYMMDD-XXXXXX`, 4 steps
   (Submitted ✓ → Royal Square review ▶ → Processing with provider → Completed), a task for the adviser and a notification.
2. **Adviser** opens it in *Requests* and uses **Complete step & advance** (`advance_request_workflow`), can add
   step notes, park it as *waiting on client / provider* (`set_request_status`), attach documents, or message the client.
3. Every status change notifies the client; on completion `completed_at` is stamped and the adviser's task is closed.

## Motor claim

1. **Client** reports the accident (`create_motor_claim`) with location, description, police case number, other
   driver, witness, photos and an optional voice statement (stored in the private vault against the claim).
   The insurer defaults to the provider on the client's active motor policy.
2. **Adviser** moves the claim through the shared stages (`packages/shared/src/constants/claim-stages.ts`) with
   `update_claim_status`, and records handler, insurer reference, assessment, repair and courtesy-vehicle details.
3. A trigger writes the client-visible timeline entry and notifies the client for every stage change. Internal
   notes can be added as non-client-visible timeline entries.

## Documents and onboarding

Clients upload ID and proof of address to their vault; advisers are notified, verify the documents, and sign off
`onboarding_completed`. The client's onboarding checklist is derived from those real records.

## Reminders and tasks

Advisers create reminders (FICA refreshes, annual reviews, policy renewals) per client. `process_due_reminders()`
notifies the client and adviser 48 hours ahead; recurring reminders roll forward when actioned.

## Messaging

One thread per client. Either side sends with `send_message`; the other is notified and unread counts are shown in both apps.
