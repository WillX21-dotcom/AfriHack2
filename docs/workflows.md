# Royal Square Financial Workflows

## 1. Client Service Request Workflow
1. Client submits request (e.g. Policy Document, Address Change, Border Letter).
2. Database trigger `trg_generate_request_number` allocates `RSF-YYYYMMDD-XXXX`.
3. `initialize_request_workflow` generates initial 4 steps:
   - Step 1: Submitted (Completed)
   - Step 2: Royal Square Review (Pending)
   - Step 3: Processing (Pending)
   - Step 4: Completed (Pending)
4. Adviser receives real-time notification, inspects request in Dashboard.
5. Adviser assigns request, uploads deliverables, transitions workflow to 'completed'.
6. Client receives notification and status update in Client PWA.

## 2. Motor Accident Claim Workflow
1. Client experiences accident and initiates "Report Accident / Loss".
2. Incident details, time, location, damage description, vehicle details, police case number recorded.
3. Automated claim number `CLM-YYYYMMDD-XXXX` generated.
4. Timeline milestones created (`Reported` -> `Submitted` -> `Insurer received` -> `Handler assigned` -> `Assessment pending` -> `Authorised` -> `Repair in progress` -> `Vehicle ready` -> `Completed`).
5. Mock insurer webhook updates claim status asynchronously.
6. Client visualizes real-time progress on mobile timeline with insurer handler details.
