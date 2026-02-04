export type RecordType = 'ENTRADA' | 'SAIDA';

export interface AccessRecord {
  id: string;
  fleetNumber: string;
  collaboratorName: string;
  collaboratorCode: string;
  type: RecordType;
  timestamp: string; // ISO String
  destination: string;
  observation: string;
  materialExit: boolean;
  registeredBy: string;
  photo?: string; // Base64 string
}

export interface User {
  id: string;
  name: string;
  role: 'OPERADOR' | 'ADMIN';
}

export type ViewState = 'LOGIN' | 'CONTROL' | 'DASHBOARD';