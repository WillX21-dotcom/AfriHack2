# Royal Square Financial Edge Functions & API

## Endpoints / Edge Functions
- `create-request`: Validates and inserts client service request.
- `process-request`: Advisers update request stages and notifications.
- `create-claim`: Initiates motor vehicle or general loss claim.
- `submit-claim`: Dispatches claim to insurer integration adapter.
- `mock-insurer`: Simulates Discovery/Santam policy claim processing and handler assignments.
- `mock-provider`: Simulates investment balance synchronization from Allan Gray & Old Mutual.
- `update-claim-status`: Advances claim through assessment, authorisation, and repair stages.
- `create-reminder`: Schedules client compliance, valuation certificate, or licence renewals.
- `process-reminders`: Batch job to send alerts on maturing reminders.
- `send-notification`: Dispatches in-app, push, and mock email alerts.
- `mock-email`: Logs transactional emails with pre-built financial HTML templates.
- `generate-document`: Produces client summary and claim confirmation documentation.
- `provider-webhook`: Simulates inbound webhook updates from insurers.
