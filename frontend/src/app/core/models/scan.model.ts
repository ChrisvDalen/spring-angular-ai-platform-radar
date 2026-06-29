export type ScanStatus = 'PENDING' | 'SCANNING' | 'COMPLETED' | 'FAILED';
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type FindingCategory = 'BACKEND' | 'FRONTEND' | 'SECURITY' | 'DEVOPS' | 'OBSERVABILITY' | 'PERFORMANCE' | 'DEPENDENCY';

export interface ScanFinding {
  id: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
}

export interface Scan {
  id: string;
  repoName: string;
  repoUrl: string;
  createdAt: string;
  completedAt: string | null;
  status: ScanStatus;
  healthScore: number | null;
  aiSummary: string | null;

  javaVersion: string | null;
  springBootVersion: string | null;
  springSecurityVersion: string | null;
  angularVersion: string | null;
  nodeVersion: string | null;

  zonelessEnabled: boolean | null;
  signalsUsed: boolean | null;
  dockerPresent: boolean | null;
  githubActionsPresent: boolean | null;
  openTelemetryPresent: boolean | null;
  dependabotPresent: boolean | null;

  findings: ScanFinding[];
}

export interface ScanRequest {
  repoUrl: string;
  branch?: string;
}

export interface PriorityAction {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  rationale: string;
}

export interface AdviceResponse {
  scanId: string;
  summary: string;
  quickWins: PriorityAction[];
  upgradePath: PriorityAction[];
  careerScore: string;
  careerNotes: string;
}

export function getHealthClass(score: number | null): string {
  if (score === null) return '';
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

export function getHealthLabel(score: number | null): string {
  if (score === null) return 'Onbekend';
  if (score >= 85) return 'Uitstekend';
  if (score >= 70) return 'Goed';
  if (score >= 50) return 'Matig';
  return 'Kritiek';
}
