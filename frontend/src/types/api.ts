export type RiskLevel = 'high' | 'medium' | 'low';

export interface Finding {
  id: string;
  file_path: string;
  line: number;
  function_name: string;
  risk: RiskLevel | string;
  rule: string;
  title: string;
  rationale: string;
  suggested_code: string;
  status: string; // 'suggested' | 'approved_marker_applied'
}

export interface AuditSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
  [key: string]: number;
}

export interface AuditResponse {
  audit_id: string;
  source: string;
  findings: Finding[];
  summary: AuditSummary;
}

export interface PatchItem {
  finding_id: string;
  file_path: string;
  line: number;
  title: string;
  suggested_code: string;
  status: string;
}

export interface PatchesResponse {
  audit_id: string;
  approval_required: boolean;
  patches: PatchItem[];
}

export interface ApplyRequest {
  finding_ids: string[];
  approved: boolean;
}

export interface ApplyResponse {
  audit_id: string;
  applied_finding_ids: string[];
  changed_files: string[];
  message: string;
}

export interface GitHubAuditRequest {
  repo_url: string;
}

export interface HealthResponse {
  status: string;
}

export interface UserAccount {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: number;
  last_login_at: number | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: UserAccount;
}

export interface StoredAuditMeta {
  audit_id: string;
  source: string;
  createdAt: number;
  totalFindings: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  status: 'completed' | 'markers_applied';
}
