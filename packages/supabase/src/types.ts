import { Profile } from '../../shared/src/types/user';
import { Client } from '../../shared/src/types/client';
import { Asset } from '../../shared/src/types/asset';
import { Liability } from '../../shared/src/types/liability';
import { Income } from '../../shared/src/types/income';
import { Expense } from '../../shared/src/types/expense';
import { Policy } from '../../shared/src/types/policy';
import { Investment } from '../../shared/src/types/investment';
import { Goal } from '../../shared/src/types/goal';
import { Request } from '../../shared/src/types/request';
import { RequestWorkflow } from '../../shared/src/types/workflow';
import { Claim, ClaimTimeline, ClaimVehicle, ClaimWitness } from '../../shared/src/types/claim';
import { DocumentEvent, DocumentRecord } from '../../shared/src/types/document';
import { Task } from '../../shared/src/types/task';
import { Reminder } from '../../shared/src/types/reminder';
import { Notification } from '../../shared/src/types/notification';
import { Message } from '../../shared/src/types/message';
import { Provider } from '../../shared/src/types/provider';
import { AuditLog } from '../../shared/src/types/audit';

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      assets: { Row: Asset; Insert: Partial<Asset>; Update: Partial<Asset> };
      liabilities: { Row: Liability; Insert: Partial<Liability>; Update: Partial<Liability> };
      income: { Row: Income; Insert: Partial<Income>; Update: Partial<Income> };
      expenses: { Row: Expense; Insert: Partial<Expense>; Update: Partial<Expense> };
      policies: { Row: Policy; Insert: Partial<Policy>; Update: Partial<Policy> };
      investments: { Row: Investment; Insert: Partial<Investment>; Update: Partial<Investment> };
      goals: { Row: Goal; Insert: Partial<Goal>; Update: Partial<Goal> };
      requests: { Row: Request; Insert: Partial<Request>; Update: Partial<Request> };
      request_workflows: { Row: RequestWorkflow; Insert: Partial<RequestWorkflow>; Update: Partial<RequestWorkflow> };
      claims: { Row: Claim; Insert: Partial<Claim>; Update: Partial<Claim> };
      claim_timeline: { Row: ClaimTimeline; Insert: Partial<ClaimTimeline>; Update: Partial<ClaimTimeline> };
      claim_witnesses: { Row: ClaimWitness; Insert: Partial<ClaimWitness>; Update: Partial<ClaimWitness> };
      claim_vehicles: { Row: ClaimVehicle; Insert: Partial<ClaimVehicle>; Update: Partial<ClaimVehicle> };
      documents: { Row: DocumentRecord; Insert: Partial<DocumentRecord>; Update: Partial<DocumentRecord> };
      document_events: { Row: DocumentEvent; Insert: Partial<DocumentEvent>; Update: Partial<DocumentEvent> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      reminders: { Row: Reminder; Insert: Partial<Reminder>; Update: Partial<Reminder> };
      notifications: { Row: Notification; Insert: Partial<Notification>; Update: Partial<Notification> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      providers: { Row: Provider; Insert: Partial<Provider>; Update: Partial<Provider> };
      audit_logs: { Row: AuditLog; Insert: Partial<AuditLog>; Update: Partial<AuditLog> };
    };
  };
}
