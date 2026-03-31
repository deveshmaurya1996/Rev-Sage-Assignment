export type DocumentStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";

export type DocumentType = "invoice" | "report" | "contract";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

export interface DocumentRecord {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: DocumentType;
  status: DocumentStatus;
  result: string | null;
  processorDisplayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentUpdateEvent {
  documentId: string;
  status: DocumentStatus;
  result: string | null;
  processorDisplayName: string | null;
  updatedAt: string;
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}
